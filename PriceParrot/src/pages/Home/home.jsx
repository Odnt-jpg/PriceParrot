import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar.jsx';
import './home.css';
import Carousel from '../../components/carousel/Carousel.jsx';
import ItemCard from '../../components/itemcard/itemcard.jsx';

function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch('/api/products/featured');
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const data = await response.json();
                console.log(data);
                setItems(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="home-page">
            <Navbar />
            <div className="home-content">
                <h1>Welcome to PriceParrot</h1>
                <p>Your one-stop solution for price comparison.</p>

                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search for products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="search-input"
                    />
                    <button onClick={handleSearch} className="search-button">
                        Search
                    </button>
                </div>

                <div className="featured-section">
                    <h2>Featured Products</h2>
                    {error ? (
                        <div className="error-message">Error: {error}</div>
                    ) 
                    // : isLoading ? (
                    //     <div className="loading">Loading products...</div>
                    // ) 
                    : items.length > 0 ? (
                        <Carousel
                            items={items}
                            itemsPerView={4}
                            renderItem={item => (
                                <ItemCard
                                    key={item.id}
                                    id={item.id}
                                    image={item.image_url}
                                    name={item.name}
                                    price={item.price}
                                />)}
                        />
                        
                    ) : (
                        <div>No featured products available</div>
                    )}
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