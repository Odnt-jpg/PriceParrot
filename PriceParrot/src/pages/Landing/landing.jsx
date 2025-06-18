import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';
import axios from 'axios';
import MoneyForest from '../../components/Images/money-forest.png';
import CoolMarket from '../../../public/Product_Images/cool_market.jpg';
import HiloLogo from '../../../public/Product_Images/hilo-logo.png';
import PriceSmartLogo from '../../../public/Product_Images/pricesmart-logo.png';
import SLogo from '../../../public/Product_Images/s-logo.png';
import LogoPng from '../../components/Images/Logo.png';
import Dollar1 from '../../components/Images/dollar-1.png';
import Dollar2 from '../../components/Images/dollar-2.png';

// One screen that holds the states for both the login and registration

function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const[showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [slideForm, setSlideForm] = useState(false);

  
  // Login Button Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.status === 200) {
        alert('Login successful!');
        localStorage.setItem('user', JSON.stringify(response.data.user || { email }));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        localStorage.setItem('loginTime', Date.now().toString());
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
        localStorage.setItem('user', JSON.stringify({ email: e.target.email.value, first_name: e.target.first_name.value, last_name: e.target.last_name.value }));
        setShowRegister(false);
      }
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.message || error.message));
    }
  };

  // Scroll to form when login/register is clicked
  const scrollToForm = () => {
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 350);  
  };

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Falling money animation setup
  const moneyCount = 16;
  const moneyImages = [Dollar1, Dollar2];
  const fallingMoney = Array.from({ length: moneyCount }).map((_, i) => {
    const left = i % 2 === 0
      ? getRandomInt(0, 20) // left side
      : getRandomInt(80, 100); // right side
    const duration = getRandomInt(4, 8);
    const delay = getRandomInt(0, 6);
    const size = getRandomInt(32, 56); 
    const img = moneyImages[getRandomInt(0, moneyImages.length - 1)];
    return (
      <img
        key={i}
        src={img}
        alt="falling money"
        className="falling-money"
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: 'auto',
          animation: 'var(--animate-fall)',
          animationDelay: `${delay}s`,
          position: 'absolute',
          top: 0,
          zIndex: 10,
          opacity: 0.85
        }}
      />
    );
  });

  return (
    <div className="flex flex-col min-h-screen   relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 w-full h-full z-10">
        {fallingMoney}
      </div>
      <img src={MoneyForest} alt="Money Forest" className="w-full max-h-90 object-cover" style={{objectPosition: 'center top'}} />
      {/* Buttons */}
      <div className="flex flex-col items-center justify-center py-4">
        <img src={LogoPng} alt="PriceParrot Logo" className="h-50 w-auto mb-4 drop-shadow-lg" />
        <div className="text-green-700 text-center tracking-wide drop-shadow-lg mb-6 text-3xl" style={{ fontFamily: 'Raleway, sans-serif', }}>
          Know what you're buying before you buy it    
        </div>
        <div className="flex flex-row justify-center items-center gap-6 w-full max-w-md p-6 rounded-2xl   border-gray-200">
          <button
            onClick={() => { setShowRegister(true); setSlideForm(true); setShowLogin(false); scrollToForm(); }}
            id="register-button"
            className=" btn btn-secondary flex-1 py-3 rounded-lg text-slate-100 font-bold text-m shadow hover:scale-105 transition-transform"
            style={{ fontFamily: 'Raleway, sans-serif', }}
          >Register</button>
          <button
            onClick={() => { setShowLogin(true); setSlideForm(true); setShowRegister(false); scrollToForm(); }}
            id="login-button"
            className=" btn btn-primary  flex-1 py-3 rounded-lg text-slate-100 font-bold text-m shadow hover:scale-105 transition-transform"
            style={{ fontFamily: 'Raleway, sans-serif', }}
          >Login</button>
          <button
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('loginTime');
              navigate('/home');
            }}
            id="guest-button"
            className="btn btn-dash flex-1 py-3 rounded-lg text-gray-700 font-bold text-m shadow hover:bg-gray-200 transition"
            style={{ fontFamily: 'Raleway, sans-serif', }}
          >Continue as Guest</button>
        </div>
        
      </div>
      {/* Slide-down form animation */}
      <div
        ref={formRef}
        className={`w-full flex justify-center transition-all duration-700 overflow-hidden ${slideForm && (showLogin || showRegister) ? 'max-h-[700px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-10'}`}
        style={{ willChange: 'max-height, opacity, transform' }}
      >
        {showLogin && (
          <div className="auth-form flex flex-col gap-6 w-full max-w-md p-10 rounded-2xl bg-white/90 shadow-xl border border-gray-200 mt-4">
            <h1 className="text-3xl font-bold text-green-700 mb-4 text-center" style={{ fontFamily: 'Raleway, sans-serif', }}>Login</h1>
            <form onSubmit={handleLoginSubmit} id="login-form" className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="loginbox px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 placeholder:text-gray-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="loginbox px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 placeholder:text-gray-500"
              />
              <button type="submit" id="login" className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow hover:scale-105 transition-transform" style={{ fontFamily: 'Raleway, sans-serif', }}>Login</button>
            </form>
            <button onClick={() => { setShowLogin(false); setSlideForm(false); }} id="back" className="mt-2 text-green-600 hover:underline" style={{ fontFamily: 'Raleway, sans-serif', }}>Back</button>
          </div>
        )}
        {showRegister && (
          <div className="auth-form flex flex-col gap-6 w-full max-w-md p-10 rounded-2xl bg-white/90 shadow-xl border border-gray-200 mt-4">
            <h1 className="text-3xl font-bold text-green-700 mb-4 text-center" style={{ fontFamily: 'Raleway, sans-serif', }}>Register</h1>
            <form id="register-form" onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                required
                className="registerbox px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-500"
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                required
                className="registerbox px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-500"
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                className="registerbox px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-500"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                className="registerbox px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-500"
              />
              <button type="submit" id="register" className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow hover:scale-105 transition-transform" style={{ fontFamily: 'Raleway, sans-serif', }}>Register</button>
            </form>
            <button onClick={() => { setShowRegister(false); setSlideForm(false); }} id="back" className="mt-2 text-green-600 hover:underline">Back</button>
          </div>
        )}
      </div>
      {/* Store Logos Marquee */}
        <div className="w-full flex flex-col items-center mt-8">
          <span className="text-lg font-semibold text-gray-700 mb-2">Stores we support</span>
          <div className="relative w-full max-w-2xl overflow-hidden h-24" >
            <div className="absolute left-0 top-0 flex items-center h-24 animate-marquee whitespace-nowrap" style={{ minWidth: '200%', width: 'max-content' }}>
              { [
                CoolMarket, HiloLogo, PriceSmartLogo, SLogo,
                CoolMarket, HiloLogo, PriceSmartLogo, SLogo
              ].map((logo, idx) => (
                <div key={idx} className="flex items-center justify-center mx-8 bg-white rounded-xl shadow-xl" style={{ width: '90px', height: '90px' }}>
                  <img src={logo} alt={`Store ${idx}`} className="h-24 w-24 object-contain" style={{ maxWidth: '80px', maxHeight: '80px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      {/* <div id ='landing-left' className="flex flex-col justify-center items-left w-1/2 min-h-screen bg-gradient-to-br from-green-700 via-green-500 to-green-300 shadow-lg">
        {/* <h2 id='sublogo' className="mb-4 font-primary text-4xl text-white drop-shadow-lg">Welcome <br /> to <br /> </h2> */}
        {/* <img src={Logo} alt="PriceParrot Logo" className="" style={{ width: 'auto', height: 'auto' }} /> */}
        {/* <h1 id='mainlogo' className="ml-11 font-primary color-white text-9xl "> 
          PriceParrot
        </h1> */}
      {/* </div> */}
    </div> 
  );
}

export default Landing;