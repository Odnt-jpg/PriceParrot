import React from 'react';
import './navbar.css';

const Navbar = () => {
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
        <li><a href="/">Login</a></li>
        <li><a href="/">Register</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;