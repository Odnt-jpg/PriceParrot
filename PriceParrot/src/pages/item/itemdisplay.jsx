import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/navbar';
import '../../App.css';
import '../../index.css';
// import './itemdisplay.css';

const ItemDisplay = () => {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchItemDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch(`/api/products/${id}`); // Replace with your API endpoint
                if (!response.ok) {
                    throw new Error('Failed to fetch item details');
                }
                const data = await response.json();
                setItem(data);
                console.log("Fetched item:", data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItemDetails();
    }, [id]);

    if (isLoading) {
        return <div className="loading">Loading item details...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    if (!item) {
        return <div className="error-message">Item not found</div>;
    }

    return (
        <div className="item-display-page">
            <Navbar/>
            <button
                onClick={() => navigate(-1)}
                className="back-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Back
            </button>
            <div className="item-details-container bg-white shadow rounded p-6 flex flex-col md:flex-row gap-8">
                {/* Left Side: Image and Name */}
                <div className="flex-1 flex flex-col items-center mb-6 md:mb-0">
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="item-image w-full max-w-md mx-auto mb-4"
                    />
                    <h1 className="item-name text-3xl font-bold mb-2 text-center">{item.name}</h1>
                </div>
                
                {/* Right Side: Retailer Prices - now aligned to the right */}
                <div className="flex-1 flex flex-col items-end">
                    {Array.isArray(item.prices) && item.prices.length > 0 ? (
                        <div className="item-prices mb-4 w-full max-w-md">
                            <h2 className="text-lg font-semibold mb-2 text-right">Prices from Retailers:</h2>
                            <ul className="w-full">
                                {item.prices.map((p, idx) => (
                                    <li key={idx} className="text-xl text-gray-700 mb-1 flex justify-between">
                                        <span>{p.retailer_id ? `Retailer ${p.retailer_id}` : 'Retailer'}</span>
                                        <span>${typeof p.price === 'number' ? p.price.toFixed(2) : p.price}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="item-price text-xl text-gray-700 mb-4 text-right">
                            {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : 'Price unavailable'}
                        </p>
                    )}
                </div>
            </div>
            {/* Comments at the bottom */}
            <div className="item-comments mt-8">
                <h2 className="text-lg font-semibold mb-2">Comments</h2>
                <p className="item-description text-gray-600 text-center">{item.description || 'No description available.'}</p>
            </div>
        </div>
    );
};

export default ItemDisplay;