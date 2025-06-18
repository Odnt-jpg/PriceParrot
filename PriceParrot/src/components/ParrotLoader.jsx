import React from 'react';
import ParrotPng from './Images/parrot.png';

const ParrotLoader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <img src={ParrotPng} alt="Loading Parrot" className="w-auto h-32 mb-2 select-none pointer-events-none" style={{ zIndex: 2 }} />
    <div className="animate-spin rounded-full h-auto w-auto border-t-4 border-b-4 border-primary border-opacity-30 mb-4"></div>
    <span className="mt-2 text-lg text-green-700 font-semibold">{text}</span>
  </div>
);

export default ParrotLoader;
