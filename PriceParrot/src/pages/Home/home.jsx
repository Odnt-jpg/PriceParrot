import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar.jsx';
import Carousel from '../../components/carousel/Carousel.jsx';
import ItemCard from '../../components/itemcard/itemcard.jsx';
import { loadRecentlyViewed, addToRecentlyViewed as addToRecentlyViewedUtil } from '../../utils/productStatsUtils.js';
import { fetchWishlist } from '../../utils/wishlistCartFuncs.js';
import { deduplicateAndAggregatePrices } from '../../utils/formatter.js';

function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownResults, setDropdownResults] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [user, setUser] = useState(null);
    const [trending, setTrending] = useState([]);
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
                console.log('Featured products data:', data); // <-- Added console log
                setItems(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, []);

    useEffect(() => {
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
        const interval = setInterval(() => {
            const user = localStorage.getItem('user');
            const loginTime = localStorage.getItem('loginTime');
            if (user && loginTime && Date.now() - Number(loginTime) > sessionTimeout) {
                localStorage.removeItem('user');
                localStorage.removeItem('loginTime');
                window.location.href = '/';
            }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    useEffect(() => {
        // If on the search page, update the search query from the URL
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q && q !== searchQuery) {
            setSearchQuery(q);
        }
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`)
                .then(res => res.json())
                .then(data => setDropdownResults(data.slice(0, 6))) 
                .catch(() => setDropdownResults([]));
        } else {
            setDropdownResults([]);
        }
    }, [searchQuery]);

    useEffect(() => {
        setRecentlyViewed(loadRecentlyViewed());
    }, []);

    const addToRecentlyViewed = (product) => {
        setRecentlyViewed(addToRecentlyViewedUtil(product));
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        setUser(storedUser ? JSON.parse(storedUser) : null);
    }, []);

    useEffect(() => {
        if (user && user.id) {
            fetchWishlist(user.id)
                .then(data => setWishlist(Array.isArray(data) ? data : []))
                .catch(() => setWishlist([]));
        } else {
            setWishlist([]);
        }
    }, [user]);

    useEffect(() => {
        if (user && user.id) {
            console.log('Home: Logged in as', user.email || user.first_name || user.id, user);
        } else {
            console.log('Home: Not logged in');
        }
    }, []);

    useEffect(() => {
        fetch('/api/products/trending')
            .then(res => res.json())
            .then(data => setTrending(Array.isArray(data) ? data : []))
            .catch(() => setTrending([]));
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Hero Section */}
                <section className="text-center mb-12">
                    <div className="flex items-center justify-center mb-4 gap-2">
                        
                        <h1 className="text-4xl font-bold text-gray-800 m-0">Welcome to PriceParrot</h1>
                    </div>
                    <p className="text-xl text-gray-600 mb-8">Your one-stop solution for price comparison.</p>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto flex flex-col relative shadow-md rounded-lg overflow-visible bg-white p-6 ">
                        <div className="flex">
                            <input
                                type="text"
                                placeholder="Search for products..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-grow px-4 py-3 focus:outline-none p-5"
                                autoComplete="off"
                            />
                            <button 
                                onClick={handleSearch} 
                                className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 transition-colors duration-200"
                            >
                                Search
                            </button>
                        </div>
                        {showDropdown && dropdownResults.length > 0 && (
                            <ul className="absolute left-0 right-0 top-full z-10 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-72 overflow-y-auto mt-1">
                                {dropdownResults.map(item => (
                                    <li
                                        key={item.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-left"
                                        onMouseDown={() => {
                                            setShowDropdown(false);
                                            setSearchQuery(item.name);
                                            addToRecentlyViewed(item); // Track click
                                            navigate(`/item/${item.id}`);
                                        }}
                                    >
                                        {item.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                {/* Featured Products */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Featured Products</h2>
                    {error ? (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                            <p>Error: {error}</p>
                        </div>
                    ) : items.length > 0 ? (
                        <Carousel
                            items={deduplicateAndAggregatePrices(items)}
                            itemsPerView={4}
                            renderItem={item => {
                                console.log('Featured ItemCard:', item);
                                return (
                                    <ItemCard
                                        key={item.id}
                                        id={item.id}
                                        image={item.image_url}
                                        name={item.name}
                                        price={item.price}
                                        onClick={() => addToRecentlyViewed(item)} 
                                    />
                                );
                            }}
                        />
                    ) : (
                        <div className="text-center text-gray-500 py-8">No featured products available</div>
                    )}
                </section>

                {/* Trending Products */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Trending Products</h2>
                    <Carousel
                        items={deduplicateAndAggregatePrices(trending)}
                        itemsPerView={4}
                        renderItem={item => {
                            let cheapest = 0;
                            if (Array.isArray(item.prices) && item.prices.length > 0) {
                                cheapest = Math.min(...item.prices.map(p => p.price));
                            } else if (item.price !== undefined) {
                                cheapest = item.price;
                            }
                            console.log('Trending ItemCard:', item);
                            return (
                                <ItemCard
                                    key={item.id}
                                    id={item.id}
                                    image={item.image_url}
                                    name={item.name}
                                    price={cheapest}
                                />
                            );
                        }}
                    />
                </section>

                {/* Recently Viewed Products */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Recently Viewed Products</h2>
                    {recentlyViewed.length === 0 ? (
                        <div className="text-gray-500 col-span-3">No recently viewed products.</div>
                    ) : (
                        <Carousel
                            items={deduplicateAndAggregatePrices(recentlyViewed)}
                            itemsPerView={4}
                            renderItem={item => {
                                console.log('Recently Viewed ItemCard:', item);
                                return (
                                    <ItemCard
                                        key={item.id}
                                        id={item.id}
                                        image={item.image_url}
                                        name={item.name}
                                        price={item.price}
                                        onClick={() => addToRecentlyViewed(item)}
                                    />
                                );
                            }}
                        />
                    )}
                </section>

                {/* Wishlist Products */}
                {user && wishlist.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Wishlist</h2>
                        <Carousel
                            items={[...deduplicateAndAggregatePrices(wishlist).slice(0, 7), { showAllCard: true }]}
                            itemsPerView={4}
                            renderItem={item => {
                                if (item.showAllCard) {
                                    return (
                                        <div
                                            key="show-all-wishlist"
                                            className="flex flex-col items-center justify-center h-full bg-rose-100 border-2 border-rose-400 rounded-lg cursor-pointer hover:bg-rose-200 transition"
                                            style={{ minHeight: 220, minWidth: 180 }}
                                            onClick={() => navigate('/wishlist')}
                                        >
                                            <span className="text-3xl mb-2">➕</span>
                                            <span className="font-semibold text-rose-700">Show All</span>
                                        </div>
                                    );
                                } else {
                                    console.log('Wishlist ItemCard:', item);
                                    return (
                                        <ItemCard
                                            key={item.id}
                                            id={item.id}
                                            image={item.image_url}
                                            name={item.name}
                                            price={item.price}
                                            onClick={() => addToRecentlyViewed(item)}
                                        />
                                    );
                                }
                            }}
                        />
                    </section>
                )}

            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="mb-4 md:mb-0">&copy; 2025 PriceParrot. All rights reserved.</p>
                        <ul className="flex space-x-6">
                            <li><a href="/about" className="hover:text-blue-300 transition-colors">About Us</a></li>
                            <li><a href="/contact" className="hover:text-blue-300 transition-colors">Contact</a></li>
                            <li><a href="/privacy" className="hover:text-blue-300 transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;