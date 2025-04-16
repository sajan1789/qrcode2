import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
// import Menu from './components/Menu';
import QRCodeComponent from './components/Qr_code';
import Menu from './components/Menu';


const App = () => {
  return (
    <Router>
            <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/qr-code" element={<QRCodeComponent />} />
      </Routes>
    </Router>
  );
};

export default App;
