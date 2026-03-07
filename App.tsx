
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LiveAssistant from './components/LiveAssistant';
import { authStore } from './services/authService';
import { settingsStore } from './services/settingsService';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const ImageStudio = lazy(() => import('./pages/ImageStudio'));
const MarketPulse = lazy(() => import('./pages/MarketPulse'));
const ContentCMS = lazy(() => import('./pages/ContentCMS'));
const GrowthHub = lazy(() => import('./pages/GrowthHub'));
const Settings = lazy(() => import('./pages/Settings'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Valuation = lazy(() => import('./pages/Valuation'));
const Login = lazy(() => import('./pages/Login'));
const CRM = lazy(() => import('./pages/CRM'));
const Calendar = lazy(() => import('./pages/Calendar'));
const MarketingTasks = lazy(() => import('./pages/MarketingTasks'));
const ScannerPage = lazy(() => import('./pages/ScannerPage'));
const Tomtebase = lazy(() => import('./pages/Tomtebase'));
const BusinessOverview = lazy(() => import('./pages/BusinessOverview'));

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authStore.isAuthenticated());

  useEffect(() => {
    if (authStore.isAuthenticated()) {
      settingsStore.loadApiKeysFromCloud().catch(console.error);
    }
    const unsubscribe = authStore.subscribe(() => {
      const auth = authStore.isAuthenticated();
      setIsAuthenticated(auth);
      if (auth) settingsStore.loadApiKeysFromCloud().catch(console.error);
    });
    return unsubscribe;
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<div>Loading...</div>}>
            {isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          </Suspense>
        } />

        <Route path="/*" element={
          isAuthenticated ? (
            <Layout>
              <Suspense fallback={<div className='flex-grow flex items-center justify-center'><div className='text-xl'>Loading...</div></div>}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/tomtebase" element={<Tomtebase />} />
                  <Route path="/valuation" element={<Valuation />} />
                  <Route path="/market" element={<MarketPulse />} />
                  <Route path="/growth" element={<GrowthHub />} />
                  <Route path="/studio" element={<ImageStudio />} />
                  <Route path="/content" element={<ContentCMS />} />
                  <Route path="/assistant" element={<div className="w-full py-4 lg:py-8"><LiveAssistant /></div>} />
                  <Route path="/scanner" element={<ScannerPage />} />
                  <Route path="/crm" element={<CRM />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/marketing-tasks" element={<MarketingTasks />} />
                  <Route path="/business" element={<BusinessOverview />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
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
