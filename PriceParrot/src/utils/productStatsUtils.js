// Utility for product stats

export function loadRecentlyViewed() {
    const stored = localStorage.getItem('recentlyViewed');
    return stored ? JSON.parse(stored) : [];
}

export function addToRecentlyViewed(product) {
    let viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    viewed = viewed.filter(p => p.id !== product.id);
    viewed.unshift(product);
    if (viewed.length > 8) viewed = viewed.slice(0, 8);
    console.log (viewed);
    localStorage.setItem('recentlyViewed', JSON.stringify(viewed));
    return viewed;
}
