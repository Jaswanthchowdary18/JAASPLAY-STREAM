import React, { useEffect } from 'react';
import './TitleOverlay.css';
import { FaPlay, FaPlus, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { FaStar } from 'react-icons/fa';

const TitleOverlay = ({ movie, onClose, onPlay, onDetails }) => {
  // Close overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.classList.contains('title-overlay')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close overlay on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="title-overlay">
      <div className="overlay-content">
        <div className="overlay-poster">
          <img 
            src={movie.poster_path 
              ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
              : 'https://placehold.co/500x750/000000/FFFFFF?text=No+Poster'}
            alt={movie.title}
            onError={(e) => {
              e.target.src = 'https://placehold.co/500x750/000000/FFFFFF?text=No+Poster';
            }}
          />
        </div>
        <div className="overlay-details">
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
          <h1 className="overlay-title">{movie.title}</h1>
          <div className="overlay-meta">
            <span className="rating">
              <FaStar className="star-icon" />
              {movie.vote_average?.toFixed(1) || 'N/A'}
            </span>
            <span className="year">{movie.release_date?.substring(0, 4) || ''}</span>
          </div>
          <p className="overview">{movie.overview || 'No overview available.'}</p>
          <div className="overlay-buttons">
            <button className="play-btn" onClick={onPlay}>
              <FaPlay /> Play
            </button>
            <button className="add-btn">
              <FaPlus /> My List
            </button>
            <button className="info-btn" onClick={onDetails}>
              <FaInfoCircle /> Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleOverlay;