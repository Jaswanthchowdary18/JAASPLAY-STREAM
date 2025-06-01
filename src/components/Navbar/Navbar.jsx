import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { FiSearch, FiHome, FiFilm, FiTv, FiStar, FiList, FiGlobe, FiSettings, FiHelpCircle } from 'react-icons/fi';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { BiChevronDown } from 'react-icons/bi';
import { logout } from '../../firebase';
import logo from '../../assets/logo.png';

const Navbar = ({ onSuggestMovies, user }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', icon: <FiHome /> },
    { name: 'Movies', icon: <FiFilm /> },
    { name: 'TV Shows', icon: <FiTv /> },
    { name: 'Premium', icon: <FiStar /> },
    { name: 'My List', icon: <FiList /> },
    { name: 'Browse', icon: <FiGlobe /> }
  ];

  const genres = [
    'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller', 'Horror', 'Romance',
    'Animation', 'Documentary', 'Fantasy', 'Mystery', 'Crime', 'Adventure'
  ];
  const timePeriods = [
    'Classic (Pre-1970s)', '1970s', '1980s', '1990s', '2000s', '2010s', 'Modern (2020s-Present)'
  ];
  const nationalities = [
    'American', 'British', 'Indian', 'French', 'Japanese', 'Korean', 'Spanish',
    'Italian', 'Chinese', 'German', 'Canadian', 'Australian', 'Brazilian'
  ];

  const getProfileInitials = () => {
    if (!user?.displayName) return 'U';
    
    const nameParts = user.displayName.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
  };

  const handleAISuggestion = () => {
    setShowAIModal(true);
    setCurrentStep(1);
    setSelectedGenre('');
    setSelectedTimePeriod('');
    setSelectedNationality('');
    setModalError('');
  };

  const handleNextStep = () => {
    setModalError('');
    if (currentStep === 1 && !selectedGenre) {
      setModalError('Please select a genre.');
      return;
    }
    if (currentStep === 2 && !selectedTimePeriod) {
      setModalError('Please select a time period.');
      return;
    }
    if (currentStep === 3 && !selectedNationality) {
      setModalError('Please select a nationality.');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      if (onSuggestMovies) {
        onSuggestMovies({
          genre: selectedGenre,
          timePeriod: selectedTimePeriod,
          nationality: selectedNationality
        });
      }
      setShowAIModal(false);
    }
  };

  const handlePreviousStep = () => {
    setModalError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCloseModal = () => {
    setShowAIModal(false);
    setModalError('');
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-brand">
            <img src={logo} alt="Logo" className="logo-image" />
          </div>

          <div className="navbar-center">
            <ul className="nav-links">
              {navItems.map((item, index) => (
                <li key={index} className="nav-item">
                  {item.icon}
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="navbar-right">
            <button className="ai-suggester-button" onClick={handleAISuggestion}>
              AI MOVIE SUGGESTION
            </button>
            <div className="search-icon">
              <FiSearch />
            </div>
            <div className="notification-icon">
              <IoMdNotificationsOutline />
            </div>
            <div
              className="profile-menu"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <div className="profile-initials">
                {getProfileInitials()}
              </div>
              <BiChevronDown className="dropdown-icon" />
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-profile-initials">
                      {getProfileInitials()}
                    </div>
                    <div className="dropdown-profile-name">
                      {user?.displayName || 'User'}
                    </div>
                  </div>
                  <div className="dropdown-item">
                    <FiSettings className="dropdown-item-icon" />
                    <span>Settings</span>
                  </div>
                  <div className="dropdown-item">
                    <FiHelpCircle className="dropdown-item-icon" />
                    <span>Help & Support</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item" onClick={logout}>
                    <span>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showAIModal && (
        <div className="ai-modal-overlay">
          <div className="ai-modal">
            <button className="ai-modal-close" onClick={handleCloseModal}>
              &times;
            </button>

            <div className="ai-modal-header">
              <h3>AI Movie Suggester</h3>
              <div className="ai-progress-steps">
                <div className={`ai-step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
                <div className={`ai-step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
                <div className={`ai-step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
              </div>
            </div>

            {modalError && <div className="ai-modal-error">{modalError}</div>}

            {currentStep === 1 && (
              <div className="ai-step-content">
                <h4>Select Your Preferred Genre</h4>
                <div className="ai-options-grid">
                  {genres.map((genre) => (
                    <div
                      key={genre}
                      className={`ai-option ${selectedGenre === genre ? 'selected' : ''}`}
                      onClick={() => setSelectedGenre(genre)}
                    >
                      {genre}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="ai-step-content">
                <h4>Select Time Period</h4>
                <div className="ai-options-grid">
                  {timePeriods.map((period) => (
                    <div
                      key={period}
                      className={`ai-option ${selectedTimePeriod === period ? 'selected' : ''}`}
                      onClick={() => setSelectedTimePeriod(period)}
                    >
                      {period}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="ai-step-content">
                <h4>Select Movie Origin</h4>
                <div className="ai-options-grid">
                  {nationalities.map((nationality) => (
                    <div
                      key={nationality}
                      className={`ai-option ${selectedNationality === nationality ? 'selected' : ''}`}
                      onClick={() => setSelectedNationality(nationality)}
                    >
                      {nationality}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="ai-modal-footer">
              {currentStep > 1 && (
                <button className="ai-nav-button prev" onClick={handlePreviousStep}>
                  Back
                </button>
              )}
              <button
                className="ai-nav-button next"
                onClick={handleNextStep}
                disabled={
                  (currentStep === 1 && !selectedGenre) ||
                  (currentStep === 2 && !selectedTimePeriod) ||
                  (currentStep === 3 && !selectedNationality)
                }
              >
                {currentStep === 3 ? 'Get Recommendations' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;