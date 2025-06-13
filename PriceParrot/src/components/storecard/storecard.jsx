import React from 'react';
import PropTypes from 'prop-types';


const StoreCard = ({ image, name, price, id, className = '', onClick, storeLocation }) => {
  console.log('StoreCard rendered with:', { image, name, price, id, className, storeLocation });
  return (
    <div
      className={
        `list-row w-full h-30 box-shadow rounded-md bg-white p-3 gap-8 relative cursor-pointer hover:shadow-lg transition ${className}`
      }
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') { onClick && onClick(); } }}
    >
      <div className="flex flex-col gap-2">
        <img className="size-10 rounded-box" src={image} alt={name} />
        <div>
          <div className='font-ubuntu text-lg'>{name}</div>
        </div>
      </div>
      <p className="list-col-wrap text-xs "></p>
      <div className="flex flex-col gap-3">
        <a
          href={`/store/${id}`}
          className="btn btn-square btn-ghost absolute bottom-3 right-3 flex flex-col items-center gap-2 text-m text-rose-500 hover:underline"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-lg font-bold text-gray-900">${price?.toFixed(2)}</span>
          <span>View Store →</span>
        </a>
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