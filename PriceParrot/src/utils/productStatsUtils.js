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
    localStorage.setItem('recentlyViewed', JSON.stringify(viewed));

    // Increment view count in backend
    if (product && product.id) {
        console.log('Incrementing view count for product:', product.id)
        fetch(`/api/products/view/${product.id}`, {
            method: 'POST',
            
        }).catch((err) => {
            // Optionally log error, but don't block UI
            console.error('Failed to increment product view count:', err);
        });
    }
    return viewed;
}
