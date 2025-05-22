import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ItemCard = ({ image, name, price, id }) => {
    return (
        <div className="w-full max-w-xs bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <img 
                src={image} 
                alt={name} 
                className="w-full h-48 object-cover"
            />
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    <Link 
                        to={`/item/${id}`} 
                        className="hover:text-blue-600 transition-colors duration-200"
                    >
                        {name}
                    </Link>
                </h3>
                <p className="text-gray-600 font-medium">
                    {price !== undefined && price !== null ? `$${price.toFixed(2)}` : 'Price unavailable'}
                </p>
            </div>
        </div>
    );
};

ItemCard.propTypes = {
    image: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default ItemCard;