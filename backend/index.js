// backend/index.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const usedPokemon = {
  easy: new Set(),
  medium: new Set(),
  hard: new Set(),
};

const generationMap = {
  easy: [1, 2, 3],
  medium: [4, 5, 6],
  hard: [7, 8, 9],
};

async function getPokemonData(difficulty) {
  let selected = null;

  // Loop until an unused Pokémon is found
  while (!selected || usedPokemon[difficulty].has(selected.name)) {
    const genNum = generationMap[difficulty][Math.floor(Math.random() * generationMap[difficulty].length)];
    const genUrl = `https://pokeapi.co/api/v2/generation/${genNum}`;
    const genData = await axios.get(genUrl);
    const speciesList = genData.data.pokemon_species;
    const species = speciesList[Math.floor(Math.random() * speciesList.length)];
    const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${species.name}`);
    selected = pokeRes.data;
  }

  usedPokemon[difficulty].add(selected.name);
  return selected;
}

async function calculateWeaknesses(types) {
  const typeData = await Promise.all(
    types.map(t => axios.get(`https://pokeapi.co/api/v2/type/${t.type.name}`))
  );

  const weaknesses = new Set();
  const resistances = new Set();
  const immunities = new Set();

  typeData.forEach(t => {
    t.data.damage_relations.double_damage_from.forEach(x => weaknesses.add(x.name));
    t.data.damage_relations.half_damage_from.forEach(x => resistances.add(x.name));
    t.data.damage_relations.no_damage_from.forEach(x => immunities.add(x.name));
  });

  immunities.forEach(x => weaknesses.delete(x));
  resistances.forEach(x => weaknesses.delete(x));
  return Array.from(weaknesses);
}


// async function getLocation(pokemonName) {
//   const locUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonName}/encounters`;
//   const res = await axios.get(locUrl);
//   if (res.data.length > 0) {
//     return res.data[0].location_area.name.replace(/-/g, ' ');
//   }
//   return 'Unknown';
// }
const getLocation = async (pokemonId) => {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/encounters`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return 'Unknown';
    }

    // Try to get the most relevant and first known area
    const firstLocation = data.find((loc) => loc.location_area.name);
    if (firstLocation) {
      // Format: Convert kebab-case to Title Case for better display
      return firstLocation.location_area.name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return 'Unknown';
  } catch (err) {
    console.error(`Error fetching encounter location for Pokémon ID ${pokemonId}:`, err);
    return 'Unknown';
  }
};

async function getEvolutionStage(speciesUrl) {
  const speciesRes = await axios.get(speciesUrl);
  const evoChainUrl = speciesRes.data.evolution_chain.url;
  const evoChainRes = await axios.get(evoChainUrl);
  let stage = 1;
  let found = false;

  function findStage(chain, depth) {
    if (chain.species.name === speciesRes.data.name) {
      stage = depth;
      found = true;
      return;
    }
    for (let evo of chain.evolves_to) {
      findStage(evo, depth + 1);
      if (found) break;
    }
  }

  findStage(evoChainRes.data.chain, 1);
  return stage;
}



app.get('/api/quiz/:difficulty', async (req, res) => {
  const { difficulty } = req.params;
  const poke = await getPokemonData(difficulty);
  const speciesRes = await axios.get(poke.species.url);
  const generation = (speciesRes.data.generation.name).toUpperCase();
  const types = poke.types.map(t => t.type.name).join('/');
  const move = poke.moves[Math.floor(Math.random() * poke.moves.length)].move.name;
  
  const ability = poke.abilities[Math.floor(Math.random() * poke.abilities.length)].ability.name;
  const bst = poke.stats.reduce((acc, s) => acc + s.base_stat, 0);
  const location = await getLocation(poke.name);
  const pokedex = speciesRes.data.pokedex_numbers.find(p => p.pokedex.name === 'national')?.entry_number || 'N/A';
  const stage = await getEvolutionStage(poke.species.url);

//   let genus = 'Unknown species';
// if (speciesData.genera && Array.isArray(speciesData.genera)) {
//   const genusEntry = speciesData.genera.find(
//     (g) => g.language.name === 'en'
//   );
//   if (genusEntry) {
//     genus = genusEntry.genus;
//   }
// }

  let clues = [];
  if (difficulty === 'hard') {
    const weakTo = await calculateWeaknesses(poke.types);
    clues = [
      `Weak to: ${weakTo.join(', ')}`,
      `Move: ${move}`,
      `Ability: ${ability}`,
      `Base Stat Total: ${bst}`,
      `Species: ${speciesRes.data.genera[7].genus}`,
      `National Dex No: ${pokedex}`,
    ];
  } else if (difficulty === 'medium') {
    clues = [
      `Type: ${types}`,
      `Evolution Stage: ${stage}`,
      `Generation: ${generation}`,
      `Species: ${speciesRes.data.genera[7].genus}`,
      `Starts with: ${poke.name[0].toUpperCase()} and ends with: ${poke.name.slice(-1).toUpperCase()}`,
      poke.sprites.front_default.replace('media', 'media/silhouette'),
    ];
  } else {

    let pokedexEntry=speciesRes.data.flavor_text_entries.find(f => f.language.name === 'en')?.flavor_text || 'N/A';
    pokedexEntry = pokedexEntry.replace(/\f/g, ' ');
    const regex = new RegExp(`\\b${poke.name}\\b`, 'gi');
pokedexEntry = pokedexEntry.replace(regex, 'this Pokémon');

    clues = [
      `Generation: ${generation}`,
      `Type: ${types}`,
      `Evolution Stage: ${stage}`,
      `Pokedex Entry: ${pokedexEntry}`,
      `Starts with: ${poke.name[0].toUpperCase()} and ends with: ${poke.name.slice(-1).toUpperCase()}`,
      poke.sprites.front_default.replace('media', 'media/silhouette'),
    ];
  }

  res.json({ name: poke.name, clues, pokedex });
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
