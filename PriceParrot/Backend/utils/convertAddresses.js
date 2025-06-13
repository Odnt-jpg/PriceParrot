// utils/convertAddresses.js
// Utility functions for converting retailer addresses to latitude and longitude

const axios = require('axios');

/**
 * Converts a single address to latitude and longitude using a geocoding API.
 * @param {string} address - The address to geocode.
 * @returns {Promise<{latitude: number, longitude: number}|null>} The coordinates or null if not found.
 */
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  try {
    const response = await axios.get(url, { headers: { 'User-Agent': 'PriceParrotApp/1.0' } });
    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    }
    return null;
  } catch (err) {
    console.error('Geocoding error for address:', address, err.message);
    return null;
  }
}

/**
 * Converts an array of address strings to their latitude and longitude.
 * @param {string[]} addresses - Array of address strings.
 * @returns {Promise<Array<{address: string, latitude: number, longitude: number}>>}
 */
async function geocodeAddresses(addresses) {
  const results = [];
  for (const address of addresses) {
    const coords = await geocodeAddress(address);
    if (coords) {
      results.push({ address, ...coords });
    } else {
      results.push({ address, latitude: null, longitude: null });
    }
    await new Promise(r => setTimeout(r, 1100)); 
  }
  return results;
}

module.exports = {
  geocodeAddress,
  geocodeAddresses,
};
