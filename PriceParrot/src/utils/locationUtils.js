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

// Haversine formula for distance in km
export function haversine(lat1, lon1, lat2, lon2) {
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

// Given user location and an array of addresses, return {minDist, closestBranch}
export function getClosestBranchDistance(userLat, userLng, addresses) {
  let minDist = null;
  let closestBranch = null;
  if (Array.isArray(addresses)) {
    addresses.forEach(addr => {
      if (addr.latitude && addr.longitude) {
        const dist = haversine(userLat, userLng, addr.latitude, addr.longitude);
        if (minDist === null || dist < minDist) {
          minDist = dist;
          closestBranch = addr;
        }
      }
    });
  }
  return { minDist, closestBranch };
}
