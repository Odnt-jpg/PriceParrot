// Fetches the retailer logo URL from the backend for a given retailer ID
export async function getRetailerLogoById(retailerId) {
  if (!retailerId) return '';
  try {
    const res = await fetch(`/api/retailers/logo/${retailerId}`);
    if (!res.ok) return '';
    const data = await res.json();
    // Expecting { image: 'url' } or similar
    console.log("hellp",data.logo_url);
    return data.logo_url || '';
  } catch (err) {
    console.error('getRetailerLogoById error:', err);
    return '';
  }
}
