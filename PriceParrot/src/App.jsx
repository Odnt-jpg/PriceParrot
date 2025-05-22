import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing/landing.jsx';
import Home from './pages/Home/home.jsx';
import ItemDisplay from './pages/item/itemdisplay.jsx';

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
          {/* Uncomment when ready */}
          {/* <Route path="/login" element={<Login />} /> */}
          {/* <Route path="/register" element={<Register />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;