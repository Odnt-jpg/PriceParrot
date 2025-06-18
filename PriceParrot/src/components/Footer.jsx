import React from 'react';

const Footer = () => (
  <footer className="bg-gray-800 text-white py-8">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <p className="mb-4 md:mb-0">&copy; 2025 PriceParrot. All rights reserved.</p>
        <ul className="flex space-x-6">
          <li><a href="/about" className="hover:text-blue-300 transition-colors">About Us</a></li>
          <li><a href="/contact" className="hover:text-blue-300 transition-colors">Contact</a></li>
          <li><a href="/privacy" className="hover:text-blue-300 transition-colors">Privacy Policy</a></li>
        </ul>
      </div>
    </div>
  </footer>
);

export default Footer;
