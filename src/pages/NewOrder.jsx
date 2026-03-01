import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { Search, UserPlus, Plus, Minus, Trash2, ShoppingCart, Check, X, Printer, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { getCustomers, getServices, createOrder, createCustomer } from '../services/api';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};
import Receipt from '../components/Receipt';

export default function NewOrder() {
    const { settings } = useOutletContext();

    const [searchCustomer, setSearchCustomer] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [cart, setCart] = useState([]);
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '' });
    const [receiptOrder, setReceiptOrder] = useState(null);
    const [showMobileCart, setShowMobileCart] = useState(false);

    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const receiptRef = useRef();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [custData, servData] = await Promise.all([
                getCustomers(),
                getServices()
            ]);
            setCustomers(custData);
            setServices(servData);
        } catch (err) {
            setError('Gagal memuat data pelanggan atau layanan');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Prevent body scroll when any modal is open
    useEffect(() => {
        if (receiptOrder || showAddCustomer || showMobileCart) {
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
    }, [receiptOrder, showAddCustomer, showMobileCart]);

    const filteredCustomers = useMemo(() => {
        if (!searchCustomer.trim()) return [];
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
                (c.phone && c.phone.includes(searchCustomer))
        );
    }, [searchCustomer, customers]);

    const addToCart = (service) => {
        const existing = cart.find((item) => item.serviceId === service.id);
        if (existing) {
            setCart(cart.map((item) =>
                item.serviceId === service.id ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            setCart([...cart, { serviceId: service.id, name: service.name, price: service.price, unit: service.unit, qty: 1 }]);
        }
    };

    const updateQty = (serviceId, delta) => {
        setCart(cart.map((item) => {
            if (item.serviceId === serviceId) {
                const newQty = Math.max(0.1, item.qty + delta);
                return { ...item, qty: parseFloat(newQty.toFixed(1)) };
            }
            return item;
        }));
    };

    const setQty = (serviceId, value) => {
        // Hanya izinkan angka dan satu titik/koma desimal
        let sanitized = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');

        // Pastikan hanya ada satu titik desimal
        const parts = sanitized.split('.');
        if (parts.length > 2) {
            sanitized = parts[0] + '.' + parts.slice(1).join('');
        }

        setCart(cart.map((item) => {
            if (item.serviceId === serviceId) {
                return { ...item, qty: sanitized };
            }
            return item;
        }));
    };

    const blurQty = (serviceId) => {
        setCart(cart.map((item) => {
            if (item.serviceId === serviceId) {
                const parsed = parseFloat(item.qty);
                return { ...item, qty: isNaN(parsed) || parsed <= 0 ? 0.1 : parseFloat(parsed.toFixed(1)) };
            }
            return item;
        }));
    };

    const removeFromCart = (serviceId) => {
        setCart(cart.filter((item) => item.serviceId !== serviceId));
    };

    const total = cart.reduce((sum, item) => sum + item.price * (parseFloat(item.qty) || 0), 0);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        const orderData = {
            customer_id: selectedCustomer.id || null, // Might be new customer without ID if skipped
            customer_name: selectedCustomer.name,
            service_id: cart[0].serviceId, // For simple single primary service tracking in DB
            service_name: cart.map(item => `${item.name} (${item.qty}${item.unit})`).join(', '),
            weight: cart.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0),
            total: total,
            payment_method: paymentMethod,
            notes: notes
        };

        try {
            const response = await createOrder(orderData);

            // Reconstruct a receipt object matching what the Receipt component expects
            const printReceiptData = {
                id: response.id || `ORD-${Date.now().toString().slice(-6)}`,
                customerName: selectedCustomer.name,
                customerPhone: selectedCustomer.phone || '',
                paymentMethod,
                notes,
                items: cart.map((item) => ({
                    name: item.name,
                    qty: parseFloat(item.qty) || 0,
                    unit: item.unit,
                    price: item.price,
                    subtotal: item.price * (parseFloat(item.qty) || 0),
                })),
                total,
            };

            setReceiptOrder(printReceiptData);
            setShowMobileCart(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal membuat pesanan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCloseReceipt = () => {
        setReceiptOrder(null);
        setSelectedCustomer(null);
        setCart([]);
        setNotes('');
        setSearchCustomer('');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const categoryOrder = ['Regular', 'Express', 'Premium', 'Spesial'];
    const serviceCategories = [...new Set(services.map((s) => s.category))].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    // Shared order summary content (used in both desktop sidebar and mobile modal)
    const OrderSummaryContent = () => (
        <>
            {/* Customer Selection */}
            <div className="mb-5">
                <label className="text-sm font-medium text-slate-600 mb-2 block">Pelanggan</label>
                {selectedCustomer ? (
                    <div className="flex items-center justify-between bg-primary-50 rounded-xl p-3 border border-primary-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                                {selectedCustomer.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{selectedCustomer.name}</p>
                                <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setSelectedCustomer(null); setSearchCustomer(''); }}
                            className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                        >
                            Ganti
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchCustomer}
                                    onChange={(e) => setSearchCustomer(e.target.value)}
                                    placeholder="Cari pelanggan..."
                                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setShowAddCustomer(true)}
                                title="Tambah Pelanggan Baru"
                                className="p-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors shrink-0"
                            >
                                <UserPlus className="w-4.5 h-4.5" />
                            </button>
                        </div>
                        {filteredCustomers.length > 0 && (
                            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                                {filteredCustomers.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => { setSelectedCustomer(c); setSearchCustomer(''); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors border-b border-slate-100 last:border-0"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{c.name}</p>
                                            <p className="text-xs text-slate-400">{c.phone}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Cart Items */}
            <div className="border-t border-slate-100 pt-4">
                {cart.length === 0 ? (
                    <div className="py-8 text-center">
                        <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Pilih layanan dari kiri</p>
                    </div>
                ) : (
                    <div className="space-y-3 mb-5 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                        {cart.map((item) => (
                            <div key={item.serviceId} className="bg-slate-50 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                                    <button
                                        onClick={() => removeFromCart(item.serviceId)}
                                        className="p-1 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => updateQty(item.serviceId, -0.5)}
                                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={item.qty}
                                                onChange={(e) => setQty(item.serviceId, e.target.value)}
                                                onBlur={() => blurQty(item.serviceId)}
                                                className="w-14 text-center text-sm font-bold text-slate-700 border border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
                                            />
                                            <span className="text-xs text-slate-400">{item.unit}</span>
                                        </div>
                                        <button
                                            onClick={() => updateQty(item.serviceId, 0.5)}
                                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{formatCurrency(item.price * (parseFloat(item.qty) || 0))}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes */}
            <div className="mb-4">
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Catatan</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan khusus..."
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all resize-none"
                />
            </div>

            {/* Payment Method */}
            <div className="mb-5">
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Metode Pembayaran</label>
                <div className="grid grid-cols-4 gap-2">
                    {['Cash', 'Transfer', 'QRIS', 'Bayar Nanti'].map((method) => (
                        <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${paymentMethod === method
                                ? { 'Cash': 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30', 'Transfer': 'bg-primary-600 text-white shadow-lg shadow-primary-600/30', 'QRIS': 'bg-red-500 text-white shadow-lg shadow-red-500/30', 'Bayar Nanti': 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' }[method]
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {method}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total & Submit */}
            <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-slate-800">Total</span>
                    <span className="text-2xl font-bold text-primary-600">{formatCurrency(total)}</span>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!selectedCustomer || cart.length === 0 || isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan Order
                </button>
            </div>
        </>
    );

    return (
        <div className="space-y-6 pb-24 xl:pb-6 print:pb-0 print:space-y-0">
            {error && !receiptOrder && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Receipt Modal */}
            {receiptOrder && createPortal(
                <>
                    {/* Screen Modal (hidden during print) */}
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    <h3 className="text-lg font-bold text-slate-800">Order Berhasil!</h3>
                                </div>
                                <button onClick={handleCloseReceipt} className="p-1 rounded-lg hover:bg-slate-100">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto bg-slate-50 py-4 custom-scrollbar">
                                <div className="space-y-8 flex flex-col items-center">
                                    <Receipt ref={receiptRef} order={receiptOrder} settings={settings} />
                                </div>
                            </div>
                            <div className="flex gap-3 p-4 border-t border-slate-100">
                                <button
                                    onClick={handleCloseReceipt}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all text-sm"
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={handlePrint}
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
                        <Receipt order={receiptOrder} settings={settings} />
                        <Receipt order={receiptOrder} settings={settings} />
                    </div>
                </>,
                document.body
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:hidden">
                {/* Left - Services Only */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Pilih Layanan</h3>
                        <div className="space-y-6">
                            {serviceCategories.map((cat) => (
                                <div key={cat}>
                                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {services.filter((s) => s.category === cat).map((service) => {
                                            const inCart = cart.find((item) => item.serviceId === service.id);
                                            return (
                                                <button
                                                    key={service.id}
                                                    onClick={() => addToCart(service)}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${inCart
                                                        ? 'border-primary-400 bg-primary-50 shadow-sm'
                                                        : 'border-slate-100 hover:border-primary-200 bg-white'
                                                        }`}
                                                >
                                                    <span className="text-2xl">{service.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{service.name}</p>
                                                        <p className="text-xs text-slate-400">{service.estimasi} • per {service.unit}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-primary-600">{formatCurrency(service.price)}</p>
                                                        {inCart && (
                                                            <span className="text-xs font-semibold text-primary-500">✓ {inCart.qty} {service.unit}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right - Desktop Only Sidebar */}
                <div className="hidden xl:block space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
                        <div className="flex items-center gap-2 mb-5">
                            <ShoppingCart className="w-5 h-5 text-primary-600" />
                            <h3 className="text-lg font-bold text-slate-800">Ringkasan Order</h3>
                        </div>
                        {OrderSummaryContent()}
                    </div>
                </div>
            </div>

            {/* Mobile Floating Bottom Bar - Only when cart has items */}
            {cart.length > 0 && (
                <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 safe-bottom print:hidden">
                    <button
                        onClick={() => setShowMobileCart(true)}
                        className="w-full flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl px-5 py-3.5 shadow-lg shadow-primary-600/30"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ShoppingCart className="w-5 h-5" />
                                <span className="absolute -top-2 -right-2 w-4.5 h-4.5 bg-white text-primary-600 text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                                    {cart.length}
                                </span>
                            </div>
                            <span className="font-semibold text-sm">Lihat Ringkasan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{formatCurrency(total)}</span>
                            <ChevronUp className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            )}

            {/* Mobile Cart Modal */}
            {showMobileCart && createPortal(
                <div className="xl:hidden fixed inset-0 z-[100] flex flex-col justify-end print:hidden" onClick={() => setShowMobileCart(false)}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle bar */}
                        <div className="sticky top-0 bg-white z-10 pt-3 pb-2 px-6 border-b border-slate-100 rounded-t-3xl">
                            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-primary-600" />
                                    <h3 className="text-lg font-bold text-slate-800">Ringkasan Order</h3>
                                </div>
                                <button onClick={() => setShowMobileCart(false)} className="p-1 rounded-lg hover:bg-slate-100">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {OrderSummaryContent()}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add Customer Modal */}
            {showAddCustomer && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowAddCustomer(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Tambah Pelanggan Baru</h3>
                            <button onClick={() => setShowAddCustomer(false)} className="p-1 rounded-lg hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Nama Lengkap</label>
                                <input type="text" value={newCustomerForm.name} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" placeholder="Masukkan nama lengkap" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">No. Telepon</label>
                                <input type="text" value={newCustomerForm.phone} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" placeholder="08xxxxxxxxxx" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Alamat</label>
                                <textarea value={newCustomerForm.address} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })} rows={2}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all resize-none" placeholder="Masukkan alamat" />
                            </div>
                            <button
                                onClick={async () => {
                                    if (!newCustomerForm.name.trim()) return;
                                    setIsSubmitting(true);
                                    try {
                                        const res = await createCustomer(newCustomerForm);
                                        await fetchData(); // Refresh customer list to keep in sync

                                        // Ensure we use the ID returned from the server (res.id)
                                        const newCust = {
                                            id: res.id,
                                            name: newCustomerForm.name,
                                            phone: newCustomerForm.phone,
                                            address: newCustomerForm.address
                                        };

                                        setSelectedCustomer(newCust);
                                        setShowAddCustomer(false);
                                        setNewCustomerForm({ name: '', phone: '', address: '' });
                                        setSearchCustomer('');
                                    } catch (err) {
                                        alert('Gagal menambah pelanggan: ' + err.message);
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting}
                                className="w-full flex justify-center gap-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl transition-all text-sm disabled:opacity-70"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Tambah & Pilih Pelanggan
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
