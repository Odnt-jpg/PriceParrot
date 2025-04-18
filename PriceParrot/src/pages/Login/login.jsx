import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import '../../App.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Logging in with:', email, password);
    navigate('/home');
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <h2 id='sublogo' className="logo">Welcome <br /> to </h2>
        <h1 id='mainlogo' className="logo"> 
          <span style={{ color: 'white' }}>Price</span>Parrot
        </h1>
      </div>
      <div className="login-right">
        <div className="auth-options">
          <h1>Login</h1>
          <form onSubmit={handleSubmit} id = "login-form">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              class = "inputbox"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              class = "inputbox"
            />
            <button type="submit" id= "login">Login</button>
          </form>
          <button onClick={() => navigate('/')} id= "back">Back</button>
        </div>
      </div>
    </div>
  );
}

export default Login;