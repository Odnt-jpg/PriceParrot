import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { formatProductName } from '../../utils/formatter';

const ItemCard = ({ image, name, price, id, className = '', onClick }) => {
  const navigate = useNavigate();
  const handleClick = (e) => {
    if (onClick) onClick();
    navigate(`/item/${id}`);
  };
  return (
    <div
      className={`flex flex-col bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-300 transform hover:scale-105 w-56 ${className}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="aspect-w-1 aspect-h-1 bg-gray-200 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-32 h-32 object-cover mx-auto my-2 rounded"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          <span className="hover:text-gray-600 hover:underline">
            {formatProductName(name)}
          </span>
        </h3>
        <p className="mt-auto text-sm font-bold text-gray-900">
          {console.log(name, ": ", price)}
          {typeof price === 'number' && !isNaN(price) ? <b>${`${price.toFixed(2)}`}</b> : 'Price unavailable'}
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