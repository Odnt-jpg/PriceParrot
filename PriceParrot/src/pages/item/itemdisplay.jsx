import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
            <button
                onClick={() => navigate(-1)}
                className="back-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Back
            </button>
            <div className="item-details-container bg-white shadow rounded p-6">
                <img
                    src={item.image_url}
                    alt={item.name}
                    className="item-image w-full max-w-md mx-auto mb-4"
                />
                <h1 className="item-name text-3xl font-bold mb-2">{item.name}</h1>
                <p className="item-price text-xl text-gray-700 mb-4">${item.price.toFixed(2)}</p>
                <p className="item-description text-gray-600">{item.description || 'No description available.'}</p>
            </div>
        </div>
    );
};

export default ItemDisplay;
