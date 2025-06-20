import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar';
import Footer from '../../components/Footer';
import '../../App.css';
import '../../index.css';
import { formatProductName } from '../../utils/formatter.js';
import { addToCart, addToWishlist } from '../../utils/wishlistCartFuncs.js';
import { getRetailerLogoById } from '../../utils/retailerLogoUtils';
import ParrotLoader from '../../components/ParrotLoader';
import { fetchRetailerAddresses, haversine, getClosestBranchDistance } from '../../utils/locationUtils';

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
    const [proximityData, setProximityData] = useState({}); // { [retailerId]: [addressObj, ...] }

    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [retailerLogos, setRetailerLogos] = useState({}); // State to hold retailer logos for each price entry
    const [sortedProximityPrices, setSortedProximityPrices] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [selectedRetailer, setSelectedRetailer] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [submittingReview, setSubmittingReview] = useState(false);
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

    useEffect(() => {
        if (sortType === 'proximity' && userLocation && item && Array.isArray(item.prices)) {
            // For each retailer, fetch their addresses and find the closest branch
            Promise.all(item.prices.map(async (p) => {
                if (!p.retailer_id) return { ...p, minDist: null };
                const addresses = await fetchRetailerAddresses(p.retailer_id);
                const { minDist, closestBranch } = getClosestBranchDistance(userLocation.lat, userLocation.lng, addresses);
                return { ...p, minDist, closestBranch };
            })).then(pricesWithDist => {
                // Sort by minDist (nulls last)
                pricesWithDist.sort((a, b) => {
                    if (a.minDist == null && b.minDist == null) return 0;
                    if (a.minDist == null) return 1;
                    if (b.minDist == null) return -1;
                    return a.minDist - b.minDist;
                });
                setSortedProximityPrices(pricesWithDist);
            });
        }
    }, [sortType, userLocation, item]);

    let sortedPrices = [];
    if (item && Array.isArray(item.prices)) {
        if (sortType === 'proximity' && userLocation) {
            sortedPrices = sortedProximityPrices.length > 0 ? sortedProximityPrices : [...item.prices];
        } else {
            sortedPrices = [...item.prices];
            if (sortType === 'price') {
                sortedPrices.sort((a, b) => a.price - b.price);
            }
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

    useEffect(() => {
        // Increment view count when product is opened
        fetch(`/api/products/view/${id}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => console.log('View count incremented:', data))
            .catch(err => console.error('Error incrementing view count:', err));
    }, [id]);

    // Fetch reviews
    useEffect(() => {
        if (!id) return;
        fetch(`/api/products/reviews/${id}`)
            .then(res => res.json())
            .then(setReviews)
            .catch(() => setReviews([]));
    }, [id]);

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

    // Helper to calculate distance in km
    function getDistanceKm(lat1, lon1, lat2, lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
        return haversine(lat1, lon1, lat2, lon2);
    }

    useEffect(() => {
        if (item && Array.isArray(item.prices)) {
            item.prices.forEach(p => {
                if (p.retailer_id && !retailerLogos[p.retailer_id]) {
                    getRetailerLogoById(p.retailer_id).then(logoUrl => {
                        setRetailerLogos(prev => ({ ...prev, [p.retailer_id]: logoUrl }));
                    });
                }
            });
        }
    }, [item]);

    if (isLoading) return <ParrotLoader text="Loading item details..." />;
    if (error) return <div className="text-center text-red-600 mt-10">Error: {error}</div>;
    if (!item) return <div className="text-center text-red-600 mt-10">Item not found</div>;

    return (
        <div className="min-h-screen flex flex-col ">
            <Navbar />
            <main className="flex-1 ">
                <div className="item-display-page  pb-16">
                    <div className="max-w-6xl mx-auto px-4 pt-6 min-h-screen">
                        {showPopup && (
                            <div style={{position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1000}} className="bg-green-500 text-white px-6 py-3 rounded shadow-lg animate-bounce">
                                {popupMessage}
                            </div>
                        )}
                        <button
                            onClick={() => navigate(-1)}
                            className="mb-6 bg-secondary text-white px-4 py-2 rounded hover:bg-rose-700"
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
                                        <button className="bg-primary text-white px-6 py-2 rounded hover:bg-emerald-600 font-semibold w-full" onClick={handleAddToCart}>
                                            Add to Cart
                                        </button>
                                        <button className="bg-secondary text-white px-6 py-2 rounded hover:bg-rose-700 font-semibold w-full" onClick={handleAddToWishlist}>
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
                                                    ? 'bg-secondary text-white border-secondary'
                                                    : 'bg-white text-secondary border-secondary hover:bg-red-50'
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
                                <div className="bg-gray-300 rounded-2xl shadow-xl p-8 ">
                                    <h2 className="text-xl font-semibold mb-4 text-gray-700 text-right">Prices from Retailers:</h2>
                                    <ul className="space-y-4">
                                        {sortedPrices.map((p, idx) => {
                                            const logo = retailerLogos[p.retailer_id] || '';
                                            let distance = null;
                                            if (sortType === 'proximity' && p.minDist != null) {
                                                distance = p.minDist;
                                            } else if (userLocation && p.latitude && p.longitude) {
                                                distance = getDistanceKm(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
                                            }
                                            return (
                                                <li
                                                    key={idx}
                                                    className="flex justify-between items-center px-4 py-3 bg-white/90 rounded-2xl shadow-lg "
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {logo && (
                                                            <img src={logo} alt={p.retailer_name} className="h-10 w-10 object-contain rounded-2xl bg-gray-100" />
                                                        )}
                                                        <span className="font-bold text-blue-700 truncate">{p.retailer_name || p.name || `Retailer ${p.retailer_id || ''}`}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end min-w-0">
                                                        <span className="text-lg text-gray-700 font-medium" style = {{fontFamily : "Farabee, sans serif"}}>${typeof p.price === 'number' ? p.price.toFixed(2) : p.price}</span>
                                                        {distance !== null && (
                                                            <span className="text-xs text-gray-500 mt-1">{distance.toFixed(2)} km away</span>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="item-comments mt-12 bg-white rounded-2xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-black">Comments</h2>
                                {user && (
                                    <button
                                        className="bg-secondary text-white px-6 py-2 rounded hover:bg-rose-600 font-semibold"
                                        onClick={() => setShowReviewForm(v => !v)}
                                    >
                                        {showReviewForm ? 'Cancel' : 'Add Comment'}
                                    </button>
                                )}
                            </div>
                            
                            {user && showReviewForm && (
                                <div className="flex flex-col items-center mb-4">
                                    <form
                                        className="w-full max-w-lg bg-gray-100 rounded-xl p-4 mt-2"
                                        onSubmit={async e => {
                                            e.preventDefault();
                                            if (!selectedRetailer || !reviewRating) return;
                                            setSubmittingReview(true);
                                            const res = await fetch('/api/products/reviews', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    user_id: user.id,
                                                    product_id: id,
                                                    retailer_id: selectedRetailer,
                                                    rating: reviewRating,
                                                    comment: reviewText
                                                })
                                            });
                                            setSubmittingReview(false);
                                            if (res.ok) {
                                                setShowReviewForm(false);
                                                setReviewText('');
                                                setSelectedRetailer('');
                                                setReviewRating(5);
                                                // Refresh reviews
                                                fetch(`/api/products/reviews/${id}`)
                                                    .then(res => res.json())
                                                    .then(setReviews)
                                                    .catch(() => {});
                                            }
                                        }}
                                    >
                                        <div className="mb-2">
                                            <label className="block mb-1 font-medium">Retailer</label>
                                            <select
                                                className="w-full border rounded px-2 py-1"
                                                value={selectedRetailer}
                                                onChange={e => setSelectedRetailer(e.target.value)}
                                                required
                                            >
                                                <option value="">Select a retailer</option>
                                                {item.prices.map(p => (
                                                    <option key={p.retailer_id} value={p.retailer_id}>
                                                        {p.retailer_name || p.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {item.prices.map(p => (
                                                    <span key={p.retailer_id} className="inline-flex items-center gap-1 text-xs">
                                                        {retailerLogos[p.retailer_id] && (
                                                            <img src={retailerLogos[p.retailer_id]} alt="logo" className="h-5 w-5 inline-block rounded" />
                                                        )}
                                                        {p.retailer_name || p.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <label className="block mb-1 font-medium">Rating</label>
                                            <select
                                                className="w-full border rounded px-2 py-1"
                                                value={reviewRating}
                                                onChange={e => setReviewRating(Number(e.target.value))}
                                                required
                                            >
                                                {[5,4,3,2,1].map(r => (
                                                    <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5-r)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-2">
                                            <label className="block mb-1 font-medium">Review</label>
                                            <textarea
                                                className="w-full border rounded px-2 py-1"
                                                value={reviewText}
                                                onChange={e => setReviewText(e.target.value)}
                                                rows={3}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="bg-green-600 text-white px-4 py-2 rounded font-semibold mt-2"
                                            disabled={submittingReview}
                                        >
                                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </form>
                                </div>
                            )}
                            <div className="divide-y">
                                {reviews.length === 0 && <div className="text-gray-400 text-center py-4">No reviews yet.</div>}
                                {reviews.map((r, idx) => (
                                    <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            {retailerLogos[r.retailer_id] && (
                                                <img src={retailerLogos[r.retailer_id]} alt="logo" className="h-7 w-7 rounded" />
                                            )}
                                            <span className="font-semibold text-blue-700">{r.first_name} {r.last_name}</span>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                                            <span className="ml-2 text-gray-700">{r.comment}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 ml-2">{new Date(r.created_at).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {/* Only show footer when not loading */}
            {!isLoading && <Footer />}
        </div>
    );
};

export default ItemDisplay;
