import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Store, Clock, Save, Check, Loader2, AlertCircle, Users, Plus, Trash2, X, Edit2, Eye, EyeOff, Database, Download, Upload, AlertTriangle } from 'lucide-react';
import { getSettings, saveSettings, getUsers, createUser, deleteUser, updateUser, backupData, restoreData, resetData } from '../services/api';

export default function Settings() {
    const { user, refreshSettings } = useOutletContext();
    const [settings, setSettings] = useState({
        store_name: '', address: '', phone: '',
        open_time: { open: '08:00', close: '20:00' },
        operational_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
        brand_logo: null
    });
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Pegawai State
    const [pegawai, setPegawai] = useState([]);
    const [isLoadingPegawai, setIsLoadingPegawai] = useState(true);
    const [showPegawaiModal, setShowPegawaiModal] = useState(false);
    const [pegawaiFormData, setPegawaiFormData] = useState({ username: '', password: '', name: '', role: 'karyawan' });
    const [pegawaiError, setPegawaiError] = useState('');
    const [isSavingPegawai, setIsSavingPegawai] = useState(false);
    const [editPegawaiId, setEditPegawaiId] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Data Management State
    const [backupTargets, setBackupTargets] = useState({ customers: true, orders: true, users: false });
    const [isProcessingData, setIsProcessingData] = useState(false);
    const [dataMessage, setDataMessage] = useState({ type: '', text: '' });

    // Reset Modal State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPassword, setResetPassword] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSettings();
                if (data.id) {
                    setSettings({
                        store_name: data.store_name,
                        address: data.address,
                        phone: data.phone,
                        open_time: { open: data.open_time, close: data.close_time },
                        operational_days: data.operational_days ? data.operational_days.split(',') : [],
                        brand_logo: data.brand_logo || null
                    });
                }
            } catch (_err) {
                setError('Gagal memuat pengaturan.');
            } finally {
                setIsLoading(false);
            }
        };

        const fetchPegawai = async () => {
            try {
                const data = await getUsers();
                setPegawai(data);
            } catch (_err) {
                console.error("Gagal memuat data pegawai");
            } finally {
                setIsLoadingPegawai(false);
            }
        };

        fetchSettings();
        fetchPegawai();
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (showPegawaiModal || showResetModal) {
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
    }, [showPegawaiModal, showResetModal]);

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            await saveSettings(settings);
            setSaved(true);
            if (refreshSettings) await refreshSettings();
            setTimeout(() => setSaved(false), 3000);
        } catch (_err) {
            setError('Gagal menyimpan pengaturan.');
        } finally {
            setIsSaving(false);
        }
    };

    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const toggleDay = (day) => {
        setSettings((prev) => ({
            ...prev,
            operational_days: prev.operational_days.includes(day)
                ? prev.operational_days.filter((d) => d !== day)
                : [...prev.operational_days, day],
        }));
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings({ ...settings, brand_logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-6xl w-full">
            {saved && (
                <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                    <Check className="w-5 h-5" /><span className="font-bold">Pengaturan disimpan!</span>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center gap-2 border border-red-100 mb-6">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Kolom Kiri */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600"><Store className="w-5 h-5 text-white" /></div>
                            <h3 className="text-lg font-bold text-slate-800">Informasi Toko</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Nama Toko</label>
                                <input type="text" value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                                    placeholder="Contoh: FreshClean Laundry"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Alamat</label>
                                <textarea value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} rows={2}
                                    placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all resize-none" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">No. Telepon</label>
                                <input type="text" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                    placeholder="Contoh: 081234567890"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Logo Brand</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                        {settings.brand_logo ? (
                                            <img src={settings.brand_logo} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Download className="w-6 h-6 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="brand-logo-input"
                                            className="hidden"
                                            onChange={handleLogoUpload}
                                        />
                                        <label
                                            htmlFor="brand-logo-input"
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all inline-block"
                                        >
                                            Pilih Foto Logo
                                        </label>
                                        <p className="text-[10px] text-slate-400 mt-2">Disarankan ukuran persegi (1:1), format JPG/PNG/SVG.</p>
                                    </div>
                                    {settings.brand_logo && (
                                        <button
                                            type="button"
                                            onClick={() => setSettings({ ...settings, brand_logo: null })}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            title="Hapus Logo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100 my-8" />

                        {/* Operating Hours */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600"><Clock className="w-5 h-5 text-white" /></div>
                            <h3 className="text-lg font-bold text-slate-800">Jam Operasional</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-600 mb-1.5 block">Jam Buka</label>
                                    <input type="time" value={settings.open_time.open} onChange={(e) => setSettings({ ...settings, open_time: { ...settings.open_time, open: e.target.value } })}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600 mb-1.5 block">Jam Tutup</label>
                                    <input type="time" value={settings.open_time.close} onChange={(e) => setSettings({ ...settings, open_time: { ...settings.open_time, close: e.target.value } })}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-2 block">Hari Operasional</label>
                                <div className="flex flex-wrap gap-2">
                                    {days.map((day) => (
                                        <button key={day} onClick={() => toggleDay(day)}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${settings.operational_days.includes(day) ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}>{day}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={isSaving || isLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>


                </div>

                {/* Kolom Kanan */}
                {user?.role !== 'demo' && (
                    <div className="space-y-6">
                        {/* Manajemen Pegawai */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600"><Users className="w-5 h-5 text-white" /></div>
                                    <h3 className="text-lg font-bold text-slate-800">Manajemen Pegawai</h3>
                                </div>
                                <button onClick={() => {
                                    setEditPegawaiId(null);
                                    setPegawaiFormData({ username: '', password: '', name: '', role: 'karyawan' });
                                    setShowPegawaiModal(true);
                                }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm">
                                    <Plus className="w-4 h-4" />Tambah Karyawan
                                </button>
                            </div>

                            <div className="space-y-3">
                                {isLoadingPegawai ? (
                                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                                ) : (
                                    pegawai.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{p.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${p.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{p.role}</span>
                                                    <span className="text-xs text-slate-500">@{p.username}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => {
                                                    setEditPegawaiId(p.id);
                                                    setPegawaiFormData({ username: p.username, password: '', name: p.name, role: p.role });
                                                    setShowPegawaiModal(true);
                                                }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {p.role !== 'admin' && (
                                                    <button onClick={async () => {
                                                        if (window.confirm(`Hapus karyawan ${p.name}?`)) {
                                                            try { await deleteUser(p.id); setPegawai(pegawai.filter(user => user.id !== p.id)); }
                                                            catch (err) { alert(err.response?.data?.error || 'Gagal menghapus'); }
                                                        }
                                                    }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Manajemen Data */}
                        {user?.role === 'admin' && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mt-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>

                                <div className="flex items-center gap-3 mb-6 relative">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg shadow-orange-500/20">
                                        <Database className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Manajemen Data</h3>
                                </div>

                                {dataMessage.text && (
                                    <div className={`p-4 rounded-xl text-sm flex items-center gap-2 mb-6 ${dataMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                        {dataMessage.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                                        {dataMessage.text}
                                    </div>
                                )}

                                <div className="space-y-6 relative">
                                    {/* Backup Section */}
                                    <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50">
                                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <Download className="w-4 h-4 text-slate-500" /> Backup Data
                                        </h4>
                                        <p className="text-xs text-slate-500 mb-4">Pilih data yang ingin didownload (dicadangkan) ke dalam file JSON.</p>
                                        <div className="flex flex-wrap gap-4 mb-4">
                                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                <input type="checkbox" checked={backupTargets.orders} onChange={(e) => setBackupTargets({ ...backupTargets, orders: e.target.checked })} className="rounded text-primary-600 focus:ring-primary-500" />
                                                Data Transaksi
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                <input type="checkbox" checked={backupTargets.customers} onChange={(e) => setBackupTargets({ ...backupTargets, customers: e.target.checked })} className="rounded text-primary-600 focus:ring-primary-500" />
                                                Data Pelanggan
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                <input type="checkbox" checked={backupTargets.users} onChange={(e) => setBackupTargets({ ...backupTargets, users: e.target.checked })} className="rounded text-primary-600 focus:ring-primary-500" />
                                                Data Pegawai
                                            </label>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const targets = Object.keys(backupTargets).filter(k => backupTargets[k]);
                                                if (targets.length === 0) return setDataMessage({ type: 'error', text: 'Pilih minimal satu data untuk di-backup' });
                                                setIsProcessingData(true);
                                                setDataMessage({ type: '', text: '' });
                                                try {
                                                    const res = await backupData(targets);
                                                    if (res.success) {
                                                        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `backup_freshclean_${new Date().toISOString().slice(0, 10)}.json`;
                                                        a.click();
                                                        window.URL.revokeObjectURL(url);
                                                        setDataMessage({ type: 'success', text: 'Backup berhasil diunduh.' });
                                                    }
                                                } catch (err) {
                                                    setDataMessage({ type: 'error', text: err.response?.data?.error || 'Gagal memproses backup.' });
                                                } finally { setIsProcessingData(false); }
                                            }}
                                            disabled={isProcessingData}
                                            className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                                        >
                                            Download Backup
                                        </button>
                                    </div>

                                    {/* Restore Section */}
                                    <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50">
                                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <Upload className="w-4 h-4 text-slate-500" /> Restore Data
                                        </h4>
                                        <p className="text-xs text-slate-500 mb-4">Kembalikan data dari file backup JSON sebelumnya. Data lama yang berkonflik akan ditimpa.</p>
                                        <input
                                            type="file"
                                            accept=".json"
                                            id="restore-file"
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 mb-4 cursor-pointer"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                setIsProcessingData(true);
                                                setDataMessage({ type: '', text: '' });
                                                const reader = new FileReader();
                                                reader.onload = async (event) => {
                                                    try {
                                                        const jsonData = JSON.parse(event.target.result);
                                                        const res = await restoreData(jsonData);
                                                        if (res.success) setDataMessage({ type: 'success', text: 'Data berhasil dipulihkan!' });
                                                    } catch (err) {
                                                        setDataMessage({ type: 'error', text: err.response?.data?.error || 'File tidak valid atau gagal dipulihkan.' });
                                                    } finally {
                                                        setIsProcessingData(false);
                                                        e.target.value = ''; // Reset input
                                                    }
                                                };
                                                reader.readAsText(file);
                                            }}
                                        />
                                    </div>

                                    {/* Reset Section */}
                                    <div className="p-5 rounded-xl border border-red-100 bg-red-50/50">
                                        <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Reset Sistem Operasional
                                        </h4>
                                        <p className="text-xs text-red-600/80 mb-4"><strong>Sangat Berbahaya!</strong> Tindakan ini akan <strong>menghapus permanen</strong> seluruh data Transaksi, Pelanggan, dan akun Pegawai. Pengaturan Toko dan akun Administrator Anda tidak akan terhapus.</p>
                                        <button
                                            onClick={() => setShowResetModal(true)}
                                            disabled={isProcessingData}
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
                                        >
                                            Hapus Semua Data Operasional
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Tambah/Edit Pegawai */}
            {
                showPegawaiModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPegawaiModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800">{editPegawaiId ? 'Edit Karyawan' : 'Tambah Karyawan'}</h3>
                                <button onClick={() => setShowPegawaiModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
                            </div>

                            {pegawaiError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 mb-4">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {pegawaiError}
                                </div>
                            )}

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setIsSavingPegawai(true);
                                setPegawaiError('');
                                try {
                                    if (editPegawaiId) {
                                        await updateUser(editPegawaiId, pegawaiFormData);
                                    } else {
                                        await createUser(pegawaiFormData);
                                    }
                                    const newData = await getUsers();
                                    setPegawai(newData);
                                    setShowPegawaiModal(false);
                                    setPegawaiFormData({ username: '', password: '', name: '', role: 'karyawan' });
                                } catch (err) {
                                    setPegawaiError(err.response?.data?.error || `Gagal ${editPegawaiId ? 'menyimpan' : 'menambah'} karyawan`);
                                } finally {
                                    setIsSavingPegawai(false);
                                }
                            }} className="space-y-4" autoComplete="off">
                                <div>
                                    <label className="text-sm font-medium text-slate-600 mb-1.5 block">Nama Lengkap</label>
                                    <input type="text" required value={pegawaiFormData.name} onChange={(e) => setPegawaiFormData({ ...pegawaiFormData, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" placeholder="Budi Santoso" autoComplete="off" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600 mb-1.5 block">Username (Login)</label>
                                    <input type="text" required value={pegawaiFormData.username} onChange={(e) => setPegawaiFormData({ ...pegawaiFormData, username: e.target.value.toLowerCase().replace(/\s/g, '') })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" placeholder="budi123" autoComplete="off" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600 mb-1.5 block">Role</label>
                                    <select value={pegawaiFormData.role} onChange={(e) => setPegawaiFormData({ ...pegawaiFormData, role: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                                        <option value="karyawan">Pegawai / Karyawan</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600 mb-1.5 block">Password {editPegawaiId && <span className="text-xs text-slate-400 font-normal">(Kosongkan jika tidak ingin diubah)</span>}</label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} required={!editPegawaiId} value={pegawaiFormData.password} onChange={(e) => setPegawaiFormData({ ...pegawaiFormData, password: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" placeholder="••••••••" autoComplete="new-password" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button disabled={isSavingPegawai} type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all text-sm mt-6">
                                    {isSavingPegawai && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editPegawaiId ? 'Simpan Perubahan' : 'Simpan Karyawan'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal Konfirmasi Reset */}
            {
                showResetModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowResetModal(false)}>
                        <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                            <div className="flex flex-col items-center text-center mb-6 relative">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Peringatan Keras!</h3>
                                <p className="text-sm text-slate-600">
                                    Seluruh transaksi, rekap pendapatan, daftar pelanggan, dan akun pegawai akan <strong className="text-red-600">DIHAPUS PERMANEN</strong>.
                                    <br /><br />
                                    <span className="text-xs italic text-slate-500">Pengaturan toko dan akun Administrator Anda tidak akan terhapus.</span>
                                </p>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!resetPassword) return;
                                setIsProcessingData(true);
                                setDataMessage({ type: '', text: '' });
                                try {
                                    const res = await resetData(user.id, resetPassword);
                                    if (res.success) {
                                        setDataMessage({ type: 'success', text: 'Sistem berhasil di-reset menjadi kosong.' });
                                        const newData = await getUsers();
                                        setPegawai(newData);
                                        setShowResetModal(false);
                                        setResetPassword('');
                                    }
                                } catch (err) {
                                    setDataMessage({ type: 'error', text: err.response?.data?.error || 'Gagal reset sistem.' });
                                    setShowResetModal(false);
                                } finally {
                                    setIsProcessingData(false);
                                }
                            }} className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-2 text-left">Password Administrator</label>
                                    <div className="relative">
                                        <input
                                            type={showResetPassword ? "text" : "password"}
                                            required
                                            autoFocus
                                            value={resetPassword}
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            placeholder="Ketik password admin..."
                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowResetPassword(!showResetPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 focus:outline-none"
                                        >
                                            {showResetPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-left">Masukan kata sandi Anda untuk memastikan otoritas reset.</p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowResetModal(false); setResetPassword(''); }}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessingData || !resetPassword}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Ya, Hapus
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
