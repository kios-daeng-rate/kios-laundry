import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ShoppingBag, Star, Calendar, Loader2 } from 'lucide-react';
import { getDashboardStats } from '../services/api';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function Reports() {
    const [period, setPeriod] = useState('7Hari');
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await getDashboardStats();
                setData(result);
            } catch (err) {
                console.error("Failed to load reports data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const is12Months = period === '12Bulan';
    const empty12Months = [
        { name: 'Jan', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Feb', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Mar', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Apr', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Mei', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Jun', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Jul', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Agt', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Sep', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Okt', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Nov', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 },
        { name: 'Des', pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 }
    ];
    const chartData = is12Months ? (data.revenue_chart_12_bulan?.length > 0 ? data.revenue_chart_12_bulan : empty12Months) : (data.revenue_chart || []);

    // Adapt available dashboard data for reports based on period
    const totalRevenue = chartData.reduce((sum, d) => sum + d.pendapatan, 0);

    const avgPerDay = Math.round(totalRevenue / (is12Months ? 365 : 7));

    // Service popularity (estimated from recent orders + status counts for visual purposes until /api/reports.php is built)
    const serviceCount = {};
    data.recent_orders.forEach((o) => { serviceCount[o.service_name] = (serviceCount[o.service_name] || 0) + 1; });
    const serviceData = Object.entries(serviceCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const topService = serviceData[0];
    const maxCount = topService?.value || 1;

    // Payment method stats (initialized with all methods to ensure 0s are shown)
    const paymentStats = {
        'Cash': 0,
        'Transfer': 0,
        'QRIS': 0,
        'Bayar Nanti': 0
    };
    data.recent_orders.forEach((o) => {
        const method = o.payment_method || 'Cash';
        if (paymentStats.hasOwnProperty(method)) {
            paymentStats[method]++;
        } else {
            paymentStats[method] = 1;
        }
    });
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            if (is12Months) {
                const monthData = payload[0].payload;
                const total = monthData.pendapatan;
                const weeks = [
                    { name: 'Minggu 1', value: monthData.minggu1 },
                    { name: 'Minggu 2', value: monthData.minggu2 },
                    { name: 'Minggu 3', value: monthData.minggu3 },
                    { name: 'Minggu 4', value: monthData.minggu4 },
                ];
                return (
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 min-w-[200px]">
                        <p className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Bulan {label}</p>
                        <div className="space-y-2 mb-3">
                            {weeks.map((entry, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">{entry.name}</span>
                                    <span className="font-semibold text-slate-700">{formatCurrency(entry.value)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <span className="font-bold text-slate-800 text-sm">Total Bulanan</span>
                            <span className="font-bold text-primary-600">{formatCurrency(total)}</span>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
                        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
                        <p className="font-bold text-primary-600">{formatCurrency(payload[0].value)}</p>
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: `Pendapatan (${is12Months ? '12 Bulan' : '7 Hari'})`, value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'from-primary-500 to-primary-600' },
                    { label: 'Total Order', value: data.total_orders.toString(), icon: ShoppingBag, color: 'from-cyan-500 to-cyan-600' },
                    { label: 'Rata-rata / Hari', value: formatCurrency(avgPerDay), icon: Calendar, color: 'from-amber-500 to-amber-600' },
                    { label: 'Layanan Favorit', value: topService?.name || '-', icon: Star, color: 'from-emerald-500 to-emerald-600' },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                                    <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Monthly Revenue Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Bagan Pendapatan</h3>
                        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                            <option value="7Hari">7 Hari Terakhir</option>
                            <option value="12Bulan">12 Bulan Terakhir</option>
                        </select>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ outline: 'none' }} tabIndex={-1}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} domain={[0, dataMax => (dataMax === 0 ? 10000 : dataMax)]} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="pendapatan" radius={[6, 6, 0, 0]} fill={COLORS[0]} isAnimationActive={false} maxBarSize={50} minPointSize={3} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Service Popularity - Simple Horizontal Bars */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Layanan Terfavorit</h3>
                    <div className="space-y-3">
                        {serviceData.map((item, i) => (
                            <div key={item.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-slate-600">{item.name}</span>
                                    <span className="text-sm font-bold text-slate-700">{item.value} order</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(item.value / maxCount) * 100}%`,
                                            backgroundColor: COLORS[i % COLORS.length],
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Metode Pembayaran</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(paymentStats).map(([method, count]) => (
                        <div key={method} className="bg-slate-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-primary-600">{count}</p>
                            <p className="text-sm text-slate-500 mt-1">{method}</p>
                            <p className="text-xs text-slate-400">{Math.round((count / Math.max(1, data.recent_orders.length)) * 100)}% dari pesanan terbaru</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
