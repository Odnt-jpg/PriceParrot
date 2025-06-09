/**
 * Aggregates cart prices by retailer, prioritizing stores with the most items in the cart and better prices.
 * @param {Array} cart - Array of cart items, each with a competitors array.
 * @returns {Array} - Array of { name, total, count } sorted by count (desc), then total (asc).
 */
export function aggregateCartByStore(cart) {
  if (!Array.isArray(cart) || cart.length === 0) return [];

  const storeStats = {};

  cart.forEach(item => {
    (item.competitors || []).forEach(offer => {
      const retailer = offer.retailer_name || offer.retailer;
      const price = typeof offer.price === 'number' ? offer.price : parseFloat(offer.price);
      if (!retailer || isNaN(price)) return;
      if (!storeStats[retailer]) storeStats[retailer] = { total: 0, count: 0 };
      storeStats[retailer].total += price;
      storeStats[retailer].count += 1;
    });
  });

  return Object.entries(storeStats)
    .map(([name, { total, count }]) => ({ name, total, count }))
    .sort((a, b) => b.count - a.count || a.total - b.total);
}
