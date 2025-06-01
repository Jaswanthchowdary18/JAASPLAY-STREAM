import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MovieDetails.css';
import {
    FaStar,
    FaRegClock,
    FaCalendarAlt,
    FaPlay,
    FaBookmark,
    FaRegBookmark
} from 'react-icons/fa';
import { db } from '../../firebase';
import { collection, addDoc, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../../firebase';
import TitleCards from '../../components/TitleCards/TitleCards';

const MovieDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trailerKey, setTrailerKey] = useState(null);
    const [relatedMovies, setRelatedMovies] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [director, setDirector] = useState(null);
    const [watchlist, setWatchlist] = useState([]);
    const [certification, setCertification] = useState('Not Rated');

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxZGRhNjIyOGMyYjk5MzcxMzk0YjJiOGIyZWJmNjM1MSIsIm5iZiI6MTc0ODMyNDc1MC4xMDA5OTk4LCJzdWIiOiI2ODM1NTE4ZWY1YmUwMzdhMDFlYjM3NDUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.5Rk3m_5jiXEKAh-r-9TxHfCvAkG-luRllV5CHpR3G1M'
        }
    };

    const fetchWatchlist = async () => {
        if (auth.currentUser) {
            const q = query(collection(db, 'watchlist'), where('userId', '==', auth.currentUser.uid));
            const querySnapshot = await getDocs(q);
            const userWatchlist = querySnapshot.docs.map(doc => doc.data().movieId);
            setWatchlist(userWatchlist);
        }
    };

    const toggleWatchlist = async (e) => {
        e.stopPropagation();

        if (!auth.currentUser) {
            navigate('/login');
            return;
        }

        try {
            if (watchlist.includes(id)) {
                // Remove from watchlist
                const q = query(
                    collection(db, 'watchlist'),
                    where('userId', '==', auth.currentUser.uid),
                    where('movieId', '==', id)
                );
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
                setWatchlist(watchlist.filter(movieId => movieId !== id));
            } else {
                // Add to watchlist
                await addDoc(collection(db, 'watchlist'), {
                    userId: auth.currentUser.uid,
                    movieId: id,
                    movieTitle: movie.title,
                    moviePoster: movie.poster_path,
                    addedAt: new Date()
                });
                setWatchlist([...watchlist, id]);
            }
        } catch (error) {
            console.error('Error updating watchlist:', error);
        }
    };

    useEffect(() => {
        const fetchMovieData = async () => {
            try {
                setLoading(true);

                const [detailsRes, creditsRes, videosRes, similarRes, recommendationsRes, releaseDatesRes] = await Promise.all([
                    fetch(`https://api.themoviedb.org/3/movie/${id}`, options),
                    fetch(`https://api.themoviedb.org/3/movie/${id}/credits`, options),
                    fetch(`https://api.themoviedb.org/3/movie/${id}/videos`, options),
                    fetch(`https://api.themoviedb.org/3/movie/${id}/similar`, options),
                    fetch(`https://api.themoviedb.org/3/movie/${id}/recommendations`, options),
                    fetch(`https://api.themoviedb.org/3/movie/${id}/release_dates`, options)
                ]);

                const details = await detailsRes.json();
                const credits = await creditsRes.json();
                const videos = await videosRes.json();
                const similar = await similarRes.json();
                const recommendationsData = await recommendationsRes.json();
                const releaseDates = await releaseDatesRes.json();

                // Find director
                const movieDirector = credits.crew.find(person => person.job === 'Director');

                // Find US certification
                const usCertification = releaseDates.results.find(
                    country => country.iso_3166_1 === 'US'
                )?.release_dates[0]?.certification;

                // Find trailer
                const trailer = videos.results.find(
                    video => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
                );

                setMovie({
                    ...details,
                    cast: credits.cast.slice(0, 8)
                });
                setTrailerKey(trailer?.key);
                setRelatedMovies(similar.results);
                setRecommendations(recommendationsData.results);
                setDirector(movieDirector);
                setCertification(usCertification || 'Not Rated');
                setLoading(false);
                fetchWatchlist();
            } catch (error) {
                console.error('Error fetching movie details:', error);
                navigate('/');
            }
        };

        fetchMovieData();
    }, [id]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!movie) {
        return <div className="error-message">Movie not found</div>;
    }

    const getCertificationColor = () => {
        switch (certification) {
            case 'G':
                return '#2ecc71'; // Green
            case 'PG':
                return '#f1c40f'; // Yellow
            case 'PG-13':
                return '#e67e22'; // Orange
            case 'R':
            case 'NC-17':
                return '#e74c3c'; // Red
            default:
                return '#95a5a6'; // Gray
        }
    };

    return (
        <div className="movie-details-container">
            {/* New .hero-section to contain the backdrop and main movie info */}
            <div className="hero-section">
                <div
                    className="backdrop"
                    style={{
                        backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
                        opacity: movie.backdrop_path ? 1 : 0.2
                    }}
                >
                    <div className="backdrop-overlay"></div>
                </div>

                <div className="movie-content">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        &larr; Back
                    </button>

                    <div className="movie-main">
                        <div className="movie-poster">
                            <img
                                src={movie.poster_path
                                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                    : '/placeholder-poster.jpg'}
                                alt={movie.title}
                                onError={(e) => {
                                    e.target.src = '/placeholder-poster.jpg';
                                }}
                            />
                        </div>

                        <div className="movie-info">
                            <div className="movie-header">
                                <h1>{movie.title} <span>({new Date(movie.release_date).getFullYear()})</span></h1>

                                {certification && (
                                    <div
                                        className="certification"
                                        style={{ backgroundColor: getCertificationColor() }}
                                    >
                                        {certification}
                                    </div>
                                )}
                            </div>

                            <div className="movie-meta">
                                <span><FaStar /> {movie.vote_average.toFixed(1)}</span>
                                <span><FaRegClock /> {movie.runtime} min</span>
                                <span><FaCalendarAlt /> {movie.release_date}</span>
                                {director && <span>Director: {director.name}</span>}
                            </div>

                            <div className="genres">
                                {movie.genres.map(genre => (
                                    <span key={genre.id}>{genre.name}</span>
                                ))}
                            </div>

                            <h3>Overview</h3>
                            <p>{movie.overview || 'No overview available.'}</p>

                            <div className="action-buttons">
                                <button
                                    className="play-button"
                                    onClick={() => navigate(`/player/${movie.id}`)}
                                >
                                    <FaPlay /> Play Movie
                                </button>

                                {trailerKey && (
                                    <button
                                        className="trailer-button"
                                        onClick={() => navigate(`/player/${movie.id}?trailer=true`)}
                                    >
                                        <FaPlay /> Play Trailer
                                    </button>
                                )}

                                <button
                                    className="watchlist-button"
                                    onClick={toggleWatchlist}
                                >
                                    {watchlist.includes(id) ? <FaBookmark /> : <FaRegBookmark />}
                                    {watchlist.includes(id) ? 'In Watchlist' : 'Watch Later'}
                                </button>
                            </div>

                            {movie.cast && movie.cast.length > 0 && (
                                <>
                                    <h3>Cast</h3>
                                    <div className="cast-scroller">
                                        {movie.cast.map(person => (
                                            <div key={person.id} className="cast-member">
                                                <img
                                                    src={person.profile_path
                                                        ? `https://image.tmdb.org/t/p/w200${person.profile_path}`
                                                        : '/default-avatar.png'}
                                                    alt={person.name}
                                                    onError={(e) => {
                                                        e.target.src = '/default-avatar.png';
                                                    }}
                                                />
                                                <div className="cast-info">
                                                    <span>{person.name}</span>
                                                    <small>as {person.character || 'Unknown'}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div> {/* End of .hero-section */}

            {recommendations.length > 0 && (
                <div className="recommendations-section">
                    <h3>More Like This</h3>
                    <div className="recommendations-scroller">
                        {recommendations.map(recommendation => (
                            <div
                                key={recommendation.id}
                                className="recommendation-card"
                                onClick={() => navigate(`/movie/${recommendation.id}`)}
                            >
                                <img
                                    src={recommendation.poster_path
                                        ? `https://image.tmdb.org/t/p/w200${recommendation.poster_path}`
                                        : '/default-movie.png'}
                                    alt={recommendation.title}
                                    onError={(e) => {
                                        e.target.src = '/default-movie.png';
                                    }}
                                />
                                <div className="recommendation-info">
                                    <p>{recommendation.title}</p>
                                    <span>
                                        <FaStar /> {recommendation.vote_average.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {relatedMovies.length > 0 && (
                <div className="related-section">
                    <TitleCards
                        title="Similar Movies"
                        category={null}
                        customData={relatedMovies}
                    />
                </div>
            )}
        </div>
    );
};

export default MovieDetails;