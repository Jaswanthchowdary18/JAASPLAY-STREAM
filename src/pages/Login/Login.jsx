import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../../assets/logo.png';
import { login, signup } from '../../firebase';
import netflix_spinner from '../../assets/netflix_spinner.gif';

const Login = () => {
  const [signState, setSignState] = useState("Sign In");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * 9) + 1;
    setBgImage(`/logincards/${randomIndex}.jpg`);
  }, []);

  const user_auth = async (event) => {
    event.preventDefault();
    setLoading(true);

    let success = false;

    if (signState === "Sign In") {
      success = await login(email, password);
    } else {
      success = await signup(name, email, password);
    }

    setLoading(false);

    if (success) {
      navigate('/');
    }
  };

  return loading ? (
    <div className="login-spinner">
      <img src={netflix_spinner} className='login-logo' alt='' />
    </div>
  ) : (
    <div
      className='login'
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <img src={logo} className='login-logo' alt='' />
      <div className='login-form'>
        <h1>{signState}</h1>
        <form>
          {signState === "Sign Up" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder='Your name'
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder='Email'
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder='Password'
          />
          <button onClick={user_auth} type='submit'>{signState}</button>
          <div className="form-help">
            <div className="remember">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <a href="#" className="help-link">Need help?</a>
          </div>
        </form>
        <div className="form-switch">
          {signState === "Sign In" ? (
            <p>
              New here?{" "}
              <span onClick={() => setSignState("Sign Up")}>Sign up now</span>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <span onClick={() => setSignState("Sign In")}>Sign in</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;