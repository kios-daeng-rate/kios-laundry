import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {
    LayoutDashboard,
    ShoppingCart,
    ClipboardList,
    Users,
    Shirt,
    BarChart3,
    Settings,
    Droplets,
    X,
} from 'lucide-react';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'demo'] },
    { path: '/new-order', label: 'Order Baru', icon: ShoppingCart, roles: ['admin', 'karyawan', 'demo'] },
    { path: '/orders', label: 'Pesanan', icon: ClipboardList, roles: ['admin', 'karyawan', 'demo'] },
    { path: '/customers', label: 'Pelanggan', icon: Users, roles: ['admin', 'karyawan', 'demo'] },
    { path: '/services', label: 'Layanan', icon: Shirt, roles: ['admin', 'demo'] },
    { path: '/reports', label: 'Laporan', icon: BarChart3, roles: ['admin', 'demo'] },
    { path: '/settings', label: 'Pengaturan', icon: Settings, roles: ['admin', 'demo'] },
];

export default function Sidebar({ isOpen, onClose, user, storeName, brandLogo }) {
    const location = useLocation();

    // Filter nav items based on user role
    const allowedNavItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role));

    // Handle body scroll locking when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto'; // Or '' 
        }

        // Cleanup function in case component unmounts while open
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-950 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header Logo */}
                    <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center shadow-lg overflow-hidden">
                            {brandLogo ? (
                                <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Droplets className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight">{storeName || 'FreshClean'}</h1>
                            <p className="text-xs text-primary-300 leading-none">Laundry POS</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                        {allowedNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                        ? 'bg-primary-700 text-white shadow-lg shadow-primary-700/30'
                                        : 'text-primary-200 hover:bg-primary-900 hover:text-white'
                                        }`}
                                >
                                    <Icon
                                        className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-accent-400' : ''
                                            }`}
                                    />
                                    {item.label}
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Bottom User Area */}
                    <div className="p-4 border-t border-white/10 shrink-0 bg-primary-950 mt-auto pb-8 lg:pb-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-sm font-bold shrink-0">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-primary-300 capitalize">{user?.role || 'Guest'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
