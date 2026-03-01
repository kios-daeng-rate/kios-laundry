import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import GlobalAlertModal from './components/GlobalAlertModal';
import { getSettings } from './services/api';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewOrder = lazy(() => import('./pages/NewOrder'));
const Orders = lazy(() => import('./pages/Orders'));
const Customers = lazy(() => import('./pages/Customers'));
const Services = lazy(() => import('./pages/Services'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const PublicStatus = lazy(() => import('./pages/PublicStatus'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
  </div>
);

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('pos_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [settings, setSettings] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const data = await getSettings();
        setSettings(data);

        // Update title
        if (data.store_name) {
          document.title = data.store_name;
        }

        // Update favicon
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }

        if (data.brand_logo) {
          link.href = data.brand_logo;
        } else {
          // Default icon (Droplets SVG)
          link.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M7 16.3c2.2 0 4-1.8 4-4 0-3.3-4-6-4-6s-4 2.7-4 6c0 2.2 1.8 4 4 4Z'/%3E%3Cpath d='M17 22c2.2 0 4-1.8 4-4 0-3.3-4-6-4-6s-4 2.7-4 6c0 2.2 1.8 4 4 4Z'/%3E%3C/svg%3E";
        }
      } catch (err) {
        console.error("Failed to load settings in App", err);
      }
    };
    fetchBrand();
  }, []);

  const handleLogin = (userData) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setUser(userData);
      localStorage.setItem('pos_user', JSON.stringify(userData));
      setIsTransitioning(false);
    }, 300); // 300ms matches Tailwind's duration-300
  };

  const handleLogout = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem('pos_user');
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <>
      <GlobalAlertModal />
      <Router>
        <div className={`transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'} min-h-screen bg-slate-50 print:min-h-0 print:bg-white`}>
          <Routes>
            <Route path="/order-status/:orderId" element={<Suspense fallback={<PageLoader />}><PublicStatus /></Suspense>} />
            {!user ? (
              <Route path="*" element={<Login onLogin={handleLogin} settings={settings} />} />
            ) : (
              <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
                <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                <Route path="new-order" element={<Suspense fallback={<PageLoader />}><NewOrder /></Suspense>} />
                <Route path="orders" element={<Suspense fallback={<PageLoader />}><Orders /></Suspense>} />
                <Route path="customers" element={<Suspense fallback={<PageLoader />}><Customers /></Suspense>} />
                <Route path="services" element={<Suspense fallback={<PageLoader />}><Services /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
                <Route path="*" element={<Navigate to={user.role === 'admin' ? '/' : '/new-order'} replace />} />
              </Route>
            )}
          </Routes>
        </div>
      </Router>
    </>
  );
}
