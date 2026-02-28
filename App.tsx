
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import ImageStudio from './pages/ImageStudio';
import MarketPulse from './pages/MarketPulse';
import LiveAssistant from './components/LiveAssistant';
import ContentCMS from './pages/ContentCMS';
import GrowthHub from './pages/GrowthHub';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Valuation from './pages/Valuation';
import Login from './pages/Login';
import { LeadScanner } from './components/LeadScanner';
import { authStore } from './services/authService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authStore.isAuthenticated());

  useEffect(() => {
    return authStore.subscribe(() => {
      setIsAuthenticated(authStore.isAuthenticated());
    });
  }, []);

  return (
    <HashRouter>
      <Routes>
        {/* Offentlige ruter */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />

        {/* Beskyttede ruter */}
        <Route path="/*" element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pipeline" element={<Pipeline />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/valuation" element={<Valuation />} />
                <Route path="/market" element={<MarketPulse />} />
                <Route path="/growth" element={<GrowthHub />} />
                <Route path="/studio" element={<ImageStudio />} />
                <Route path="/content" element={<ContentCMS />} />
                <Route path="/assistant" element={<div className="w-full py-4 lg:py-8"><LiveAssistant /></div>} />
                <Route path="/scanner" element={
                  <div className="w-full p-6 lg:p-10 flex flex-col items-center justify-center min-h-[60vh] gap-6">
                    <div className="text-center mb-4">
                      <h2 className="text-2xl font-bold text-slate-100 mb-2">Lead Scanner</h2>
                      <p className="text-slate-400 text-sm">Ta bilde av et leadskjema eller visittkort for å lagre det automatisk.</p>
                    </div>
                    <LeadScanner />
                  </div>
                } />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;
