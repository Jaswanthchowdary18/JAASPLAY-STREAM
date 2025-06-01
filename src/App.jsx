import React, { useEffect } from 'react';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Player from './pages/Player/Player';
import MovieDetails from './pages/Moviedetails/Moviedetails';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Logged In");
        if (window.location.pathname === "/login") {
          navigate("/");
        }
      } else {
        console.log("Logged Out");
        if (window.location.pathname !== "/login") {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div>
      <ToastContainer theme='dark' />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/player/:id' element={<Player />} />
        <Route path='/movie/:id' element={<MovieDetails />} />
      </Routes>
    </div>
  );
};

export default App;