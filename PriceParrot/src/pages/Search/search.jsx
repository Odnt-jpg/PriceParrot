import React, { useState } from 'react';
import './search.css';
import ItemCard from '../../components/itemcard/itemcard.jsx';
import Navbar from '../../components/navbar/navbar.jsx';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setResults([]);
    }
    setLoading(false);
  };

  // Auto-logout if session expired (e.g., after 1 hour)
  React.useEffect(() => {
    const sessionTimeout = 60 * 60 * 1000; // 1 hour in ms
    const user = localStorage.getItem('user');
    const loginTime = localStorage.getItem('loginTime');
    if (user && loginTime) {
      const now = Date.now();
      if (now - Number(loginTime) > sessionTimeout) {
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        window.location.href = '/';
      }
    }
    // Optionally, set interval to check periodically
    const interval = setInterval(() => {
      const user = localStorage.getItem('user');
      const loginTime = localStorage.getItem('loginTime');
      if (user && loginTime && Date.now() - Number(loginTime) > sessionTimeout) {
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        window.location.href = '/';
      }
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="search-page">
      <Navbar />
      <h1>Search Results</h1>
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Search for products..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading}>Search</button>
      </form>
      <div className="search-results">
        {loading && <p>Loading...</p>}
        {!loading && searched && results.length === 0 && <p>No results found.</p>}
        <div className="search-results-grid">
          {results.map(item => (
            <ItemCard
              key={item.id}
              id={item.id}
              image={item.image_url}
              name={item.name}
              price={typeof item.price === 'number' ? item.price : Number(item.price)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;
