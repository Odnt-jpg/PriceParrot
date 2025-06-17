import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar';
import '../../App.css';
import '../../index.css';
import { formatProductName } from '../../utils/formatter.js';
import { addToCart, addToWishlist } from '../../utils/wishlistCartFuncs.js';

const ItemDisplay = () => {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortType, setSortType] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchItemDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch(`/api/products/${id}`);
                if (!response.ok) throw new Error('Failed to fetch item details');
                const data = await response.json();
                setItem(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchItemDetails();
    }, [id]);

    useEffect(() => {
        if (sortType === 'proximity' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setUserLocation(null)
            );
        }
    }, [sortType]);

    let sortedPrices = [];
    if (item && Array.isArray(item.prices)) {
        sortedPrices = [...item.prices];
        if (sortType === 'price') {
            sortedPrices.sort((a, b) => a.price - b.price);
        } else if (sortType === 'proximity' && userLocation) {
            sortedPrices.sort((a, b) => {
                if (a.latitude && a.longitude && b.latitude && b.longitude) {
                    const distA = Math.sqrt((a.latitude - userLocation.lat) ** 2 + (a.longitude - userLocation.lng) ** 2);
                    const distB = Math.sqrt((b.latitude - userLocation.lat) ** 2 + (b.longitude - userLocation.lng) ** 2);
                    return distA - distB;
                }
                return 0;
            });
        }
    }

    // Auto-Logout
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

    useEffect(() => {
        // Show login status and account details
        const userObj = JSON.parse(localStorage.getItem('user'));
        if (userObj && userObj.id) {
            console.log('ItemDisplay: Logged in as', userObj.email || userObj.first_name || userObj.id, userObj);
        } else {
            console.log('ItemDisplay: Not logged in');
        }
    }, []);

    const getToken = () => localStorage.getItem('token');

    const handleAddToCart = async () => {
        if (!user) return;
        try {
            const res = await addToCart(item.id);
            if (res.status === 409) {
                setPopupMessage('Product already in cart');
            } else if (!res.ok) {
                throw new Error('Failed to add to cart');
            } else {
                setPopupMessage('Added to cart!');
            }
        } catch (err) {
            setPopupMessage('Failed to add to cart');
        }
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
    };

    const handleAddToWishlist = async () => {
        if (!user) return;
        try {
            const res = await addToWishlist(item.id);
            if (res.status === 409) {
                setPopupMessage('Product already in wishlist');
            } else if (!res.ok) {
                throw new Error('Failed to add to wishlist');
            } else {
                setPopupMessage('Added to wishlist!');
            }
        } catch (err) {
            setPopupMessage('Failed to add to wishlist');
        }
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
    };

    if (isLoading) return <div className="text-center mt-10">Loading item details...</div>;
    if (error) return <div className="text-center text-red-600 mt-10">Error: {error}</div>;
    if (!item) return <div className="text-center text-red-600 mt-10">Item not found</div>;

    return (
        <div className="item-display-page bg-gray-100 min-h-screen pb-16">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 pt-6">
                {showPopup && (
                    <div style={{position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1000}} className="bg-green-500 text-white px-6 py-3 rounded shadow-lg animate-bounce">
                        {popupMessage}
                    </div>
                )}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    ← Back
                </button>
                <div className="item-details-container bg-white shadow-lg rounded-2xl p-8 flex flex-col md:flex-row gap-10">
                    {/* Left Side */}
                    <div className="flex-1 flex flex-col items-center">
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full max-w-md rounded-xl shadow-md mb-6"
                        />
                        <h1 className="text-4xl font-bold mb-3 text-center text-gray-800">
                            {formatProductName(item.name)}
                        </h1>
                        {user && (
                            <div className="flex flex-col gap-2 w-full items-center">
                                <button className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600 font-semibold w-full" onClick={handleAddToCart}>
                                    Add to Cart
                                </button>
                                <button className="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600 font-semibold w-full" onClick={handleAddToWishlist}>
                                    Add to Wishlist
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Side */}
                    <div className="flex-1">
                        {sortedPrices.length > 0 && (
                            <div className="flex justify-end gap-3 mb-4">
                                <button
                                    className={`px-4 py-2 rounded-lg font-semibold border transition ${
                                        sortType === 'price'
                                            ? 'bg-red-500 text-white border-red-500'
                                            : 'bg-white text-red-500 border-red-500 hover:bg-red-50'
                                    }`}
                                    onClick={() => setSortType('price')}
                                >
                                    Sort by Price
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg font-semibold border transition ${
                                        sortType === 'proximity'
                                            ? 'bg-green-500 text-white border-green-500'
                                            : 'bg-white text-green-500 border-green-500 hover:bg-green-50'
                                    }`}
                                    onClick={() => setSortType('proximity')}
                                >
                                    Sort by Proximity
                                </button>
                            </div>
                        )}
                        <div className="bg-gray-50 rounded-xl shadow-inner p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700 text-right">Prices from Retailers:</h2>
                            <ul className="space-y-4">
                                {sortedPrices.map((p, idx) => (
                                    <li
                                        key={idx}
                                        className="flex justify-between items-center px-4 py-3 bg-white rounded-xl shadow-md border"
                                    >
                                        {p.retailer_url ? (
                                            <a
                                                href={p.retailer_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-blue-700 underline"
                                            >
                                                {p.retailer_name || p.name || `Retailer ${p.retailer_id || ''}`}
                                            </a>
                                        ) : (
                                            <span className="font-bold text-blue-700">
                                                {p.retailer_name || p.name || `Retailer ${p.retailer_id || ''}`}
                                            </span>
                                        )}
                                        <span className="text-lg text-gray-700 font-medium">
                                            ${typeof p.price === 'number' ? p.price.toFixed(2) : p.price}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="item-comments mt-12 bg-white rounded-2xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-black">Comments</h2>
                    <p className="text-gray-600 text-center mb-4">
                        {item.description || 'No description available.'}
                    </p>
                    {user && (
                        <div className="flex justify-center">
                            <button className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-semibold">
                                Add Comment
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDisplay;
