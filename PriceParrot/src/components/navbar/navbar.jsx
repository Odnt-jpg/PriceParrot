import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
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
    <nav className="navbar">
      <div className="navbar-logo">
        <a href="/home">PriceParrot</a>
      </div>
      <div className="navbar-search">
        <input type="text" placeholder="Search..." className="search-input" />
        <button className="search-button">Search</button>
      </div>
      <ul className="navbar-links">
        {user ? (
          <>
            <li><a href="/wishlist">Wishlist</a></li>
            <li><a href="/cart">Cart</a></li>
            {user.isAdmin && (
              <li><a href="/admin">Admin</a></li>
            )}
            <li className="navbar-user-icon-wrapper" style={{position: 'relative'}}>
              <button className="navbar-user-icon" onClick={handleUserIconClick} aria-label="User menu">
                <span role="img" aria-label="user">👤</span>
              </button>
              {showDropdown && (
                <div className="navbar-dropdown" onMouseLeave={closeDropdown} style={{position: 'absolute', right: 0, top: '2.5rem', background: '#fff', border: '1px solid #ccc', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10}}>
                  <div className="navbar-dropdown-user" style={{padding: '0.5rem 1rem', borderBottom: '1px solid #eee'}}>
                    <div><strong>{user.first_name || user.email}</strong></div>
                    {userId && <div style={{fontSize: '0.85em', color: '#888'}}>ID: {userId}</div>}
                  </div>
                  <button className="logout-button" style={{width: '100%', padding: '0.5rem 1rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer'}} onClick={handleLogout}>Logout</button>
                </div>
              )}
            </li>
          </>
        ) : (
          <>
            <li><a href="/">Login</a></li>
            <li><a href="/">Register</a></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;