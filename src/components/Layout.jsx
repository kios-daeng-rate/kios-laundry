import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getSettings } from '../services/api';

const pageTitles = {
    '/': 'Dashboard',
    '/new-order': 'Order Baru',
    '/orders': 'Daftar Pesanan',
    '/customers': 'Pelanggan',
    '/services': 'Layanan & Harga',
    '/reports': 'Laporan',
    '/settings': 'Pengaturan',
};

export default function Layout({ user, onLogout }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [settings, setSettings] = useState({});
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'Dashboard';

    const fetchSettings = async () => {
        try {
            const data = await getSettings();
            setSettings(data);
        } catch (err) {
            console.error("Failed to load settings in layout", err);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} storeName={settings.store_name} brandLogo={settings.brand_logo} />
            <div className="lg:ml-64 transition-all duration-300">
                <Header title={title} onMenuClick={() => setSidebarOpen(true)} user={user} onLogoutClick={() => setShowLogoutModal(true)} storeName={settings.store_name} />
                <main className="p-4 lg:p-8">
                    <Outlet context={{ settings, user, refreshSettings: fetchSettings }} />
                </main>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <LogOut className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Konfirmasi Keluar</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Apakah Anda yakin ingin keluar dari aplikasi? Anda harus login kembali untuk masuk.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    setShowLogoutModal(false);
                                    onLogout();
                                }}
                                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                            >
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
