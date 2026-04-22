import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Studio from './pages/Studio';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-500 selection:text-white">
        <Routes>
          <Route path="/" element={<Studio />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
