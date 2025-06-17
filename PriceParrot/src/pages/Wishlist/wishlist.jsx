import React, { useEffect, useState } from 'react';
import './wishlist.css';
import Navbar from '../../components/navbar/navbar';
import {
  fetchWishlist,addToWishlist,removeFromWishlist,addMultipleToCart
} from '../../utils/wishlistCartFuncs';
import { formatProductName } from '../../utils/formatter';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]); 

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
    const getWishlist = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
          setError('You must be logged in to view your wishlist.');
          setLoading(false);
          return;
        }
        const data = await fetchWishlist(user.id);
        setWishlist(data);
        console.log('Wishlist data:', data); // Debugging line
      } catch (err) {
        setError(err.message || 'Error loading wishlist');
      } finally {
        setLoading(false);
      }
    };
    getWishlist();
  }, []);

  // Remove from wishlist
  const handleRemoveFromWishlist = async (productId) => {
    try {
      const res = await removeFromWishlist(productId);
      if (!res.ok) {
        alert('Failed to remove from wishlist');
      } else {
        alert('Removed from wishlist!');
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
          const data = await fetchWishlist(user.id);
          setWishlist(data);
        }
      }
    } catch (err) {
      alert('Failed to remove from wishlist');
    }
  };

  // Handle checkbox toggle
  const handleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddToCart = async () => {
    if (selected.length === 0) {
      alert('Please select at least one item to add to cart.');
      return;
    }
    try {
      const res = await addMultipleToCart(selected);
      if (!res.ok) {
        alert('Failed to add items to cart');
      } else {
        alert('Selected items added to cart!');
        setSelected([]);
      }
    } catch (err) {
      alert('Failed to add items to cart');
    }
  };

  return (
    <>
      <Navbar />
      <div className="wishlist-page min-h-screen bg-gray-50 pb-12">
        <h1 className="text-3xl font-bold text-center py-8">Your Wishlist</h1>
        {/* Add to Cart Button */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-4">
            <button
              onClick={handleAddToCart}
              disabled={selected.length === 0}
              className={`w-full sm:w-auto px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition ${selected.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Add Selected to Cart
            </button>
          </div>
          {loading ? (
            <div className="wishlist-loading text-center py-4">Loading...</div>
          ) : error ? (
            <div className="wishlist-error text-center py-4 text-red-500">{error}</div>
          ) : wishlist.length === 0 ? (
            <div className="wishlist-empty text-center py-4 text-gray-500">Your wishlist is empty.</div>
          ) : (
            <div className="wishlist-list space-y-6">
              {wishlist.map((item) => {
                const itemId = item.product_id || item.id;
                return (
                  <div
                    key={itemId}
                    className="flex flex-col sm:flex-row justify-between items-start border border-gray-200 rounded-xl p-6 bg-white shadow-md hover:shadow-lg transition duration-200"
                  >
                    {/* LEFT: Checkbox & Image */}
                    <div className="flex flex-col items-center w-full sm:w-1/6 min-w-[110px] mb-4 sm:mb-0">
                      <input
                        type="checkbox"
                        checked={selected.includes(itemId)}
                        onChange={() => handleSelect(itemId)}
                        className="mb-2"
                      />
                      <img
                        src={item.image_url   || item.image || '/public/logo192.png'}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-md border border-gray-200"
                        onError={(e) => {
                          e.target.src = '/public/logo192.png';
                        }}
                      />
                    </div>
                    {/* // Name & Buttons // */}
                    <div className="flex flex-col justify-between w-full sm:w-2/5 min-w-[200px] mb-4 sm:mb-0">
                      <div className="text-xl font-semibold text-gray-800">{formatProductName(item.name)}</div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleRemoveFromWishlist(itemId)}
                          className="text-sm text-red-500 hover:text-red-600 transition"
                        >
                          Remove
                        </button>
                        <button
                          onClick={async () => {
                            const res = await addMultipleToCart([itemId]);
                            if (!res.ok) {
                              alert('Failed to add item to cart');
                            } else {
                              alert('Item added to cart!');
                            }
                          }}
                          className="text-sm text-green-600 hover:text-green-700 transition border border-green-600 rounded px-2 py-1"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                    {/* RIGHT: Competitor Prices */}
                    <div className="w-full sm:w-2/5 min-w-[220px] flex flex-col items-start sm:items-end">
                      <div className="text-gray-700 font-medium mb-3 text-left sm:text-right">Top 3 Competitor Prices</div>
                      {item.competitors && item.competitors.length > 0 ? (
                        <ul className="space-y-2 w-full">
                          {item.competitors.slice(0, 3).map((comp, idx) => (
                            <li
                              key={
                                [itemId, comp.product_url, comp.id, comp.retailer_name, idx].filter(Boolean).join('-')
                              }
                              className="flex justify-start sm:justify-end bg-gray-50 px-4 py-2 rounded-md"
                            >
                              <div className="flex gap-2">
                                <a
                                  href={comp.product_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {(comp.retailer_name || comp.retailer)}
                                </a>
                                <span className="text-gray-800 font-semibold">
                                  {typeof comp.price === 'number' && !isNaN(comp.price)
                                    ? `$${comp.price.toFixed(2)}`
                                    : parseFloat(comp.price) && !isNaN(parseFloat(comp.price))
                                    ? `$${parseFloat(comp.price).toFixed(2)}`
                                    : 'N/A'}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-gray-500">No competitor prices found.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Wishlist;
