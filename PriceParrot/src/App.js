import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing/landing.jsx';
// import Login from './pages/Login/login';
// import Register from './pages/Register/register';
import Home from './pages/Home/home.jsx';
import ItemDisplay from './pages/item/itemdisplay.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/item/:id" element={<ItemDisplay/>} />
      </Routes>
    </Router>
  );
}

export default App;