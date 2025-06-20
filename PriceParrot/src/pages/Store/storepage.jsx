import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import Navbar from '../../components/navbar/navbar.jsx';

// Icon for Users
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;


// Separte Icon for Stores
const StoreIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});




const StoreMap = ({ userLocation, storeLocations, retailer, selectedAddressIdx, setSelectedAddressIdx, panTo }) => {
  const mapRef = useRef();
  let center = [18.0123, -76.789];
  if (userLocation && Array.isArray(storeLocations) && storeLocations.length > 0) {
    center = [
      (userLocation.lat + storeLocations[0].latitude) / 2,
      (userLocation.lng + storeLocations[0].longitude) / 2
    ];
  } else if (userLocation) {
    center = [userLocation.lat, userLocation.lng];
  } else if (Array.isArray(storeLocations) && storeLocations.length > 0) {
    center = [storeLocations[0].latitude, storeLocations[0].longitude];
  }

  useEffect(() => {
    if (
      typeof selectedAddressIdx === 'number' &&
      mapRef.current &&
      Array.isArray(storeLocations) &&
      storeLocations[selectedAddressIdx]
    ) {
      const { latitude, longitude } = storeLocations[selectedAddressIdx];
      mapRef.current.setView([latitude, longitude], 16, { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressIdx]);

  return (
    <div className="w-full h-64 mb-4 rounded overflow-hidden">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} whenCreated={mapInstance => (mapRef.current = mapInstance)}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
        {Array.isArray(storeLocations) && storeLocations.map((addr, idx) =>
          addr.latitude && addr.longitude ? (
            <Marker key={idx} position={[addr.latitude, addr.longitude]} icon={StoreIcon}>
              <Popup>
                <div>
                  <div><b>{addr.branch_name || retailer.name}</b></div>
                  <div>{addr.address}</div>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
};

const StorePage = () => {
  const { id } = useParams();
  const [retailer, setRetailer] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(null);
  const [retailerLogo, setRetailerLogo] = useState('');

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null)
      );
    }
    const fetchStore = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/retailer/${id}`);
        if (!res.ok) throw new Error('Failed to fetch store details');
        const data = await res.json();
        console.log("Store details:", data);
        setRetailer(data);
        // No logo fetch, use retailer.url_image directly
        setRetailerLogo(data.url_image || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  return (
    <>
    <Navbar />
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex justify-center items-center h-64 text-lg text-gray-500 animate-pulse">Loading store details...</div>
      ) : error ? (
        <div className="text-red-500 text-center font-semibold py-4">{error}</div>
      ) : retailer ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            <img src={retailer.image||retailerLogo || retailer.url_image || 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg'} alt={retailer.name} className="w-40 h-40 object-cover rounded-xl border border-gray-200 shadow-sm bg-gray-100" />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2 text-gray-800">{retailer.name}</h1>
              <div className="mb-2 text-gray-600"><b>Phone:</b> {retailer.phone_number || <span className='italic text-gray-400'>N/A</span>}</div>
              <div className="mb-2 text-gray-600"><b>Hours:</b> {retailer.opening_hours || <span className='italic text-gray-400'>N/A</span>}</div>
            </div>
          </div>
          {/* Address Buttons */}
          {Array.isArray(retailer.addresses) && retailer.addresses.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2 justify-center md:justify-start">
              {retailer.addresses.map((addr, idx) => (
                <button
                  key={idx}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-rose-400 ${selectedAddressIdx === idx ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                  onClick={() => setSelectedAddressIdx(idx)}
                >
                  {addr.branch_name ? `${addr.branch_name} - ` : ''}{typeof addr === 'string' ? addr : addr.address}
                </button>
              ))}
            </div>
          )}
          <StoreMap
            userLocation={userLocation}
            storeLocations={Array.isArray(retailer.addresses) ? retailer.addresses : []}
            retailer={retailer}
            selectedAddressIdx={selectedAddressIdx}
            setSelectedAddressIdx={setSelectedAddressIdx}
          />
          <div className="mb-4">
            <b className="text-gray-700">Addresses:</b>
            {Array.isArray(retailer.addresses) ? (
              <ul className="list-disc ml-8 mt-2 text-gray-700">
                {retailer.addresses.map((addr, idx) => (
                  <li key={idx} className="mb-1">
                    {typeof addr === 'string' ? addr : addr.address}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500"> {retailer.addresses}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">Store not found.</div>
      )}
    </div>
    </>
  );
};

export default StorePage;
