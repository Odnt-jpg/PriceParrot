import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const ItemCard = ({ image, name, price, id, className = '', onClick }) => {
  const navigate = useNavigate();
  const handleClick = (e) => {
    if (onClick) onClick();
    navigate(`/item/${id}`);
  };
  return (
    <div
      className={`flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 ${className}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="aspect-w-1 aspect-h-1 bg-gray-200 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          <span className="hover:text-gray-600 hover:underline">
            {name}
          </span>
        </h3>
        <p className="mt-auto text-sm font-medium text-gray-900">
          {console.log("This is ",price)}
          {typeof price === 'number' && !isNaN(price) ? `$${price.toFixed(2)}` : 'Price unavailable'}
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
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default ItemCard;