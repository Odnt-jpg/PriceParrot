import React from 'react';
import PropTypes from 'prop-types';


const StoreCard = ({ image, name, price, id, className = '', onClick, storeLocation, flavorText, distance }) => {
  console.log('StoreCard rendered with:', { image, name, price, id, className, storeLocation });
  return (
    <div
      className={
        `list-row w-full min-h-44 box-shadow-lg rounded-md bg-white p-4 gap-8 relative cursor-pointer hover:shadow-xlg transition ${className}`
      }
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') { onClick && onClick(); } }}
    >
      <div className="flex flex-row justify-between items-start w-full drop-shadow">
        <div className="flex flex-col items-start gap-2">
          <img className="w-20 h-auto rounded-box object-contain shadow-lg mb-1" src={image} alt={name} />
          <div className='font-ubuntu text-lg text-left'>{name}</div>
          {flavorText && (
            <div className="mt-1 text-xs font-bold text-rose-600 animate-pulse text-left">{flavorText}</div>
          )}
          {typeof distance === 'number' && (
            <div className="text-m text-gray-500 mt-1">Distance: {distance.toFixed(2)} km</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 ml-4">
          <span className="text-lg font-bold text-gray-900">${price?.toFixed(2)}</span>
          <a
            href={`/store/${id}`}
            className="text-m text-rose-500 hover:underline"
            onClick={e => e.stopPropagation()}
          >
            View Store →
          </a>
        </div>
      </div>
    </div>
  );
};

StoreCard.propTypes = {
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  className: PropTypes.string,
};

export default StoreCard;