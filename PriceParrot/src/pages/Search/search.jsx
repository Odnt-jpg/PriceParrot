import React, { useState, useEffect } from 'react';
import './search.css';
import ItemCard from '../../components/itemcard/itemcard.jsx';
import Navbar from '../../components/navbar/navbar.jsx';

const sortOptions = [
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name: A-Z', value: 'name_asc' },
  { label: 'Name: Z-A', value: 'name_desc' },
];

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [sort, setSort] = useState('price_asc');
  const [retailerLogos, setRetailerLogos] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      console.log('Search API response:', data); 
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setResults([]);
    }
    setLoading(false);
  };

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

  // Fetch retailer logos from the backend
  useEffect(() => {
    const fetchRetailers = async () => {
      try {
        const res = await fetch('/api/retailers');
        const data = await res.json();
        console.log('Retailers API response:', data); 
        setRetailerLogos(
          Array.isArray(data)
            ? data.map(r => ({ key: String(r.id), name: r.name, image: r.image }))
            : []
            
        );
      } catch (err) {
        setRetailerLogos([]);
      }
    };
    fetchRetailers();
  }, []);

  // Filtered and sorted results
  const filteredResults = results
    .filter(item => {
      if (!selectedRetailer) return true;
      // Assume item.retailer_key or item.retailer_name exists
      return (item.retailer_key || item.retailer_name || '').toLowerCase().includes(selectedRetailer);
    })
    .sort((a, b) => {
      if (sort === 'price_asc') return (a.price - b.price);
      if (sort === 'price_desc') return (b.price - a.price);
      if (sort === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sort === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      return 0;
    });

  return (
    <div className="search-page">
      <Navbar />
      <div className="flex">
        {/* Sidebar for sort options */}
        <aside className="w-64 bg-gray-50 border-r p-6 hidden md:block">
          <h2 className="font-bold mb-4 text-lg">Sort By</h2>
          <ul className="space-y-2">
            {sortOptions.map(opt => (
              <li key={opt.value}>
                <button
                  className={`w-full text-left px-3 py-2 rounded transition ${sort === opt.value ? 'bg-rose-100 text-rose-700 font-bold' : 'hover:bg-gray-100'}`}
                  onClick={() => setSort(opt.value)}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <div className="max-w-4xl mx-auto w-full">
            <h1 className="text-2xl font-bold my-6">Search Results</h1>
            {/* Retailer filter bar */}
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
              {retailerLogos.map(ret => (
                <button
                  key={ret.key}
                  className={`flex flex-col items-center px-3 py-2 rounded border transition ${selectedRetailer === ret.key ? 'bg-rose-100 border-rose-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => setSelectedRetailer(selectedRetailer === ret.key ? null : ret.key)}
                >
                  <img src={ret.img} alt={ret.name} className="h-10 w-10 object-contain mb-1" />
                  
                  <span className="text-xs font-medium">{ret.name}</span>
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="search-bar mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Search for products..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 px-4 py-2 border rounded"
              />
              <button type="submit" disabled={loading} className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700">Search</button>
            </form>
            <div className="search-results">
              {loading && <p>Loading...</p>}
              {!loading && searched && filteredResults.length === 0 && <p>No results found.</p>}
              <div className="search-results-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredResults.map(item => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    image={item.image_url}
                    name={item.name}
                    price={typeof item.price === 'number' ? item.price : Number(item.price)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
