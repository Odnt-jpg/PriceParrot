import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar.jsx';
import './home.css';

function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = () => {
        if (searchQuery.trim()) {
            alert(`Searching for: ${searchQuery}`);
        }
    };

    return (
        <div className="home-page">
            <Navbar />
            <div className="home-content">
                {/* Welcome Section */}
                <h1>Welcome to PriceParrot</h1>
                <p>Your one-stop solution for price comparison.</p>

                {/* Search Bar */}
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search for products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <button onClick={handleSearch} className="search-button">
                        Search
                    </button>
                </div>

                {/* Featured Section */}
                <div className="featured-section">
                    <h2>Featured Products</h2>
                    <div className="product-grid">
                        <div className="product-card">Product 1</div>
                        <div className="product-card">Product 2</div>
                        <div className="product-card">Product 3</div>
                    </div>
                </div>

                {/* Recently Viewed Products */}
                <div className="recently-viewed">
                    <h2>Recently Viewed Products</h2>
                    <div className="product-grid">
                        <div className="product-card">Product A</div>
                        <div className="product-card">Product B</div>
                        <div className="product-card">Product C</div>
                    </div>
                </div>

                {/* Trending Products */}
                <div className="trending-products">
                    <h2>Trending Products</h2>
                    <div className="product-grid">
                        <div className="product-card">Trending 1</div>
                        <div className="product-card">Trending 2</div>
                        <div className="product-card">Trending 3</div>
                    </div>
                </div>

                
            </div>

            {/* Footer */}
            <footer className="footer">
                <p>&copy; 2025 PriceParrot. All rights reserved.</p>
                <ul className="footer-links">
                    <li><a href="/about">About Us</a></li>
                    <li><a href="/contact">Contact</a></li>
                    <li><a href="/privacy">Privacy Policy</a></li>
                </ul>
            </footer>
        </div>
    );
}

export default Home;