import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoPng from '../Images/parrot.png';
import { handleSearchNavigate } from '../../utils/searchUtils';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [navbarSearch, setNavbarSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    setUser(storedUser ? JSON.parse(storedUser) : null);
    const onStorage = () => {
      const updatedUser = localStorage.getItem('user');
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  // Dropdown menu state
  const [showDropdown, setShowDropdown] = useState(false);
  const handleUserIconClick = () => setShowDropdown((v) => !v);
  const closeDropdown = () => setShowDropdown(false);

  // Get user id if available
  const userId = user && user.id ? user.id : null;

  return (
    <nav className="navbar flex items-center justify-between bg-quaternary px-6 py-3 shadow-lg sticky top-0 z-50">
      <div className="navbar-logo flex items-center gap-2">
        
        <a href="/home" className="text-white text-2xl font-medium tracking-wide hover:text-green-200 transition-colors duration-200" style = {{minWidth: 0, fontFamily: 'Farabee, sans-serif' }}>PriceParrot</a>
        <img src={LogoPng} alt="PriceParrot Logo" className="h-7 w-auto   mr-2" />
      </div>
      <div className="navbar-search flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2 shadow-sm border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-400 w-96 max-w-xl" style={{ fontFamily: 'Farabee, sans-serif' }}>
        <span className="material-symbols-outlined" style={{ color: 'grey' }}>
          search
        </span>
        <input
          type="text"
          placeholder="Search..."
          className="search-input h-full w-full text-s text-gray-800 bg-transparent focus:outline-none"
          value={navbarSearch}
          onChange={e => setNavbarSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearchNavigate(navbarSearch, navigate); }}
          style={{ minWidth: 0, fontFamily: 'Farabee, sans-serif' }}
        />
      </div>
      <ul className="navbar-links flex items-center gap-6 list-none">
        {user ? (
          <>
            <li><a href="/wishlist" className="text-white hover:text-secondary   font-medium transition-colors">Wishlist</a></li>
            <li><a href="/cart" className="text-white hover:text-secondary font-medium transition-colors">Cart</a></li>
            {user.isAdmin && (
              <li><a href="/admin" className="text-white hover:text-rose-400 font-medium transition-colors">Admin</a></li>
            )}
            <li className="relative">
              <button className="navbar-user-icon w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white text-xl hover:bg-green-600 transition" onClick={handleUserIconClick} aria-label="User menu">
                <span role="img" aria-label="user">👤</span>
              </button>
              {showDropdown && (
                <div className="navbar-dropdown absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]" onMouseLeave={closeDropdown}>
                  <div className="navbar-dropdown-user px-4 py-3 border-b border-gray-100">
                    <div className="font-semibold text-gray-800">{user.first_name || user.email}</div>
                    {userId && <div className="text-xs text-gray-500">ID: {userId}</div>}
                  </div>
                  <button className="logout-button w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 transition" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </li>
          </>
        ) : (
          <>
            <li><a href="/" className="text-white hover:text-pink-400 font-medium transition-colors">Login</a></li>
            <li><a href="/" className="text-white hover:text-pink-400 font-medium transition-colors">Register</a></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;