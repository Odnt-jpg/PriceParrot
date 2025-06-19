import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar.jsx';
import Carousel from '../../components/carousel/Carousel.jsx';
import ItemCard from '../../components/itemcard/itemcard.jsx';
import { loadRecentlyViewed, addToRecentlyViewed as addToRecentlyViewedUtil } from '../../utils/productStatsUtils.js';
import { fetchWishlist } from '../../utils/wishlistCartFuncs.js';
import { deduplicateAndAggregatePrices } from '../../utils/formatter.js';
import LogoPng from '../../components/Images/bigparrot.png';
import ParrotLoader from '../../components/ParrotLoader';
import Footer from '../../components/Footer';
import { fetchProductSearch, handleSearchNavigate } from '../../utils/searchUtils';

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
    const [showLoader, setShowLoader] = useState(false);
    const loaderTimeoutRef = useRef(null);
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
                console.log('Featured products data:', data); 
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

    //Search functionality
    const handleSearch = () => {
        handleSearchNavigate(searchQuery, navigate);
    };

    // Dropdown search logic
    useEffect(() => {
        let ignore = false;
        if (searchQuery.trim()) {
            fetchProductSearch(searchQuery).then(results => {
                if (!ignore) setDropdownResults(results.slice(0, 6));
            });
        } else {
            setDropdownResults([]);
        }
        return () => { ignore = true; };
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

    function deduplicateById(arr) {
        const map = new Map();
        arr.forEach(item => {
            if (item && item.id && !map.has(item.id)) {
                map.set(item.id, item);
            }
        });
        return Array.from(map.values());
    }

    useEffect(() => {
        if (isLoading) {
            loaderTimeoutRef.current = setTimeout(() => {
                setShowLoader(true);
            }, 3000);
        } else {
            setShowLoader(false);
            if (loaderTimeoutRef.current) {
                clearTimeout(loaderTimeoutRef.current);
                loaderTimeoutRef.current = null;
            }
        }
        return () => {
            if (loaderTimeoutRef.current) {
                clearTimeout(loaderTimeoutRef.current);
                loaderTimeoutRef.current = null;
            }
        };
    }, [isLoading]);

    if (showLoader) return <ParrotLoader text="Loading..." />;

    return (
        <div className="min-h-screen flex flex-col ">
            <Navbar />
            {/* Grabber Section */}
            <div className="w-full flex flex-col bg-gray-50 pb-8 drop-shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-8 px-4 md:px-12 max-w-6xl mx-auto w-full">
                    {/* Left: Logo Image */}
                    <div className="flex-1 flex justify-center items-center">
                        <img src={LogoPng} alt="PriceParrot Logo" className="w-48 h-48 object-contain drop-shadow-xl" />
                    </div>
                    {/* Right: Welcome Text */}
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                        <h1 className="text-4xl mb-2 tracking-wide font-bold text-primary">
                            WELCOME TO <span className="text-secondary font-extrabold" style={{fontFamily: 'Farabee, Raleway, sans-serif'}}>PRICE PARROT</span>
                        </h1>
                        <span className="text-lg mb-6 text-neutral">
                            Your one-stop solution for the cheapest prices <span className="text-secondary font-semibold">islandwide</span>
                        </span>
                        <div className="w-full max-w-md mx-auto relative mb-6">
                            <div className="flex rounded-lg shadow-lg border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-rose-400 drop-shadow-xl">
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
                                    className="flex-grow px-4 py-3 text-gray-800 bg-transparent focus:outline-none text-base placeholder-gray-400"
                                    autoComplete="off"
                                    style={{ minWidth: 0 }}
                                />
                                <button
                                    onClick={handleSearch}
                                    className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 font-semibold transition-colors duration-200 rounded-none"
                                    style={{ borderLeft: '1px solid #e5e7eb' }}
                                >
                                    Search
                                </button>
                            </div>
                            {showDropdown && dropdownResults.length > 0 && (
                                <ul className="absolute left-0 right-0 top-full z-20 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-72 overflow-y-auto mt-1">
                                    {dropdownResults.map(item => (
                                        <li
                                            key={item.id}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-left text-gray-800"
                                            onMouseDown={() => {
                                                setShowDropdown(false);
                                                setSearchQuery(item.name);
                                                addToRecentlyViewed(item);
                                                navigate(`/item/${item.id}`);
                                            }}
                                        >
                                            {item.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-12 md:h-16" />
            <main className="flex-1">
                {/* Featured Products */}
                <section className="mb-12 bg-white pt-4 drop-shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 px-6 ">Featured Products</h2>
                    {error ? (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                            <p>Error: {error}</p>
                        </div>
                    ) : items.length > 0 ? (
                        <Carousel
                            items={deduplicateById(deduplicateAndAggregatePrices(items))}
                            itemsPerView={4}
                            renderItem={item => {
                                let cheapest = 0;
                                if (Array.isArray(item.prices) && item.prices.length > 0) {
                                    cheapest = Math.min(...item.prices.map(p => p.price));
                                } else if (item.price !== undefined) {
                                    cheapest = item.price;
                                }
                                console.log('Featured ItemCard:', item);
                                return (
                                    <ItemCard
                                        key={item.id}
                                        id={item.id}
                                        image={item.image_url}
                                        name={item.name}
                                        price={cheapest}
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
                <section className="mb-12 bg-white pt-4 drop-shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 px-6">Trending Products</h2>
                  
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
                <section className="mb-12 bg-white pt-4 drop-shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 px-6">Recently Viewed Products</h2>
                    {recentlyViewed.length === 0 ? (
                        <div className="text-gray-500 col-span-3">No recently viewed products.</div>
                    ) : (
                        <Carousel
                            items={deduplicateAndAggregatePrices(recentlyViewed)}
                            itemsPerView={4}
                            renderItem={item => {
                                let cheapest = 0;
                                if (Array.isArray(item.prices) && item.prices.length > 0) {
                                    cheapest = Math.min(...item.prices.map(p => p.price));
                                } else if (item.price !== undefined) {
                                    cheapest = item.price;
                                }
                                console.log('Recently Viewed ItemCard:', item);
                                return (
                                    <ItemCard
                                        key={item.id}
                                        id={item.id}
                                        image={item.image_url}
                                        name={item.name}
                                        price={cheapest}
                                        onClick={() => addToRecentlyViewed(item)}
                                    />
                                );
                            }}
                        />
                    )}
                </section>

                {/* Wishlist Products */}
                {user && wishlist.length > 0 && (
                    <section className="mb-12  bg-white pt-4 drop-shadow-lg">
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
                                    let cheapest = 0;
                                    if (Array.isArray(item.prices) && item.prices.length > 0) {
                                        cheapest = Math.min(...item.prices.map(p => p.price));
                                    } else if (item.price !== undefined) {
                                        cheapest = item.price;
                                    }
                                    console.log('Wishlist ItemCard:', item);
                                    return (
                                        <ItemCard
                                            key={item.id}
                                            id={item.id}
                                            image={item.image_url}
                                            name={item.name}
                                            price={cheapest}
                                            onClick={() => addToRecentlyViewed(item)}
                                        />
                                    );
                                }
                            }}
                        />
                    </section>
                )}

            </main>
            {/* Only show footer when not loading */}
            {!isLoading && <Footer />}
        </div>
    );
}

export default Home;