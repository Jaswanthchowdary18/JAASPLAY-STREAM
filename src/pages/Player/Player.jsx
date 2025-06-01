import React, { useEffect, useState } from 'react';
import './Player.css';
import back_arrow_icon from '../../assets/back_arrow_icon.png';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const Player = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isTrailer = searchParams.get('trailer') === 'true';
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxZGRhNjIyOGMyYjk5MzcxMzk0YjJiOGIyZWJmNjM1MSIsIm5iZiI6MTc0ODMyNDc1MC4xMDA5OTk4LCJzdWIiOiI2ODM1NTE4ZWY1YmUwMzdhMDFlYjM3NDUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.5Rk3m_5jiXEKAh-r-9TxHfCvAkG-luRllV5CHpR3G1M'
    }
  };

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/videos?language=en-US`, 
          options
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch video data');
        }
        
        const data = await response.json();
        
        if (isTrailer) {
          // Find trailer
          const trailer = data.results.find(
            video => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
          );
          if (!trailer) {
            throw new Error('No trailer available');
          }
          setVideoData(trailer);
        } else {
          // Find official movie video (or first available)
          const movieVideo = data.results.find(video => video.official) || data.results[0];
          if (!movieVideo) {
            throw new Error('No video available');
          }
          setVideoData(movieVideo);
        }
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error fetching video data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [id, isTrailer]);

  return (
    <div className='player'>
      <div className="player-header">
        <img 
          src={back_arrow_icon} 
          alt='Back' 
          onClick={() => navigate(-1)}
          className='back-button'
        />
        <h2>{videoData?.name || (isTrailer ? 'Trailer' : 'Movie')}</h2>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      ) : videoData ? (
        <div className="video-container">
          <iframe
            width='100%'
            height='100%'
            src={`https://www.youtube.com/embed/${videoData.key}?autoplay=1&rel=0&modestbranding=1`}
            title={videoData.name}
            frameBorder='0'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          ></iframe>
        </div>
      ) : null}
    </div>
  );
};

export default Player;