import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, X, ShoppingBag, AlertCircle, CheckCircle, Clock, LogOut, Users } from 'lucide-react';
import { getOrders, getCustomers } from '../services/api';

const getRelativeTime = (dateString) => {
    const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (diff < 1) return 'Baru saja';
    if (diff < 60) return `${diff} menit lalu`;
    if (diff < 1440) return `${Math.floor(diff / 60)} jam lalu`;
    return `${Math.floor(diff / 1440)} hari lalu`;
};

export default function Header({ title, onMenuClick, user, onLogoutClick }) {
    const [showNotif, setShowNotif] = useState(false);
    const [notifList, setNotifList] = useState([]);
    const notifRef = useRef(null);

    const unreadCount = notifList.filter(n => !n.read).length;

    // Close on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotif(false);
            }
        };
        if (showNotif) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showNotif]);

    // Fetch notifications
    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const [ordersData, customersData] = await Promise.all([getOrders(), getCustomers()]);
                let newNotifs = [];

                const newOrders = ordersData.filter(o => o.status === 'Baru').slice(0, 5);
                newOrders.forEach(o => {
                    newNotifs.push({
                        id: `order-${o.id}`, type: 'order', icon: ShoppingBag, color: 'text-blue-500 bg-blue-50',
                        title: 'Order baru', desc: `${o.customer_name} - ${o.service_name}`, time: getRelativeTime(o.created_at), timestamp: new Date(o.created_at).getTime()
                    });
                });

                const doneOrders = ordersData.filter(o => o.status === 'Selesai').slice(0, 5);
                doneOrders.forEach(o => {
                    newNotifs.push({
                        id: `done-${o.id}`, type: 'done', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50',
                        title: 'Order selesai', desc: `ORD-${o.id} siap diambil`, time: getRelativeTime(o.created_at), timestamp: new Date(o.created_at).getTime()
                    });
                });

                const newCusts = customersData.slice(0, 3);
                newCusts.forEach(c => {
                    newNotifs.push({
                        id: `cust-${c.id}`, type: 'user', icon: Users, color: 'text-purple-500 bg-purple-50',
                        title: 'Pelanggan baru', desc: `${c.name} terdaftar`, time: getRelativeTime(c.created_at), timestamp: new Date(c.created_at).getTime()
                    });
                });

                newNotifs.sort((a, b) => b.timestamp - a.timestamp);
                const readSet = new Set(JSON.parse(localStorage.getItem('readNotifs') || '[]'));
                setNotifList(newNotifs.map(n => ({ ...n, read: readSet.has(n.id) })).slice(0, 10));
            } catch (err) {
                console.error("Failed to load notifications", err);
            }
        };

        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAllRead = () => {
        const readIds = notifList.map(n => n.id);
        const existing = JSON.parse(localStorage.getItem('readNotifs') || '[]');
        localStorage.setItem('readNotifs', JSON.stringify([...new Set([...existing, ...readIds])]));
        setNotifList(notifList.map(n => ({ ...n, read: true })));
    };

    const markAsRead = (id) => {
        const existing = JSON.parse(localStorage.getItem('readNotifs') || '[]');
        localStorage.setItem('readNotifs', JSON.stringify([...new Set([...existing, id])]));
        setNotifList(notifList.map(item => item.id === id ? { ...item, read: true } : item));
    };

    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <Menu className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {new Date().toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* Notification */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotif(!showNotif)}
                            className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-slate-500" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotif && (
                            <div className="fixed inset-x-4 md:absolute md:right-0 md:inset-x-auto top-20 md:top-full md:mt-2 md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-800">Notifikasi</h4>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
                                            Tandai semua dibaca
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifList.map((n) => {
                                        const Icon = n.icon;
                                        return (
                                            <div
                                                key={n.id}
                                                className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-primary-50/30' : ''}`}
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                <div className={`p-2 rounded-xl ${n.color} mt-0.5`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!n.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{n.desc}</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3 text-slate-300" />
                                                        <span className="text-[10px] text-slate-400">{n.time}</span>
                                                    </div>
                                                </div>
                                                {!n.read && (
                                                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {notifList.length === 0 && (
                                    <div className="py-8 text-center">
                                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">Tidak ada notifikasi</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={onLogoutClick}
                        title="Keluar"
                        className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
