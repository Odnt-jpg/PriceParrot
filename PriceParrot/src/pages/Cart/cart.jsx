import React, { useEffect, useState } from 'react';
import './cart.css';
import Navbar from '../../components/navbar/navbar';
import { fetchCart, removeFromCart } from '../../utils/wishlistCartFuncs';
import { aggregateCartByStore } from '../../utils/cartAggregator';
import StoreCard from '../../components/storecard/storecard';
import { formatProductName } from '../../utils/formatter';
import { haversine, getClosestBranchDistance, fetchRetailerAddresses } from '../../utils/locationUtils';
import { getRetailerLogoById } from '../../utils/retailerLogoUtils';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendedStores, setRecommendedStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [sortMode, setSortMode] = useState(null); // null = 'Best Fit', 'price' or 'proximity'
  const [originalStores, setOriginalStores] = useState([]); // Save aggregator order
  const [storeLogos, setStoreLogos] = useState({});

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
        setOriginalStores(stores); 
        setRecommendedStores(stores);
        if (stores.length > 0) setSelectedStore(stores[0].name); 
      } catch (err) {
        setError(err.message || 'Error loading cart');
      } finally {
        setLoading(false);
      }
    };
    getCart();
  }, []);

  const getStorePrice = (item, storeName) => {
    if (!item.competitors) return null;
    const offer = item.competitors.find(
      o => (o.retailer_name || o.retailer) === storeName
    );
    return offer ? Number(offer.price) : null;
  };

  useEffect(() => {
    if (!originalStores.length) {
      console.log('No originalStores, skipping proximity logic');
      return;
    }
    if (sortMode === 'proximity') {
      console.log('Proximity sort triggered');
      navigator.geolocation?.getCurrentPosition(
        async pos => {
          const { latitude, longitude } = pos.coords;
          console.log('User geolocation:', { latitude, longitude });
          // Fetch addresses for all stores in parallel
          const addressPromises = originalStores.map(store => {
            console.log('Fetching addresses for store:', store.name, 'with id:', store.id);
            return store.id ? fetchRetailerAddresses(store.id) : Promise.resolve([]);
          });
          const allAddresses = await Promise.all(addressPromises);
          console.log('All fetched addresses:', allAddresses);
          const storesWithDistance = originalStores.map((store, idx) => {
            const addresses = allAddresses[idx];
            console.log('Checking store for proximity:', {
              name: store.name,
              addresses,
              latitude: store.latitude,
              longitude: store.longitude
            });
            if (Array.isArray(addresses) && addresses.length > 0) {
              const { minDist, closestBranch } = getClosestBranchDistance(latitude, longitude, addresses);
              console.log('Result for addresses:', { minDist, closestBranch });
              return { ...store, distance: minDist, closestBranch };
            } else if (store.latitude && store.longitude) {
              const dist = haversine(latitude, longitude, store.latitude, store.longitude);
              console.log('Result for lat/lng:', { dist });
              return { ...store, distance: dist, closestBranch: null };
            }
            console.log('No valid location data for store:', store.name);
            return { ...store, distance: null, closestBranch: null };
          });
          console.log('Stores with computed distances:', storesWithDistance);
          storesWithDistance.sort((a, b) => {
            if (a.distance != null && b.distance != null) return a.distance - b.distance;
            if (a.distance != null) return -1;
            if (b.distance != null) return 1;
            return 0;
          });
          console.log('Stores after sorting by distance:', storesWithDistance);
          setRecommendedStores(storesWithDistance);
        },
        err => {
          console.log('Geolocation error:', err);
          setRecommendedStores([...originalStores]);
        }
      );
    } else if (sortMode === 'price') {
      const sorted = [...originalStores].sort((a, b) => a.total - b.total);
      setRecommendedStores(sorted);
    } else {
      setRecommendedStores([...originalStores]);
    }
  }, [cartItems, sortMode, originalStores]);

  // Fetch retailer logos for recommended stores
  useEffect(() => {
    async function fetchLogos() {
      const logos = {};
      for (const store of recommendedStores) {
        if (store.id && !logos[store.id]) {
          logos[store.id] = await getRetailerLogoById(store.id);
        }
      }
      setStoreLogos(logos);
    }
    if (recommendedStores.length > 0) fetchLogos();
  }, [recommendedStores]);

  // Helper to get all top stores for each sort
  function getTopStoresBySort(stores) {
    const bestFit = stores.length > 0 ? [stores[0].name] : [];
    const cheapest = [...stores].sort((a, b) => a.total - b.total)[0]?.name;
    const closest = [...stores].filter(s => s.distance != null).sort((a, b) => a.distance - b.distance)[0]?.name;
    return {
      bestFit,
      cheapest: cheapest ? [cheapest] : [],
      closest: closest ? [closest] : []
    };
  }

  const topStores = getTopStoresBySort(recommendedStores);

  // Remove item from cart with confirmation and backend call
  const handleRemove = async (itemId) => {
    if (window.confirm('Are you sure you want to remove this item from your cart?')) {
      try {
        const res = await removeFromCart(itemId);
        if (res.ok) {
          // Refresh cart from backend
          const user = JSON.parse(localStorage.getItem('user'));
          if (user && user.id) {
            const data = await fetchCart(user.id);
            setCartItems(data);
          }
        } else {
          alert('Failed to remove item from cart.');
        }
      } catch (err) {
        alert('Error removing item from cart.');
      }
    }
  };

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
                    <li key={item.id || item.product_id} className="flex justify-between items-center py-2 border-b gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url || 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg'}
                          alt={item.name || item.product_name}
                          className="w-12 h-12 object-contain rounded shadow"
                        />
                        <span>{formatProductName(item.name || item.product_name)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {selectedStore && getStorePrice(item, selectedStore) !== null
                            ? `$${getStorePrice(item, selectedStore).toFixed(2)}`
                            : 'N/A'}
                        </span>
                        <button
                          className="remove-btn text-red-600 text-xl font-bold px-2 hover:text-red-800 focus:outline-none"
                          title="Remove from cart"
                          aria-label="Remove from cart"
                          onClick={() => handleRemove(item.id || item.product_id)}
                        >
                          ×
                        </button>
                      </div>
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
                  className={`px-3 py-1 rounded border text-sm transition ${sortMode === null ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                  onClick={() => setSortMode(sortMode === null ? null : null)}
                  aria-pressed={sortMode === null}
                >
                  Best Fit
                </button>
                <button
                  className={`px-3 py-1 rounded border text-sm transition ${sortMode === 'price' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                  onClick={() => setSortMode(sortMode === 'price' ? null : 'price')}
                  aria-pressed={sortMode === 'price'}
                >
                  Sort by Price
                </button>
                <button
                  className={`px-3 py-1 rounded border text-sm transition ${sortMode === 'proximity' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                  onClick={() => setSortMode(sortMode === 'proximity' ? null : 'proximity')}
                  aria-pressed={sortMode === 'proximity'}
                >
                  Sort by Proximity
                </button>
              </div>
            </div>
            {recommendedStores.length === 0 ? (
              <div className="text-gray-500">No recommendations yet.</div>
            ) : (
              <div className="grid gap-4">
                {recommendedStores.map((store, idx) => {
                  let borderClass = '';
                  let flavorArr = [];
                  // Check if this store is top for any sort
                  if (topStores.bestFit.includes(store.name)) {
                    borderClass += ' border-4 border-rose-500';
                    flavorArr.push('Best Fit: This store offers the best overall value for your cart!');
                  }
                  if (topStores.cheapest.includes(store.name)) {
                    borderClass += borderClass.includes('border-4') ? ' border-green-500' : ' border-4 border-green-500';
                    flavorArr.push('Cheapest: This store has the lowest total price for your cart!');
                  }
                  if (topStores.closest.includes(store.name)) {
                    borderClass += borderClass.includes('border-4') ? ' border-blue-500' : ' border-4 border-blue-500';
                    flavorArr.push('Closest: This store is nearest to your location!');
                  }
                  return (
                    <StoreCard
                      key={store.name}
                      image={storeLogos[store.id] || store.image || 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg'}
                      name={store.name}
                      price={store.total}
                      id={store.id}
                      locations={Array.isArray(store.addresses) ? store.addresses.filter(addr => addr.latitude && addr.longitude) : []}
                      className={`w-full ${selectedStore === store.name ? 'bg-sky-100' : 'bg-white'} ${borderClass}`}
                      onClick={() => setSelectedStore(store.name)}
                      flavorText={flavorArr.length > 0 ? flavorArr.join(' | ') : ''}
                      distance={store.distance}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
