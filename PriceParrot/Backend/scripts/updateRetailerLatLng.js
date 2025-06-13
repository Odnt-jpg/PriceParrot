// scripts/updateRetailerLatLng.js
// Script to update all retailer addresses in the DB with latitude and longitude

const db = require('../db');
const { geocodeAddress } = require('../utils/convertAddresses');

async function updateRetailerAddresses() {
  try {
    const [addresses] = await db.query('SELECT id, address FROM retailer_addresses WHERE latitude IS NULL OR longitude IS NULL');
    console.log(`Found ${addresses.length} addresses to update.`);
    for (const addr of addresses) {
      if(addr = 'Online Only') continue; // Skip 'Online Only' addresses
      if (!addr.address) continue;
      console.log(`Geocoding: ${addr.address}`);
      const coords = await geocodeAddress(addr.address);
      if (coords) {
        await db.query('UPDATE retailer_addresses SET latitude = ?, longitude = ? WHERE id = ?', [coords.latitude, coords.longitude, addr.id]);
        console.log(`Updated: ${addr.address} => (${coords.latitude}, ${coords.longitude})`);
      } else {
        console.log(`Could not geocode: ${addr.address}`);
      }
      await new Promise(r => setTimeout(r, 1100));
    }
    console.log('Done updating retailer addresses.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating retailer addresses:', err);
    process.exit(1);
  }
}

updateRetailerAddresses();
