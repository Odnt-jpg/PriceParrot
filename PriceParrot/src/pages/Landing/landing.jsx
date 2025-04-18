import { useNavigate } from 'react-router-dom';
import './landing.css';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-left">
        <h2 id='sublogo'className="logo">Welcome <br /> to </h2>
        <h1 id='mainlogo' className="logo"> 
          <span style={{ color: 'white' }}>Price</span>Parrot
        </h1>
      </div>
      <div className="landing-right">
        <div className="auth-options">
          <button onClick={() => navigate('/register')}id='register-button'>Register</button>
          <button onClick={() => navigate('/login')}id='login-button'>Login</button>
          <button onClick={() => navigate('/home')}id='guest-button'>Continue as Guest</button>
        </div>
      </div>
    </div>
  );
}

export default Landing;