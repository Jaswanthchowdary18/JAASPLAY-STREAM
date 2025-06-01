import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import './TitleCards.css';
import { FaPlay, FaStar, FaPlus, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const TitleCards = forwardRef(({ title, category, cardSize = 'medium', urlParam = '', customData = null, movieTitles = null, sectionId, isActive, setFocusedSection, onFocusChange }, ref) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusedCardIndex, setFocusedCardIndex] = useState(0); // State for horizontal focus
  const cardsContainerRef = useRef(null);
  const navigate = useNavigate();

  // For handling continuous key presses
  const keyPressTimer = useRef(null); // Timer for initial delay before continuous movement
  const keyPressInterval = useRef(null); // Interval for continuous movement
  const initialDelay = 300; // ms before continuous movement starts
  const repeatRate = 100; // ms between movements during continuous press

  // Expose focus method to parent (Home.jsx)
  // This allows Home.jsx to tell TitleCards which card to focus when it becomes active.
  useImperativeHandle(ref, () => ({
    focus: (initialIndex = 0) => {
      if (cardsContainerRef.current && movies.length > 0) {
        // Ensure initialIndex is within valid bounds
        const indexToFocus = Math.min(Math.max(0, initialIndex), movies.length - 1);
        setFocusedCardIndex(indexToFocus);
        // Delay focusing to ensure DOM update and smooth scrolling
        setTimeout(() => {
          const cardToFocus = cardsContainerRef.current.querySelector(`.movie-card[data-index="${indexToFocus}"]`);
          if (cardToFocus) {
            cardToFocus.focus(); // Explicitly focus the DOM element
            cardToFocus.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }, 0);
      }
    },
  }));

  const TMDB_API_OPTIONS = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZjJmOWQ2ZWNkY2IxMmZmZTI2MmJmZGJiYTIxODJkYiIsIm5iZiI6MTc0ODQyMzk2NC40NDgsInN1YiI6IjY4MzZkNTFjM2UzYTI0MjUxYzA1NjI2MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.LIWbgAk0WKk7b56JPGWhLt38YNwHBEh0PjKwyrTaZ7A`
    }
  };

  // Effect to fetch movie data based on category, customData, or movieTitles
  useEffect(() => {
    const fetchMovieData = async () => {
      setLoading(true);
      setError(null);

      if (customData) {
        console.log('TitleCards: Using customData.');
        setMovies(customData.slice(0, 17));
        setLoading(false);
        return;
      }

      if (movieTitles && movieTitles.length > 0) {
        console.log('TitleCards: Processing AI suggested movie titles:', movieTitles);
        const fetchedMovies = [];
        for (const movieTitle of movieTitles) {
          try {
            const searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(movieTitle)}&include_adult=false&language=en-US&page=1`;
            console.log(`TitleCards: Searching TMDB for "${movieTitle}" at URL: ${searchUrl}`);
            const response = await fetch(searchUrl, TMDB_API_OPTIONS);

            if (!response.ok) {
              console.warn(`TitleCards: Failed to search for "${movieTitle}": ${response.status}`);
              continue;
            }

            const data = await response.json();
            console.log(`TitleCards: TMDB search results for "${movieTitle}":`, data.results);
            const foundMovie = data.results.find(movie => movie.poster_path);

            if (foundMovie) {
              console.log(`TitleCards: Found movie with poster for "${movieTitle}":`, foundMovie.title);
              fetchedMovies.push(foundMovie);
            } else {
              console.warn(`TitleCards: No suitable movie (with poster) found for title: "${movieTitle}"`);
            }
          } catch (searchError) {
            console.error(`TitleCards: Error searching for movie "${movieTitle}":`, searchError);
          }
        }
        console.log('TitleCards: Final fetched movies from AI suggestions:', fetchedMovies);
        setMovies(fetchedMovies.slice(0, 17));
        setLoading(false);
        return;
      }

      if (category) {
        console.log('TitleCards: Fetching by category:', category);
        try {
          const url = `https://api.themoviedb.org/3/movie/${category}?language=en-US&page=1${urlParam ? `&${urlParam}` : ''}`;
          const response = await fetch(url, TMDB_API_OPTIONS);

          if (!response.ok) {
            throw new Error(`Failed to fetch ${category} movies: ${response.status}`);
          }

          const data = await response.json();
          const validMovies = data.results.filter(movie => movie.poster_path);
          setMovies(validMovies.slice(0, 17));
        } catch (fetchError) {
          console.error(`Error fetching ${category} movies:`, fetchError);
          setError(`Failed to load ${title}. Please try again later.`);
        } finally {
          setLoading(false);
        }
      } else {
        console.warn('TitleCards: No data source provided (customData, movieTitles, or category).');
        setLoading(false);
        setError('No data source provided for TitleCards.');
      }
    };

    fetchMovieData();
  }, [category, urlParam, customData, movieTitles, title]);

  // When focusedCardIndex changes, inform parent and scroll to the card
  useEffect(() => {
    if (isActive && movies.length > 0 && focusedCardIndex >= 0 && focusedCardIndex < movies.length) {
      // Inform Home.jsx of the currently focused card so it can remember for later
      onFocusChange(sectionId, focusedCardIndex);
      const currentCard = cardsContainerRef.current?.querySelector(`.movie-card[data-index="${focusedCardIndex}"]`);
      if (currentCard) {
        currentCard.focus(); // Explicitly focus the DOM element
        currentCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [focusedCardIndex, isActive, movies.length, onFocusChange, sectionId]);


  const handleCardClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  // Function to move focus horizontally (used by keydown handler)
  const moveFocus = useCallback((direction) => {
    setFocusedCardIndex(prevIndex => {
      let newIndex = prevIndex;
      if (direction === 'right') {
        newIndex = (prevIndex + 1) % movies.length; // Circular loop
      } else if (direction === 'left') {
        newIndex = (prevIndex - 1 + movies.length) % movies.length; // Circular loop
      }
      return newIndex;
    });
  }, [movies.length]);

  // --- Keyboard Navigation Logic for TitleCards (Horizontal Navigation) ---
  const handleKeyDown = useCallback((e) => {
    // Only respond if this section is active and has movies
    if (!isActive || movies.length === 0) return;

    const isHorizontalKey = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
    const isVerticalKey = e.key === 'ArrowUp' || e.key === 'ArrowDown';

    if (isHorizontalKey) {
      e.preventDefault(); // Prevent default browser scrolling for horizontal keys

      if (e.repeat) {
        // If key is held down and interval is not running, start it
        if (!keyPressInterval.current) {
          // If timer for initial delay is not set, set it
          if (!keyPressTimer.current) {
            keyPressTimer.current = setTimeout(() => {
              moveFocus(e.key === 'ArrowRight' ? 'right' : 'left'); // Move once after initial delay
              keyPressInterval.current = setInterval(() => {
                moveFocus(e.key === 'ArrowRight' ? 'right' : 'left');
              }, repeatRate);
            }, initialDelay);
          }
        }
      } else {
        // Initial key press (e.repeat is false)
        // Clear any lingering timers from previous presses (safety)
        clearTimeout(keyPressTimer.current);
        clearInterval(keyPressInterval.current);
        keyPressTimer.current = null;
        keyPressInterval.current = null;

        moveFocus(e.key === 'ArrowRight' ? 'right' : 'left'); // Perform initial move
      }
    } else if (isVerticalKey) {
      e.preventDefault(); // Prevent default browser scrolling for vertical keys
      // Delegate vertical navigation to parent (Home.jsx) by letting Home's keydown handle it.
      // We don't need to explicitly call setFocusedSection here, as Home's global listener will catch it.
    } else if (e.key === 'Enter') {
      const focusedCard = cardsContainerRef.current?.querySelector(`.movie-card[data-index="${focusedCardIndex}"]`);
      if (focusedCard) {
        focusedCard.click(); // Simulate a click on the focused card
        e.preventDefault();
      }
    }
  }, [isActive, movies.length, focusedCardIndex, moveFocus]);

  // Handle keyup event to stop continuous movement
  const handleKeyUp = useCallback((e) => {
    // Clear timers when key is released
    clearTimeout(keyPressTimer.current);
    clearInterval(keyPressInterval.current);
    keyPressTimer.current = null;
    keyPressInterval.current = null;
  }, []);

  // Add and remove keyboard event listeners for this component
  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clean up timers when component unmounts or becomes inactive
      clearTimeout(keyPressTimer.current);
      clearInterval(keyPressInterval.current);
    };
  }, [handleKeyDown, handleKeyUp, isActive]);


  if (loading) {
    return (
      <div className="title-cards" ref={cardsContainerRef}>
        <h2 className="section-title">{title}</h2>
        <div className="cards-container loading">
          {[...Array(17)].map((_, i) => (
            <div key={i} className={`card-skeleton ${cardSize}`}></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="title-cards" ref={cardsContainerRef}>
        <h2 className="section-title">{title}</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="title-cards" ref={cardsContainerRef}>
        <h2 className="section-title">{title}</h2>
        <div className="no-results-message">No movies found for this selection.</div>
      </div>
    );
  }

  return (
    <div
      className="title-cards"
      ref={cardsContainerRef}
      role="region"
      aria-label={`${title} movie section`}
      tabIndex={isActive ? 0 : -1} // Make the section itself focusable if active
      onFocus={() => {
        // If this section receives focus (e.g., via Tab key or explicit focus from parent)
        if (!isActive) {
          setFocusedSection(sectionId); // Inform parent that this section is now active
        }
        // If there are movies, ensure a card is focused within this section
        if (movies.length > 0 && focusedCardIndex === -1) {
          setFocusedCardIndex(0); // Default to the first card if no card was previously focused
        }
      }}
    >
      <h2 className="section-title">{title}</h2>
      <div className="cards-container">
        {movies.map((movie, index) => (
          <div
            key={movie.id}
            className={`movie-card ${cardSize} ${isActive && focusedCardIndex === index ? 'focused' : ''}`}
            onClick={() => handleCardClick(movie.id)}
            data-index={index} // Add data-index for easy selection
            // Only the currently focused card within the active section should be tab-focusable
            tabIndex={isActive && focusedCardIndex === index ? 0 : -1}
            onFocus={() => {
              // When a card within this section receives focus (e.g., by tab or explicit focus)
              if (isActive && focusedCardIndex !== index) {
                setFocusedCardIndex(index); // Update local state if focus changed within the row
              } else if (!isActive) {
                // If this card is focused but the section isn't active, activate the section
                setFocusedSection(sectionId);
                setFocusedCardIndex(index);
              }
            }}
          >
            <div className="card-image">
              <img
                src={movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : 'https://placehold.co/500x750/000000/FFFFFF?text=No+Poster'}
                alt={movie.title}
                onError={(e) => {
                  e.target.src = 'https://placehold.co/500x750/000000/FFFFFF?text=No+Poster';
                }}
              />
              <div className="card-overlay">
                <button className="play-button" tabIndex={-1}> {/* Make overlay buttons not directly tab-focusable */}
                  <FaPlay className="play-icon" />
                  <span>Play</span>
                </button>
                <button className="info-button" tabIndex={-1}>
                  <FaInfoCircle />
                </button>
              </div>
            </div>
            <div className="card-details">
              <h3 className="movie-title">{movie.title}</h3>
              <div className="movie-rating">
                <FaStar className="star-icon" />
                <span>{movie.vote_average?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default TitleCards;