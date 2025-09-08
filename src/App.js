// App.js
import React, { useState, useEffect } from 'react';
import HomeButton from './HomeButton.js';
import './App.css';
import { Routes, Route } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api/quiz';

function App() {
  const [previousGuesses, setPreviousGuesses] = useState([]);
  const [difficulty, setDifficulty] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [clueIndex, setClueIndex] = useState(1);
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState({ easy: 0, medium: 0, hard: 0 });
  const [revealed, setRevealed] = useState(false);
  const [allPokemon, setAllPokemon] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  useEffect(() => {
  // Fetch all Pokémon names only once
  const fetchAllPokemon = async () => {
    const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1008');
    const data = await res.json();
    setAllPokemon(data.results.map((p) => p.name));
    };
  fetchAllPokemon();
  }, []);

  const startGame = async (level) => {
    const res = await fetch(`${API_URL}/${level}`);
    const data = await res.json();
    setQuiz(data);
    setDifficulty(level);
    setClueIndex(1);
    setGuess('');
    setRevealed(false);
    setPreviousGuesses([]);
  };



const handleGuess = () => {
  const cleanedGuess = guess.trim().toLowerCase();

  if (previousGuesses.includes(cleanedGuess)) {
    alert('You already guessed that!');
    return;
  }

  setPreviousGuesses([...previousGuesses, cleanedGuess]);

  if (cleanedGuess === quiz.name.toLowerCase()) {
    setScore((prev) => ({ ...prev, [difficulty]: prev[difficulty] + 1 }));
    setRevealed(true);
  } else if (clueIndex < quiz.clues.length) {
    setClueIndex(clueIndex + 1);
    setGuess('');
  } else {
    setRevealed(true);
  }
};

  const handleNext = () => {
    startGame(difficulty);
  };

  if (!difficulty) {
    return (
      <div className="landing">
        <h1>Pokémon Quiz</h1>
        <div className="options">
          <button onClick={() => startGame('easy')}>Easy</button>
          <button onClick={() => startGame('medium')}>Medium</button>
          <button onClick={() => startGame('hard')}>Hard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <HomeButton goHome={() => setDifficulty(null)} />
      <h2>Difficulty: {difficulty.toUpperCase()}</h2>
      <div className="clues">
        {quiz.clues.slice(0, clueIndex).map((clue, index) =>
          clue.includes('https://') ? (
            <img key={index} src={clue} alt="silhouette" className="silhouette" />
          ) : (
            <p key={index}>{clue}</p>
          )
        )}
      </div>

      {!revealed ? (
        // <div className="guess-box">
        //   <input
        //     type="text"
        //     value={guess}
        //     onChange={(e) => setGuess(e.target.value)}
        //     placeholder="Your guess"
        //   />
        //   <button onClick={handleGuess}>Guess</button>
        // </div>
  //       <div className="guess-box">
  // <input
  //   type="text"
  //   value={guess}
  //   onChange={(e) => {
  //     const input = e.target.value.toLowerCase();
  //     setGuess(input);
  //     if (input.length >= 1) {
  //       const filtered = allPokemon.filter((name) =>
  //         name.toLowerCase().startsWith(input)
  //       );
  //       setFilteredSuggestions(filtered.slice(0, 5)); // limit to 5 suggestions
  //     } else {
  //       setFilteredSuggestions([]);
  //     }
  //   }}
  //   placeholder="Start typing a Pokémon name"
  //   className="autocomplete-input"
  // />
  // <button onClick={handleGuess}>Guess</button>
  // {filteredSuggestions.length > 0 && (
  //   <ul className="autocomplete-list">
  //     {filteredSuggestions.map((name) => (
  //       <li
  //         key={name}
  //         onClick={() => {
  //           setGuess(name);
  //           setFilteredSuggestions([]);
  //         }}
  //       >
  //         {name.charAt(0).toUpperCase() + name.slice(1)}
  //       </li>
  //     ))}
  //   </ul>
  // )}
  <div className="autocomplete-container">
  <input
    type="text"
    value={guess}
    onChange={(e) => {
      const input = e.target.value.toLowerCase();
      setGuess(input);
      if (input.length >= 1) {
        const filtered = allPokemon.filter((name) =>
          name.toLowerCase().startsWith(input)
        );
        setFilteredSuggestions(filtered.slice(0, 5));
      } else {
        setFilteredSuggestions([]);
      }
    }}
    placeholder="Start typing a Pokémon name"
    className="autocomplete-input"
  />
  <button onClick={handleGuess} className="guess-button">Guess</button>

  {previousGuesses.length > 0 && (
   <div className="previous-guesses">
     <strong>Previous Guesses:</strong>
     <ul>
      {previousGuesses.map((g, i) => (
        <li key={i}>{g.charAt(0).toUpperCase() + g.slice(1)}</li>
      ))}
     </ul>
   </div>
  )}
  {filteredSuggestions.length > 0 && (
    <ul className="autocomplete-list">
      {filteredSuggestions.map((name) => (
        <li
          key={name}
          onClick={() => {
            setGuess(name);
            setFilteredSuggestions([]);
          }}
        >
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </li>
      ))}
    </ul>
  )}
</div>

      ) : (
        <div>
          <p className="score">
            {guess.toLowerCase() === quiz.name.toLowerCase()
              ? '🎉 Correct!'
              : `❌ Wrong! The correct answer was ${quiz.name.toUpperCase()}`}
          </p>
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${quiz.pokedex}.png`}
            alt={quiz.name}
            className="silhouette"
            style={{ filter: 'none' }}
          />
          <button onClick={handleNext}>Next Pokémon</button>
        </div>
      )}

      <p className="score">
  Score: Easy: {score.easy} | Medium: {score.medium} | Hard: {score.hard}
</p>
    </div>
  );
}

export default App;
