import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { getServices, createService, updateService, deleteService } from '../services/api';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

export default function Services() {
    const [showModal, setShowModal] = useState(false);
    const [editService, setEditService] = useState(null);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', unit: 'kg', estimasi: '', category: 'Regular', icon: '👕' });
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const data = await getServices();
            setServices(data);
        } catch (err) {
            setError('Gagal memuat data layanan');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (showModal || serviceToDelete) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showModal, serviceToDelete]);

    const categoryOrder = ['Regular', 'Express', 'Premium', 'Spesial'];
    const categories = [...new Set(services.map((s) => s.category))].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        // If a category isn't in the predefined list, put it at the end
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    const openAdd = () => { setEditService(null); setFormData({ name: '', price: '', unit: 'kg', estimasi: '', category: 'Regular', icon: '👕' }); setShowModal(true); };
    const openEdit = (s) => { setEditService(s); setFormData({ name: s.name, price: String(s.price), unit: s.unit, estimasi: s.estimasi, category: s.category, icon: s.icon || '👕' }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            if (editService) {
                await updateService(editService.id, formData);
            } else {
                await createService(formData);
            }
            await fetchServices();
            setShowModal(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal menyimpan layanan');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!serviceToDelete) return;
        setIsSaving(true);
        try {
            await deleteService(serviceToDelete.id);
            await fetchServices();
            setServiceToDelete(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal menghapus layanan');
            setTimeout(() => setError(''), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && services.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Total {services.length} layanan</p>
                <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl transition-all text-sm">
                    <Plus className="w-4 h-4" />Tambah Layanan
                </button>
            </div>

            {error && !showModal && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center gap-2 border border-red-100 mb-4">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {categories.map((cat) => (
                <div key={cat}>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat}</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead><tr className="bg-slate-50/80">
                                    <th className="text-left w-[35%] text-xs font-semibold text-slate-500 uppercase px-6 py-3">Layanan</th>
                                    <th className="text-left w-[20%] text-xs font-semibold text-slate-500 uppercase px-6 py-3">Harga</th>
                                    <th className="text-left w-[15%] text-xs font-semibold text-slate-500 uppercase px-6 py-3">Satuan</th>
                                    <th className="text-left w-[15%] text-xs font-semibold text-slate-500 uppercase px-6 py-3">Estimasi</th>
                                    <th className="text-left w-[15%] text-xs font-semibold text-slate-500 uppercase px-6 py-3">Aksi</th>
                                </tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {services.filter((s) => s.category === cat).map((svc) => (
                                        <tr key={svc.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 w-[35%]"><div className="flex items-center gap-3"><span className="text-xl">{svc.icon}</span><span className="text-sm font-semibold text-slate-700">{svc.name}</span></div></td>
                                            <td className="px-6 py-4 w-[20%] text-sm font-bold text-primary-600">{formatCurrency(svc.price)}</td>
                                            <td className="px-6 py-4 w-[15%] text-sm text-slate-600">per {svc.unit}</td>
                                            <td className="px-6 py-4 w-[15%] text-sm text-slate-600">{svc.estimasi}</td>
                                            <td className="px-6 py-4 w-[15%]"><div className="flex gap-1">
                                                <button onClick={() => openEdit(svc)} className="p-2 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => setServiceToDelete(svc)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ))}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800">{editService ? 'Edit Layanan' : 'Tambah Layanan'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 mb-4">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="text-sm font-medium text-slate-600 mb-1.5 block">Nama</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" placeholder="Cuci Setrika" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-sm font-medium text-slate-600 mb-1.5 block">Harga</label>
                                    <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" /></div>
                                <div><label className="text-sm font-medium text-slate-600 mb-1.5 block">Satuan</label>
                                    <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                                        <option value="kg">per KG</option><option value="pcs">per PCS</option><option value="pasang">per Pasang</option>
                                    </select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-sm font-medium text-slate-600 mb-1.5 block">Estimasi</label>
                                    <input type="text" value={formData.estimasi} onChange={(e) => setFormData({ ...formData, estimasi: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" placeholder="2 hari" /></div>
                                <div><label className="text-sm font-medium text-slate-600 mb-1.5 block">Kategori</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                                        <option value="Regular">Regular</option><option value="Express">Express</option><option value="Premium">Premium</option><option value="Spesial">Spesial</option>
                                    </select></div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Ikon (Emoji)</label>
                                <input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" placeholder="👕" />
                            </div>
                            <button disabled={isSaving} type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl transition-all text-sm disabled:opacity-70">
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editService ? 'Simpan Perubahan' : 'Tambah Layanan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {serviceToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setServiceToDelete(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus Layanan?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Apakah Anda yakin ingin menghapus layanan <span className="font-bold text-slate-700">"{serviceToDelete.name}"</span>? Data yang dihapus tidak dapat dikembalikan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setServiceToDelete(null)}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-600/30 hover:shadow-xl hover:bg-red-700 transition-all text-sm disabled:opacity-70"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
