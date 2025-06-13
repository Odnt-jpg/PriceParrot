import React, { useEffect, useState } from 'react';
import './cart.css';
import Navbar from '../../components/navbar/navbar';
import { fetchCart } from '../../utils/wishlistCartFuncs';
import { aggregateCartByStore } from '../../utils/cartAggregator';
import StoreCard from '../../components/storecard/storecard';
import { formatProductName } from '../../utils/formatter';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendedStores, setRecommendedStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [sortMode, setSortMode] = useState('price'); // 'price' or 'proximity'

  // Auto-logout if session expired (e.g., after 1 hour)
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
    const userObj = JSON.parse(localStorage.getItem('user'));
    if (userObj && userObj.id) {
      console.log('Cart: Logged in as', userObj.email || userObj.first_name || userObj.id, userObj);
    } else {
      console.log('Cart: Not logged in');
    }
  }, []);

  useEffect(() => {
    const getCart = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
          setError('You must be logged in to view your cart.');
          setLoading(false);
          return;
        }
        const data = await fetchCart(user.id);
        setCartItems(data);
        const stores = aggregateCartByStore(data);
        console.log('Aggregated stores:', stores);
        setRecommendedStores(stores);
        if (stores.length > 0) setSelectedStore(stores[0].name); // Default to first store
      } catch (err) {
        setError(err.message || 'Error loading cart');
      } finally {
        setLoading(false);
      }
    };
    getCart();
  }, []);

  // Helper to get price for a product from selected store
  const getStorePrice = (item, storeName) => {
    if (!item.competitors) return null;
    const offer = item.competitors.find(
      o => (o.retailer_name || o.retailer) === storeName
    );
    return offer ? Number(offer.price) : null;
  };

  // Helper: Haversine formula for distance in km
  function haversine(lat1, lon1, lat2, lon2) {
    function toRad(x) { return x * Math.PI / 180; }
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Sort recommended stores by price or proximity
  useEffect(() => {
    if (!recommendedStores.length) return;
    if (sortMode === 'proximity') {
      navigator.geolocation?.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          const storesWithDistance = recommendedStores.map(store => {
            if (store.latitude && store.longitude) {
              return { ...store, distance: haversine(latitude, longitude, store.latitude, store.longitude) };
            }
            return { ...store, distance: null };
          });
          storesWithDistance.sort((a, b) => {
            if (a.distance != null && b.distance != null) return a.distance - b.distance;
            if (a.distance != null) return -1;
            if (b.distance != null) return 1;
            return 0;
          });
          setRecommendedStores(storesWithDistance);
        },
        () => {
          // If location not available, fallback to price
          const sorted = [...recommendedStores].sort((a, b) => a.total - b.total);
          setRecommendedStores(sorted);
        }
      );
    } else {
      // Sort by price
      const sorted = [...recommendedStores].sort((a, b) => a.total - b.total);
      setRecommendedStores(sorted);
    }
  }, [cartItems, sortMode]);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Your Cart</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Cart Items */}
          <div className="md:w-1/2 w-full bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Items in Cart</h2>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : cartItems.length === 0 ? (
              <div className="text-gray-500">Your cart is empty.</div>
            ) : (
              <>
                <ul>
                  {cartItems.map(item => (
                    <li key={item.id || item.product_id} className="flex justify-between items-center py-2 border-b">
                      <span>{formatProductName(item.name || item.product_name)}</span>
                      <span className="font-semibold">
                        {selectedStore && getStorePrice(item, selectedStore) !== null
                          ? `$${getStorePrice(item, selectedStore).toFixed(2)}`
                          : 'N/A'}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center mt-6 pt-4 border-t text-lg font-bold">
                  <span>Total:</span>
                  <span>
                    {selectedStore
                      ? `$${cartItems.reduce((sum, item) => {
                          const p = getStorePrice(item, selectedStore);
                          return sum + (p ? p : 0);
                        }, 0).toFixed(2)}`
                      : 'N/A'}
                  </span>
                </div>
              </>
            )}
          </div>
          {/* Right: Recommended Stores */}
          <div className="md:w-1/2 w-full bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recommended Stores</h2>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded border text-sm transition ${sortMode === 'price' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                  onClick={() => setSortMode('price')}
                >
                  Sort by Price
                </button>
                <button
                  className={`px-3 py-1 rounded border text-sm transition ${sortMode === 'proximity' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                  onClick={() => setSortMode('proximity')}
                >
                  Sort by Proximity
                </button>
              </div>
            </div>
            {recommendedStores.length === 0 ? (
              <div className="text-gray-500">No recommendations yet.</div>
            ) : (
              <div className="grid gap-4">
                {recommendedStores.map((store, idx) => (
                  <StoreCard
                    key={store.name}
                    image={store.image || 'https://via.placeholder.com/150'}
                    name={store.name}
                    price={store.total}
                    id={store.id}
                    className={`w-full ${selectedStore === store.name ? 'bg-sky-100' : 'bg-white'}`}
                    onClick={() => setSelectedStore(store.name)}
                  >
                    {store.distance != null && (
                      <div className="text-xs text-gray-500 mt-1">
                        {`Distance: ${store.distance.toFixed(1)} km`}
                      </div>
                    )}
                  </StoreCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
