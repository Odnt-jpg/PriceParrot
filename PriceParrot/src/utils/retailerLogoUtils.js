// Utility to get retailer logo by id from a list of retailerLogos
export function getRetailerLogoById(retailerId, retailerLogos) {
  if (!retailerId || !Array.isArray(retailerLogos)) return '';
  const found = retailerLogos.find(r => String(r.key) === String(retailerId));
  return found ? found.image : '';
}
