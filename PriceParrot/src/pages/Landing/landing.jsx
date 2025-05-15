import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';
import '../Login/login.css';
import '../../App.css';
import axios from 'axios';

// One screen that holds the states for both the login and registration

function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const[showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  
  // Login Button Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.status === 200) {
        alert('Login successful!');
        navigate('/home');
      }
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || error.message));
    }
  };
  
  // Registration Button Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/register', {
        first_name: e.target.first_name.value,
        last_name: e.target.last_name.value,
        email: e.target.email.value,
        password: e.target.password.value,
      });
      if (response.status === 201) {
        alert('Registration successful!');
        setShowRegister(false);
      }
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-left">
        <h2 id='sublogo' className="logo">Welcome <br /> to </h2>
        <h1 id='mainlogo' className="logo"> 
          <span style={{ color: 'white' }}>Price</span>Parrot
        </h1>
      </div>
      <div className={`landing-right ${showLogin || showRegister ? 'slide-in' : ''}`}>
        {!showLogin && !showRegister ? (
          <div className="auth-options">
            <button onClick={() => setShowRegister(true)} id="register-button">Register</button>
            <button onClick={() => setShowLogin(true)} id="login-button">Login</button>
            <button onClick={() => navigate('/home')} id="guest-button">Continue as Guest</button>
          </div>
        ) : showLogin ? (
          <div className="auth-form">
            <h1>Login</h1>
            <form onSubmit={handleLoginSubmit} id="login-form">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="loginbox"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="loginbox"
              />
              <button type="submit" id="login">Login</button>
            </form>
            <button onClick={() => setShowLogin(false)} id="back">Back</button>
          </div>
        ) : (
          <div className="auth-form">
            <h1>Register</h1>
            <form id="register-form" onSubmit={handleRegisterSubmit}>
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                required
                className="registerbox"
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                required
                className="registerbox"
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                className="registerbox"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                className="registerbox"
              />
              <button type="submit" id="register">Register</button>
            </form>
            <button onClick={() => setShowRegister(false)} id="back">Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Landing;