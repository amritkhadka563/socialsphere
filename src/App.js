// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login.jsx';
import Signup from './components/Signup.jsx';
import Dashboard from './components/Dashboard.jsx';
import CreateCampaign from './components/CreateCampaign.jsx';
// import other pages/components as needed

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateCampaign />} />
        {/* Add more routes below as needed, e.g., homepage, dashboard */}
        {/* <Route path="/home" element={<Home />} /> */}
      </Routes>
    </Router>
  );
};

export default App;
