import React from 'react';
import PropTypes from 'prop-types';
import './itemcard.css'; 
import { Link } from 'react-router-dom'; 


const ItemCard = ({ image, name, price, id }) => {
    return (
        <div className="item-card">
            <img src={image} alt={name} className="item-card-image" />
            <div className="item-card-details">
                <h3 className="item-card-name">
                    <Link to={`/item/${id}`} className="item-link">
                        {name}
                    </Link>
                </h3>
                <p className="item-card-price">${price}</p>
            </div>
        </div>
    );
};

ItemCard.propTypes = {
    image: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    id: PropTypes.number.isRequired, 
};

export default ItemCard;
