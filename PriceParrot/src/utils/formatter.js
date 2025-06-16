export function formatProductName(name) {
  if (!name) return '';
  
  // Convert to lowercase and capitalize first letter of each word
  let formatted = name.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Handle weight/quantity formatting (e.g., "22 Lbs" → "22lbs")
  formatted = formatted.replace(/(\d+)\s(lbs?|kg|g|oz|ml|l)\b/gi, '$1$2');

  // Remove extra spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();

  // Special case handling for common terms
  formatted = formatted
    .replace(/\bBdf\b/gi, 'Best Dressed')
    .replace(/\bFrozen\b/gi, '')
    .replace(/\bChilled\b/gi, '')
    .replace(/\bTray Pack\b/gi, '');

  return formatted;
}

// Deduplicate products and aggregate their prices, always showing the cheapest price
export function deduplicateAndAggregatePrices(products) {
    const map = new Map();
    for (const item of products) {
        const id = item.id;
        if (!map.has(id)) {
            map.set(id, {
                ...item,
                prices: item.prices ? [...item.prices] : [{ price: item.price, retailer: item.retailer }].filter(p => p.price !== undefined),
            });
        } else {
            const existing = map.get(id);
            if (item.prices && Array.isArray(item.prices)) {
                existing.prices.push(...item.prices);
            } else if (item.price !== undefined) {
                existing.prices.push({ price: item.price, retailer: item.retailer });
            }
        }
    }
    return Array.from(map.values()).map(item => {
        const priceArr = (item.prices || []).map(p => p.price).filter(p => typeof p === 'number');
        return {
            ...item,
            price: priceArr.length > 0 ? Math.min(...priceArr) : item.price,
        };
    });
}