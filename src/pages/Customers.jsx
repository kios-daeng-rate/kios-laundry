import { useState, useEffect } from 'react';
import { Search, UserPlus, Edit2, Phone, MapPin, ShoppingBag, X, Loader2, AlertCircle } from 'lucide-react';
import { getCustomers, createCustomer, updateCustomer } from '../services/api';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

export default function Customers() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editCustomer, setEditCustomer] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });

    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (err) {
            setError('Gagal memuat data pelanggan');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery)
    );

    const openAddModal = () => {
        setEditCustomer(null);
        setFormData({ name: '', phone: '', address: '' });
        setShowModal(true);
    };

    const openEditModal = (customer) => {
        setEditCustomer(customer);
        setFormData({ name: customer.name, phone: customer.phone, address: customer.address });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            if (editCustomer) {
                await updateCustomer(editCustomer.id, formData);
            } else {
                await createCustomer(formData);
            }
            await fetchCustomers();
            setShowModal(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal menyimpan pelanggan');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && customers.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari pelanggan..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                    />
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl transition-all text-sm"
                >
                    <UserPlus className="w-4 h-4" />
                    Tambah Pelanggan
                </button>
            </div>

            {/* Error handling */}
            {error && !showModal && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center gap-2 border border-red-100 mb-4">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Customer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCustomers.map((customer) => (
                    <div
                        key={customer.id}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20">
                                    {customer.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{customer.name}</h4>
                                    <p className="text-sm text-slate-400">Sejak {new Date(customer.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => openEditModal(customer)}
                                className="p-2 rounded-lg text-slate-400 bg-slate-50 md:bg-transparent md:text-slate-300 hover:text-primary-600 hover:bg-primary-50 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Phone className="w-4 h-4 text-slate-300" />
                                {customer.phone}
                            </div>
                            <div className="flex items-start gap-2 text-sm text-slate-500">
                                <MapPin className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                                <span className="line-clamp-1">{customer.address}</span>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                <ShoppingBag className="w-4 h-4 text-slate-300" />
                                <span>{customer.total_orders || 0} order</span>
                            </div>
                            <span className="text-sm font-bold text-primary-600">{formatCurrency(customer.total_spent || 0)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCustomers.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                    <p className="text-slate-400">Tidak ada pelanggan ditemukan</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 mb-4">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                                    placeholder="Masukkan nama lengkap"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">No. Telepon</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Alamat</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all resize-none"
                                    placeholder="Masukkan alamat lengkap"
                                />
                            </div>
                            <button disabled={isSaving} type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl transition-all text-sm disabled:opacity-70">
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
