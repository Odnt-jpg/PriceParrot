// src/utils/locationUtils.js

/**
 * @param {string} key
 * @param {object} location - { lat, lng }
 */
export function saveLocationToSession(key, location) {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') return;
  sessionStorage.setItem(key, JSON.stringify(location));
}

/**
 * Retrieve a location object from sessionStorage by key.
 * @param {string} key
 * @returns {object|null} - { lat, lng } or null
 */
export function getLocationFromSession(key) {
  const val = sessionStorage.getItem(key);
  if (!val) return null;
  try {
    const obj = JSON.parse(val);
    if (typeof obj.lat === 'number' && typeof obj.lng === 'number') return obj;
    return null;
  } catch {
    return null;
  }
}
