import React, { useEffect } from 'react';
import './bestfit.css';

const BestFit = () => {


  useEffect(() => {
    const sessionTimeout = 60 * 60 * 1000; 
    const user = localStorage.getItem('user');
    const loginTime = localStorage.getItem('loginTime');
    if (user && loginTime) {
      const now = Date.now();
      if (now - Number(loginTime) > sessionTimeout) {
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        window.location.href = '/';
      }
    }
    const interval = setInterval(() => {
      const user = localStorage.getItem('user');
      const loginTime = localStorage.getItem('loginTime');
      if (user && loginTime && Date.now() - Number(loginTime) > sessionTimeout) {
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        window.location.href = '/';
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const userObj = JSON.parse(localStorage.getItem('user'));
    if (userObj && userObj.id) {
      console.log('BestFit: Logged in as', userObj.email || userObj.first_name || userObj.id, userObj);
    } else {
      console.log('BestFit: Not logged in');
    }
  }, []);

  return (
    <div className="bestfit-page">
      <h1>Best Store Fit</h1>
      <div className="map-container">
        {/* Map will be placed here if i have time */}
      </div>
      <div className="retailer-info">
        {/* Retailer info will go here */}
      </div>
    </div>
  );
};

export default BestFit;
