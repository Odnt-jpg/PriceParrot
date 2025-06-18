// Reusable search utility for Home and other pages
export async function fetchProductSearch(query) {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('fetchProductSearch error:', err);
    return [];
  }
}

// Handles navigation for search (for use with useNavigate)
export function handleSearchNavigate(query, navigate) {
  if (query.trim()) {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }
}
