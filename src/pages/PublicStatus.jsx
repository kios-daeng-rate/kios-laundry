import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Clock, CheckCircle2, ChevronLeft, MapPin, Phone, Search } from 'lucide-react';
import { checkOrderStatus } from '../services/api';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

const StatusStep = ({ label, sublabel, isActive, isCompleted, icon: Icon }) => (
    <div className="flex gap-4 relative">
        <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors ${isCompleted ? 'bg-emerald-500 text-white' :
                isActive ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                    'bg-slate-100 text-slate-400'
                }`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 w-0.5 bg-slate-100 my-1 last:hidden" />
        </div>
        <div className="pb-8">
            <p className={`text-sm font-bold ${isActive || isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>
        </div>
    </div>
);

export default function PublicStatus() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await checkOrderStatus(orderId);
                setOrder(data);
            } catch (err) {
                setError(err.response?.data?.error || 'Pesanan tidak ditemukan');
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium tracking-wide">Mengecek status...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-2">Oops! Kosong</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                        Kami tidak dapat menemukan pesanan dengan nomor <span className="font-bold text-slate-800">{orderId}</span>. Pastikan nomor sudah benar.
                    </p>
                    <Link to="/" className="inline-flex items-center gap-2 text-primary-600 font-bold hover:underline">
                        <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    const statuses = ['Baru', 'Diproses', 'Dicuci', 'Disetrika', 'Selesai', 'Diambil'];
    const currentStatusIdx = statuses.indexOf(order.status);

    // Map status names for better display
    const statusMeta = {
        'Baru': { sub: 'Pesanan telah diterima dan menunggu antrean' },
        'Diproses': { sub: 'Pesanan sedang disiapkan' },
        'Dicuci': { sub: 'Pakaian sedang dibersihkan dengan mesin' },
        'Disetrika': { sub: 'Proses finishing dan perapian' },
        'Selesai': { sub: 'Siap untuk diambil' },
        'Diambil': { sub: 'Sudah diserahkan ke pelanggan' }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
            {/* Header / Branding */}
            <div className="bg-white px-6 py-6 shadow-sm border-b border-slate-100 flex flex-col items-center sticky top-0 z-[100] backdrop-blur-md bg-white/90">
                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white mb-2 shadow-lg shadow-primary-200">
                    <ShoppingBag className="w-6 h-6" />
                </div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">{order.store_name}</h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Status Tracking</p>
            </div>

            <div className="max-w-md mx-auto px-5 mt-8 space-y-6">
                {/* Status Header */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <p className="text-primary-100 text-xs font-bold tracking-widest uppercase mb-1">Status Saat Ini</p>
                    <h2 className="text-4xl font-black mb-6 tracking-tight">{order.status}</h2>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                        <div>
                            <p className="text-primary-200 text-[10px] font-bold uppercase tracking-wider mb-1">No. Order</p>
                            <p className="text-sm font-black tracking-wide font-mono">{order.id}</p>
                        </div>
                        <div>
                            <p className="text-primary-200 text-[10px] font-bold uppercase tracking-wider mb-1">Nama</p>
                            <p className="text-sm font-black truncate">{order.customer_name}</p>
                        </div>
                    </div>
                </div>

                {/* Progress Tracking */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-8">Timeline Pesanan</h3>
                    <div className="space-y-0">
                        {statuses.map((s, idx) => (
                            <StatusStep
                                key={s}
                                label={s}
                                sublabel={statusMeta[s].sub}
                                isActive={idx === currentStatusIdx}
                                isCompleted={idx < currentStatusIdx}
                                icon={s === 'Baru' ? Clock : s === 'Selesai' ? CheckCircle2 : ShoppingBag}
                            />
                        ))}
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6">Informasi Detail</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-slate-50">
                            <span className="text-slate-400 text-sm font-medium">Layanan</span>
                            <span className="text-sm font-black text-slate-700">{order.service_name}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-50">
                            <span className="text-slate-400 text-sm font-medium">Beban</span>
                            <span className="text-sm font-black text-slate-700">{order.weight} kg</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-50">
                            <span className="text-slate-400 text-sm font-medium">Total</span>
                            <span className="text-sm font-black text-primary-600">{formatCurrency(order.total)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-slate-400 text-sm font-medium">Lama Pengerjaan</span>
                            <span className="text-sm font-black text-slate-700">
                                {order.status !== 'Baru' ? order.estimasi : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Store Info */}
                <div className="bg-slate-100/50 rounded-[2.5rem] p-8 border border-white">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Hubungi Toko</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Alamat</p>
                                <p className="text-xs text-slate-600 font-bold leading-relaxed">{order.store_address || '-'}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Telepon</p>
                                <p className="text-xs text-slate-600 font-bold">{order.store_phone || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <p className="text-[10px] text-slate-300 font-bold tracking-[0.2em] uppercase">Powered by {order.store_name}</p>
                </div>
            </div>
        </div>
    );
}
