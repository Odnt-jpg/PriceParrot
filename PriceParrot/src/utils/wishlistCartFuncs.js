// src/utils/wishlistCartService.js

const getToken = () => localStorage.getItem('token');

// Wishlist functions
export const fetchWishlist = async (userId) => {
  const token = getToken();
  const res = await fetch(`/api/users/wishlist/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch wishlist');
  return await res.json();
};

export const addToWishlist = async (productId) => {
  const token = getToken();
  const user = JSON.parse(localStorage.getItem('user'));
  const res = await fetch(`/api/users/wishlist/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ product_id: productId })
  });
  return res;
};

export const removeFromWishlist = async (productId) => {
  const token = getToken();
  const res = await fetch('/api/users/wishlist/remove', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ product_id: productId })
  });
  return res;
};

// Cart functions
export const addToCart = async (productId) => {
  const token = getToken();
  const res = await fetch('/api/users/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ product_id: productId })
  });
  return res;
};

export const addMultipleToCart = async (productIds) => {
  const token = getToken();
  const res = await fetch('/api/users/cart/add-multiple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ product_ids: productIds })
  });
  return res;
};

export const fetchCart = async (userId) => {
  const token = getToken();
  const res = await fetch(`/api/users/cart`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch wishlist');
  return await res.json();
};
