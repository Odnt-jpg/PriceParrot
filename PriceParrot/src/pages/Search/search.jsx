import React, { useState, useEffect } from 'react';
import './search.css';
import ItemCard from '../../components/itemcard/itemcard.jsx';
import Navbar from '../../components/navbar/navbar.jsx';
import ParrotLoader from '../../components/ParrotLoader';
import { useLocation } from 'react-router-dom';
import Footer from '../../components/Footer';
import { getRetailerLogoById } from '../../utils/retailerLogoUtils';

const sortOptions = [
  { label: 'Trending', value: 'trending' },
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
  const [sort, setSort] = useState(''); // Default: no sort
  const [retailerLogos, setRetailerLogos] = useState([]);
  const location = useLocation();

  const handleSearch = async (e) => {
    console.log('handleSearch called by:', e?.nativeEvent?.submitter || 'form submit', 'with query:', query);
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      console.log('Calling fetch for /api/products/search?q=', query);
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      console.log('Search API response:', data); 
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Search API error:', err);
      setResults([]);
    }
    console.log('handleSearch finished, results:', results);
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
        console.log(data.name)
      } catch (err) {
        setRetailerLogos([]);
      }
    };
    fetchRetailers();
  }, []);

  // Set query from URL on mount or when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setQuery(q);
    if (q) {
      setSearched(false);
      setLoading(true);
      console.log('useEffect [location.search] calling fetch for q:', q);
      fetch(`/api/products/search?q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(data => {
          console.log('useEffect [location.search] search response:', data);
          setResults(Array.isArray(data) ? data : []);
          setSearched(true);
        })
        .catch((err) => {
          console.log('useEffect [location.search] search error:', err);
          setResults([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [location.search]);

  // Compile unique retailers from results for filter, with image mapping
  const uniqueRetailers = React.useMemo(() => {
    const seen = new Set();
    const imageMap = {};
    retailerLogos.forEach(r => {
      imageMap[String(r.key)] = r.image;
    });
    return results.reduce((arr, item) => {
      if (item.retailer_id && item.retailer_name && !seen.has(item.retailer_id)) {
        arr.push({
          id: String(item.retailer_id),
          name: item.retailer_name,
          image: imageMap[String(item.retailer_id)] || ''
        });
        seen.add(item.retailer_id);
      }
      return arr;
    }, []);
  }, [results, retailerLogos]);

  // Filtered and sorted results, with deduplication by product id
  const filteredResults = Array.from(
    new Map(
      results
        .filter(item => {
          if (!selectedRetailer) return true;
          return String(item.retailer_id) === selectedRetailer;
        })
        .map(item => [item.id, item]) // Map by unique product id
    ).values()
  ).sort((a, b) => {
    if (!sort) return 0;
    if (sort === 'trending') return (b.view_count || 0) - (a.view_count || 0);
    if (sort === 'price_asc') return (a.price - b.price);
    if (sort === 'price_desc') return (b.price - a.price);
    if (sort === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (sort === 'name_desc') return (b.name || '').localeCompare(a.name || '');
    return 0;
  });

  // Log each product and its retailer_name
  useEffect(() => {
      console.log('Selected retailer:', selectedRetailer);
    filteredResults.forEach((item, idx) => {
      console.log(`Product #${idx + 1}:`, item, 'retailer_name:', item.retailer_name);
    });
  }, [filteredResults, selectedRetailer]);

  const handleSort = (value) => {
    setSort(prev => (prev === value ? '' : value));
  };

  return (
    <>
      <Navbar />
    <div className="min-h-screen padding-top-16 md:padding-top-20 relative">
      <div className="flex">
        {/* Sidebar for sort options */}
        <aside className="w-64 bg-gray-50 p-6  absolute-left md:block h-full">
          <h2 className="font-bold mb-4 text-lg text-neutral">Sort By</h2>
          <ul className="space-y-2">
            {sortOptions.map(opt => (
              <li key={opt.value}>
                <button
                  className={`w-full text-left px-3 py-2 text-rose-600 rounded transition ${sort === opt.value ? 'bg-rose-100 text-rose-700 font-bold' : 'hover:bg-gray-100'}`}
                  onClick={() => handleSort(opt.value)}
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
            <div className="flex gap-10 mb-6 overflow-x-auto pb-2">
              {uniqueRetailers.map(ret => (
                <button
                  key={ret.id}
                  className={`flex flex-col items-center px-4 py-4 rounded border transition ${selectedRetailer === ret.id ? 'bg-rose-100 border-rose-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                  style={{ width: '110px', minWidth: '110px', height: '120px', minHeight: '120px', justifyContent: 'center' }}
                  onClick={() => setSelectedRetailer(selectedRetailer === ret.id ? null : ret.id)}
                >
                  <img src={ret.image || 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg'} alt={ret.name} className="h-16 w-16 object-contain mb-2" style={{ minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px' }} />
                  <span className="text-xs font-medium text-neutral text-center break-words">{ret.name}</span>
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
              {loading && <ParrotLoader text="Searching for products..." />}
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
      
       <Footer />
    </>
  );
};

export default Search;
