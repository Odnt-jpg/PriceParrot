import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing/landing.jsx';
import Home from './pages/Home/home.jsx';
import ItemDisplay from './pages/item/itemdisplay.jsx';
import Search from './pages/Search/search.jsx';
import Wishlist from './pages/Wishlist/wishlist.jsx';
import Cart from './pages/Cart/cart.jsx';
import BestFit from './pages/BestFit/bestfit.jsx';
import StoreCard from './components/storecard/storecard';


function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route 
            path="/" 
            element={<Landing />} 
          />
          <Route 
            path="/home" 
            element={<Home />} 
          />
          <Route 
            path="/item/:id" 
            element={<ItemDisplay />} 
          />
          <Route 
            path="/search" 
            element={<Search />} 
          />
          <Route 
            path="/wishlist" 
            element={<Wishlist />} 
          />
          <Route 
            path="/cart" 
            element={<Cart />} 
          />
          <Route 
            path="/bestfit" 
            element={<BestFit />} 
          />
          <Route
            path="/storecard-test"
            element={
              <div className="p-8 bg-gray-100 min-h-screen flex justify-center items-center">
                <StoreCard
                  image="https://via.placeholder.com/150"
                  name="Test Store"
                  price={42.99}
                  id={1}
                />
              </div>
            }
          />
          {/* <Route path="/login" element={<Login />} /> */}
          {/* <Route path="/register" element={<Register />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;