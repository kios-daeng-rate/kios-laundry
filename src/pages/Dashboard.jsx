import { useState, useEffect } from 'react';
import {
    ShoppingBag,
    TrendingUp,
    Clock,
    UserPlus,
    ArrowUpRight,
    ArrowDownRight,
    ExternalLink,
    Loader2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const result = await getDashboardStats();
                setData(result);
            } catch (err) {
                console.error("Failed to load dashboard data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (isLoading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const calculateChange = (current, previous) => {
        if (!previous || previous === 0) return current > 0 ? { text: '+100%', up: true } : { text: '0%', up: true };
        const change = ((current - previous) / previous) * 100;
        const sign = change >= 0 ? '+' : '';
        return {
            text: `${sign}${change.toFixed(0)}%`,
            up: change >= 0
        };
    };

    const activeOrdersCount = data.status_counts['Baru'] + data.status_counts['Diproses'] + data.status_counts['Dicuci'] + data.status_counts['Disetrika'];

    const orderChange = calculateChange(data.today_orders, data.yesterday_orders);
    const revenueChange = calculateChange(data.today_revenue, data.yesterday_revenue);
    const customerChange = calculateChange(data.new_customers, data.yesterday_customers);

    const summaryStats = [
        {
            label: 'Order Hari Ini',
            value: data.today_orders.toString(),
            change: orderChange.text,
            up: orderChange.up,
            icon: ShoppingBag,
            color: 'from-primary-500 to-primary-600',
            bgLight: 'bg-primary-50',
        },
        {
            label: 'Pendapatan Hari Ini',
            value: formatCurrency(data.today_revenue),
            change: revenueChange.text,
            up: revenueChange.up,
            icon: TrendingUp,
            color: 'from-emerald-500 to-emerald-600',
            bgLight: 'bg-emerald-50',
        },
        {
            label: 'Order Aktif',
            value: activeOrdersCount.toString(),
            change: orderChange.text, // Menggunakan tren order sebagai proxy jika data aktif kemarin tidak ada
            up: orderChange.up,
            icon: Clock,
            color: 'from-amber-500 to-amber-600',
            bgLight: 'bg-amber-50',
        },
        {
            label: 'Pelanggan Baru',
            value: data.new_customers.toString(),
            change: customerChange.text,
            up: customerChange.up,
            icon: UserPlus,
            color: 'from-accent-500 to-accent-600',
            bgLight: 'bg-cyan-50',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {summaryStats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={i}
                            className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-28 h-28 -mr-8 -mt-8 rounded-full bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity"
                                style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                            />
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 mt-3">
                                {stat.up ? (
                                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                                )}
                                <span className={`text-xs font-semibold ${stat.up ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {stat.change}
                                </span>
                                <span className="text-xs text-slate-400 ml-1">vs kemarin</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Pendapatan 7 Hari</h3>
                            <p className="text-sm text-slate-400">Ringkasan pendapatan minggu ini</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800">
                                {formatCurrency(data.revenue_chart.reduce((s, d) => s + d.pendapatan, 0))}
                            </p>
                            <p className="text-xs text-emerald-500 font-semibold">7 Hari Terakhir</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenue_chart} style={{ outline: 'none' }} tabIndex={-1}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${v / 1000}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="pendapatan"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fill="url(#colorRevenue)"
                                    dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Status Order</h3>
                    <div className="space-y-3">
                        {[
                            { status: 'Baru', count: data.status_counts['Baru'] || 0, color: 'bg-blue-500' },
                            { status: 'Diproses', count: data.status_counts['Diproses'] || 0, color: 'bg-amber-500' },
                            { status: 'Dicuci', count: data.status_counts['Dicuci'] || 0, color: 'bg-cyan-500' },
                            { status: 'Disetrika', count: data.status_counts['Disetrika'] || 0, color: 'bg-purple-500' },
                            { status: 'Selesai', count: data.status_counts['Selesai'] || 0, color: 'bg-emerald-500' },
                            { status: 'Diambil', count: data.status_counts['Diambil'] || 0, color: 'bg-gray-400' },
                        ].map((item) => (
                            <div key={item.status} className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                <span className="text-sm text-slate-600 flex-1">{item.status}</span>
                                <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">{item.count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500">Total Order</span>
                            <span className="text-lg font-bold text-slate-800">{data.total_orders}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Order Terbaru</h3>
                        <p className="text-sm text-slate-400">5 order terakhir masuk</p>
                    </div>
                    <Link
                        to="/orders"
                        className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        Lihat Semua
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/80">
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">No. Order</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Pelanggan</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Layanan</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Total</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.recent_orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-mono font-semibold text-primary-600">{order.id}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{order.customer_name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{order.service_name}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{formatCurrency(order.total)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(order.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
