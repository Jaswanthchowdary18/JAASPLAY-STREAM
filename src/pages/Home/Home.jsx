import React, { useEffect, useState, useRef, useCallback } from 'react';
import './Home.css';
import Navbar from '../../components/Navbar/Navbar';
import play_icon from '../../assets/play_icon.png';
import info_icon from '../../assets/info_icon.png';
import add_icon from '../../assets/plus_icon.png';
import TitleCards from '../../components/TitleCards/TitleCards';
import Footer from '../../components/Footer/Footer';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [heroMovie, setHeroMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [genres, setGenres] = useState([]);
  const [aiSuggestedMovieTitles, setAiSuggestedMovieTitles] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const navigate = useNavigate();

  // State to manage the currently focused section (vertical navigation)
  const [focusedSection, setFocusedSection] = useState('hero'); // 'hero', 'ai', 'blockbuster', 'netflix', 'upcoming', 'top_picks'

  // State to store the last focused card index for each TitleCards section
  const [lastFocusedCardIndexes, setLastFocusedCardIndexes] = useState({});

  // Refs for each navigable section
  const heroRef = useRef(null);
  const aiSectionRef = useRef(null);
  const blockbusterRef = useRef(null);
  const netflixRef = useRef(null);
  const upcomingRef = useRef(null);
  const topPicksRef = useRef(null);

  
  const TMDB_API_OPTIONS = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZjJmOWQ2ZWNkY2IxMmZmZTI2MmJmZGJiYTIxODJkYiIsIm5iZiI6MTc0ODQyMzk2NC40NDgsInN1YiI6IjY4MzZkNTFjM2UzYTI0MjUxYzA1NjI2MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.LIWbgAk0WKk7b56JPGWhLt38YNwHBEh0PjKwyrTaZ7A`
    }
  };

  // Effect to fetch hero movie data on component mount
  useEffect(() => {
    const fetchHeroMovie = async () => {
      try {
        setLoading(true);
        const [movieResponse, genreResponse] = await Promise.all([
          fetch('https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1', TMDB_API_OPTIONS),
          fetch('https://api.themoviedb.org/3/genre/movie/list?language=en', TMDB_API_OPTIONS)
        ]);

        if (!movieResponse.ok) throw new Error(`HTTP error! status: ${movieResponse.status}`);
        if (!genreResponse.ok) throw new Error(`HTTP error! status: ${genreResponse.status}`);

        const [movieData, genreData] = await Promise.all([
          movieResponse.json(),
          genreResponse.json()
        ]);

        const moviesWithBackdrop = movieData.results.filter(movie => movie.backdrop_path);
        if (moviesWithBackdrop.length > 0) {
          const randomIndex = Math.floor(Math.random() * moviesWithBackdrop.length);
          const selectedMovie = moviesWithBackdrop[randomIndex];
          setHeroMovie(selectedMovie);

          const movieGenres = genreData.genres.filter(genre =>
            selectedMovie.genre_ids.includes(genre.id)
          );
          setGenres(movieGenres);
        } else {
          setError('No top-rated movies with backdrop found.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHeroMovie();
  }, []);

  // Handler for AI movie suggestion requests
  const handleAISuggestionRequest = async ({ genre, timePeriod, nationality }) => {
    setAiLoading(true);
    setAiError('');
    setAiSuggestedMovieTitles([]);
    
    // Immediately scroll down 300px
    if (window.scrollY <= 300) {
      window.scrollBy({
        top: 500,
        behavior: 'smooth'
  });
}
    
    // Also set focus to AI section
    setFocusedSection('ai');

    const prompt = `Suggest a minimum of 8 movies that are ${genre} from the ${timePeriod} period and are of ${nationality} nationality. Provide ONLY the movie titles as a strict JSON array of strings. For example: ["Movie Title 1", "Movie Title 2", "Movie Title 3"]. Do not include any other text or formatting.`;

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });

      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "STRING"
            }
          }
        }
      };

      const apiKey = "AIzaSyCrtqH8ap9mx7N4v6C1u5CbygmyvoqoBxI"; // Your Gemini API Key
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      console.log('AI Suggestion Request Payload:', payload);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AI API Error Response:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('AI API Raw Result:', result);

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        console.log('AI API JSON String (from content.parts[0].text):', jsonString);

        try {
          const movies = JSON.parse(jsonString);
          console.log('Parsed AI Suggested Movies:', movies);

          if (Array.isArray(movies) && movies.length > 0) {
            setAiSuggestedMovieTitles(movies);
          } else {
            setAiError('AI returned no relevant movie suggestions or an empty list. Please try different choices.');
          }
        } catch (parseError) {
          console.error('Error parsing AI response JSON:', parseError);
          setAiError('Failed to parse AI movie suggestions. The AI might have returned malformed JSON.');
        }
      } else {
        setAiError('AI did not return any content. Please try again.');
      }
    } catch (err) {
      console.error("Error fetching AI movie suggestions:", err);
      setAiError(`Error getting AI suggestions: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddToWatchlist = () => {
    console.log('Added to watchlist:', heroMovie?.title);
  };

  const handleMoreDetails = () => {
    if (heroMovie) {
      navigate(`/movie/${heroMovie.id}`);
    }
  };

  return (
    <div className='Home'>
      <Navbar onSuggestMovies={handleAISuggestionRequest} />

      {loading ? (
        <div className="hero loading" ref={heroRef} >
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="hero error" ref={heroRef}>
          <p>{error}</p>
        </div>
      ) : (
        <div
          className="hero"
          ref={heroRef}
          role="region"
          aria-label="Hero Movie Banner"
        >
          <div className="hero-backdrop">
            {heroMovie?.backdrop_path ? (
              <img
                src={`https://image.tmdb.org/t/p/original${heroMovie.backdrop_path}`}
                alt={heroMovie?.title || 'Hero Banner'}
                className='banner-img'
                onError={(e) => { e.target.src = 'https://via.placeholder.co/1280x720?text=Image+Not+Available'; }}
              />
            ) : (
              <img
                src='https://via.placeholder.co/1280x720?text=No+Backdrop+Available'
                alt='Placeholder Banner'
                className='banner-img'
              />
            )}
            <div className="backdrop-overlay"></div>
          </div>
          <div className="hero-content">
            <div className="hero-info">
              <h1 className='caption-title'>{heroMovie?.title || heroMovie?.original_title || 'Movie Title'}</h1>
              <div className="hero-meta-container">
                <div className="hero-meta">
                  <span className="rating">{Math.round(heroMovie?.vote_average * 10) / 10 || 'N/A'}/10</span>
                  <span className="year">{heroMovie?.release_date?.substring(0, 4) || ''}</span>
                </div>
                {genres.length > 0 && (
                  <div className="genres">
                    {genres.map((genre) => (
                      <span key={genre.id} className="genre">{genre.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <p className="hero-description">{heroMovie?.overview || 'No overview available.'}</p>
              <div className="hero-btns">
                <button className='btn' onClick={() => navigate(`/player/${heroMovie.id}`)} tabIndex={focusedSection === 'hero' ? 0 : -1}>
                  <img src={play_icon} alt="Play Icon" /> Play Now
                </button>
                <button className='btn dark-btn' onClick={handleMoreDetails} tabIndex={focusedSection === 'hero' ? 0 : -1}>
                  <img src={info_icon} alt="Info Icon" /> More Details
                </button>
                <button className='add-btn' onClick={handleAddToWatchlist} tabIndex={focusedSection === 'hero' ? 0 : -1}>
                  <img src={add_icon} alt="Add to Watchlist" />
                </button>
              </div>
            </div>
          </div>
          <div className="scroll-down">
            <span>Scroll Down</span>
            <div className="chevron"></div>
            <div className="chevron"></div>
            <div className="chevron"></div>
          </div>
        </div>
      )}

      <div className="more-cards">
        {aiLoading && <div className="loading-message text-center text-xl text-purple-400 my-8">Getting AI suggestions...</div>}
        {aiError && <div className="error-message text-center text-red-500 my-8">{aiError}</div>}
        {aiSuggestedMovieTitles.length > 0 && (
          <TitleCards
            title={"AI Recommended Movies"}
            movieTitles={aiSuggestedMovieTitles}
            sectionId="ai"
            ref={aiSectionRef}
          />
        )}

        <TitleCards
          title={"Blockbuster Movies"}
          category={"top_rated"}
          sectionId="blockbuster"
          ref={blockbusterRef}
        />
        <TitleCards
          title={"Only on Jaasplay"}
          category={"popular"}
          sectionId="netflix"
          ref={netflixRef}
        />
        <TitleCards
          title={"Upcoming Movies"}
          category={"upcoming"}
          sectionId="upcoming"
          ref={upcomingRef}
        />
        <TitleCards
          title={"Top Picks for You"}
          category={"now_playing"}
          sectionId="top_picks"
          ref={topPicksRef}
        />
      </div>

      <Footer />
    </div>
  );
};

export default Home;