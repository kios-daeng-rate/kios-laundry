import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { Search, Eye, MessageCircle, ChevronDown, X, Loader2, AlertCircle, Printer, Check } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Receipt from '../components/Receipt';

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
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const allStatuses = ['Semua', 'Baru', 'Diproses', 'Dicuci', 'Disetrika', 'Selesai', 'Diambil'];
const statusFlow = ['Baru', 'Diproses', 'Dicuci', 'Disetrika', 'Selesai', 'Diambil'];

const sendWhatsApp = (order) => {
    // In a real app we'd fetch the customer's phone if it's not joined in the order row.
    // For now we'll only send a generic message since phone isn't fetched in getOrders.
    const lines = [
        'Halo ' + order.customer_name,
        '',
        'Laundry Anda sudah *SELESAI*',
        '',
        'No. Order: *' + order.id + '*',
        '',
        'Silakan ambil di *FreshClean Laundry*.',
        'Terima kasih!',
    ];

    // Placeholder phone action 
    alert(`Akan mengirim WhatsApp ke Pelanggan:\n\n${lines.join('\n')}`);
};

export default function Orders() {
    const [orderList, setOrderList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeStatus, setActiveStatus] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const receiptRef = useRef();
    const { settings } = useOutletContext();

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await getOrders();
            setOrderList(data);
        } catch (err) {
            setError('Gagal memuat data pesanan');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (selectedOrder || showReceipt) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        };
    }, [selectedOrder, showReceipt]);

    const filteredOrders = useMemo(() => {
        return orderList.filter((o) => {
            const matchesStatus = activeStatus === 'Semua' || o.status === activeStatus;
            const matchesSearch =
                !searchQuery.trim() ||
                o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [activeStatus, searchQuery, orderList]);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);

            const updatedOrders = orderList.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            );
            setOrderList(updatedOrders);

            const updatedOrder = updatedOrders.find(o => o.id === orderId);
            setSelectedOrder(updatedOrder);
            setShowStatusDropdown(false);

            if (newStatus === 'Selesai' && updatedOrder) {
                sendWhatsApp(updatedOrder);
            }
        } catch (err) {
            alert('Gagal mengupdate status: ' + (err.response?.data?.error || err.message));
        }
    };

    if (isLoading && orderList.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari no. order atau nama pelanggan..."
                            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {allStatuses.map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveStatus(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeStatus === status
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {status}
                                {status !== 'Semua' && (
                                    <span className="ml-1.5 text-xs opacity-70">
                                        ({orderList.filter((o) => o.status === status).length})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <p className="text-sm text-slate-500">
                        Menampilkan <span className="font-bold text-slate-700">{filteredOrders.length}</span> pesanan
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/80">
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">No. Order</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Pelanggan</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Layanan</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Berat</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Total</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Tanggal</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-mono font-semibold text-primary-600">{order.id}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-700">{order.customer_name}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{order.service_name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{order.weight} kg</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{formatCurrency(order.total)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(order.created_at)}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => { setSelectedOrder(order); setShowStatusDropdown(false); }}
                                            className="p-2 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                                        Tidak ada pesanan ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Detail Pesanan</h3>
                            <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-lg hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">No. Order</span>
                                <span className="text-sm font-mono font-bold text-primary-600">{selectedOrder.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Pelanggan</span>
                                <span className="text-sm font-semibold text-slate-700">{selectedOrder.customer_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Layanan</span>
                                <span className="text-sm text-slate-700">{selectedOrder.service_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Berat</span>
                                <span className="text-sm text-slate-700">{selectedOrder.weight} kg</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Status</span>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                        className="flex items-center gap-1.5"
                                    >
                                        <StatusBadge status={selectedOrder.status} />
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    {showStatusDropdown && (
                                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-10 w-40">
                                            {statusFlow.map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => updateStatus(selectedOrder.id, s)}
                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${s === selectedOrder.status ? 'font-bold text-primary-600 bg-primary-50' : 'text-slate-600'}`}
                                                >
                                                    {s === selectedOrder.status && '> '}{s}
                                                    {s === 'Selesai' && s !== selectedOrder.status && (
                                                        <MessageCircle className="w-3 h-3 text-emerald-500 ml-auto" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Tanggal Order</span>
                                <span className="text-sm text-slate-700">{formatDate(selectedOrder.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Estimasi Selesai</span>
                                <span className="text-sm text-slate-700">{formatDate(selectedOrder.pickup_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Pembayaran</span>
                                <span className="text-sm text-slate-700">{selectedOrder.payment_method}</span>
                            </div>
                            {selectedOrder.notes && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Catatan</span>
                                    <span className="text-sm text-slate-700 text-right max-w-[200px]">{selectedOrder.notes}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 pt-4 flex justify-between">
                                <span className="text-lg font-bold text-slate-800">Total</span>
                                <span className="text-lg font-bold text-primary-600">{formatCurrency(selectedOrder.total)}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => sendWhatsApp(selectedOrder)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all text-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Kirim WA
                                </button>
                                <button
                                    onClick={() => setShowReceipt(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all text-sm shadow-lg shadow-primary-600/30"
                                >
                                    <Printer className="w-4 h-4" />
                                    Lihat Struk
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && selectedOrder && createPortal(
                <>
                    {/* Screen Modal (hidden during print) */}
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800">Struk Pesanan</h3>
                                <button onClick={() => setShowReceipt(false)} className="p-1 rounded-lg hover:bg-slate-100">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto bg-slate-50 py-4 custom-scrollbar">
                                <div className="space-y-8 flex flex-col items-center">
                                    <Receipt
                                        ref={receiptRef}
                                        order={{
                                            id: selectedOrder.id,
                                            customerName: selectedOrder.customer_name,
                                            customerPhone: '', // Not available in getOrders list
                                            paymentMethod: selectedOrder.payment_method || 'Tunai',
                                            notes: selectedOrder.notes,
                                            items: [
                                                {
                                                    name: selectedOrder.service_name,
                                                    qty: parseFloat(selectedOrder.weight),
                                                    unit: 'kg', // Fallback, could be empty
                                                    price: selectedOrder.total / (parseFloat(selectedOrder.weight) || 1),
                                                    subtotal: selectedOrder.total
                                                }
                                            ],
                                            total: selectedOrder.total
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 p-4 border-t border-slate-100">
                                <button
                                    onClick={() => setShowReceipt(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all text-sm"
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl transition-all text-sm"
                                >
                                    <Printer className="w-4 h-4" />
                                    Cetak Struk
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Print Content (hidden on screen) */}
                    <div className="hidden print:block printable-receipts">
                        <Receipt
                            settings={settings}
                            order={{
                                id: selectedOrder.id,
                                customerName: selectedOrder.customer_name,
                                customerPhone: '',
                                paymentMethod: selectedOrder.payment_method || 'Tunai',
                                notes: selectedOrder.notes,
                                items: [
                                    {
                                        name: selectedOrder.service_name,
                                        qty: parseFloat(selectedOrder.weight),
                                        unit: 'kg',
                                        price: selectedOrder.total / (parseFloat(selectedOrder.weight) || 1),
                                        subtotal: selectedOrder.total
                                    }
                                ],
                                total: selectedOrder.total
                            }}
                        />
                        <Receipt
                            settings={settings}
                            order={{
                                id: selectedOrder.id,
                                customerName: selectedOrder.customer_name,
                                customerPhone: '',
                                paymentMethod: selectedOrder.payment_method || 'Tunai',
                                notes: selectedOrder.notes,
                                items: [
                                    {
                                        name: selectedOrder.service_name,
                                        qty: parseFloat(selectedOrder.weight),
                                        unit: 'kg',
                                        price: selectedOrder.total / (parseFloat(selectedOrder.weight) || 1),
                                        subtotal: selectedOrder.total
                                    }
                                ],
                                total: selectedOrder.total
                            }}
                        />
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
