import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar.jsx';
import Carousel from '../../components/carousel/Carousel.jsx';
import ItemCard from '../../components/itemcard/itemcard.jsx';

function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch('/api/products/featured');
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const data = await response.json();
                console.log(data);
                setItems(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Hero Section */}
                <section className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to PriceParrot</h1>
                    <p className="text-xl text-gray-600 mb-8">Your one-stop solution for price comparison.</p>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto flex shadow-md rounded-lg overflow-hidden bg-white p-6 ">
                        <input
                            type="text"
                            placeholder="Search for products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-grow px-4 py-3 focus:outline-none p-5"
                        />
                        <button 
                            onClick={handleSearch} 
                            className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 transition-colors duration-200"
                        >
                            Search
                        </button>
                    </div>
                </section>

                {/* Featured Products */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Featured Products</h2>
                    {error ? (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                            <p>Error: {error}</p>
                        </div>
                    ) : items.length > 0 ? (
                        <Carousel
                            items={items}
                            itemsPerView={4}
                            renderItem={item => (
                                <ItemCard
                                    key={item.id}
                                    id={item.id}
                                    image={item.image_url}
                                    name={item.name}
                                    price={item.price ?? 0}
                                />
                            )}
                        />
                    ) : (
                        <div className="text-center text-gray-500 py-8">No featured products available</div>
                    )}
                </section>

                {/* Recently Viewed Products */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Recently Viewed Products</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-medium text-gray-800">Product A</h3>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-medium text-gray-800">Product B</h3>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-medium text-gray-800">Product C</h3>
                        </div>
                    </div>
                </section>

                {/* Trending Products */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Trending Products</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-medium text-gray-800">Trending 1</h3>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-medium text-gray-800">Trending 2</h3>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-medium text-gray-800">Trending 3</h3>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="mb-4 md:mb-0">&copy; 2025 PriceParrot. All rights reserved.</p>
                        <ul className="flex space-x-6">
                            <li><a href="/about" className="hover:text-blue-300 transition-colors">About Us</a></li>
                            <li><a href="/contact" className="hover:text-blue-300 transition-colors">Contact</a></li>
                            <li><a href="/privacy" className="hover:text-blue-300 transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;