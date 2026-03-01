import axios from 'axios';
import { orders, customers, services, storeSettings, users as dummyUsers, revenueData7Days, revenueData12Bulan } from '../data/dummyData';

// Get base URL dynamically based on environment
// In development, assume the PHP server runs on localhost:8000
// In production, use window.location.origin to securely auto-follow the STB IP or domain
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? 'http://localhost:8000/api' : `${window.location.origin}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Sisipkan X-Tenant-ID secara otomatis ke setiap request
api.interceptors.request.use((config) => {
    try {
        const userStr = localStorage.getItem('pos_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.tenant_id) {
                config.headers['X-Tenant-ID'] = user.tenant_id;
            }
        }
    } catch (e) { /* abaikan */ }
    return config;
});

const isDemoUser = () => {
    try {
        const userStr = localStorage.getItem('pos_user');
        if (!userStr) return false;
        const user = JSON.parse(userStr);
        return user.role === 'demo';
    } catch {
        return false;
    }
};

const rejectDemo = () => {
    return Promise.reject({ response: { data: { error: 'Aksi dinonaktifkan: Anda sedang menggunakan Akun Demo. Perubahan tidak disimpan.' } } });
};

export const login = async (username, password, tenantCode) => {
    const response = await api.post('/login.php', { username, password, tenant_code: tenantCode });
    return response.data;
};

export const register = async (data) => {
    const response = await api.post('/register.php', data);
    return response.data;
};

export const verifyOtp = async (tenantSlug, otp) => {
    const response = await api.post('/verify-otp.php', { tenant_slug: tenantSlug, otp });
    return response.data;
};

export const resendOtp = async (tenantSlug) => {
    const response = await api.post('/resend-otp.php', { tenant_slug: tenantSlug });
    return response.data;
};

export const getDashboardStats = async () => {
    if (isDemoUser()) {
        const statusCounts = {
            'Baru': orders.filter(o => o.status === 'Baru').length,
            'Diproses': orders.filter(o => o.status === 'Diproses').length,
            'Dicuci': orders.filter(o => o.status === 'Dicuci').length,
            'Disetrika': orders.filter(o => o.status === 'Disetrika').length,
            'Selesai': orders.filter(o => o.status === 'Selesai').length,
            'Diambil': orders.filter(o => o.status === 'Diambil').length,
        };

        const formattedRecentOrders = orders.slice(0, 5).map(o => ({
            id: o.id,
            customer_name: o.customerName,
            service_name: o.serviceName,
            total: o.total,
            status: o.status,
            payment_method: o.paymentMethod || o.payment_method,
            created_at: o.date + 'T10:00:00'
        }));

        const formattedRevenueChart = revenueData7Days.map(r => ({
            name: r.day,
            pendapatan: r.revenue
        }));

        return {
            today_revenue: 420000,
            today_orders: Math.floor(orders.length / 2),
            new_customers: 2,
            total_orders: orders.length,
            status_counts: statusCounts,
            monthly_revenue: 5200000,
            recent_orders: formattedRecentOrders,
            revenue_chart: formattedRevenueChart,
            revenue_chart_12_bulan: revenueData12Bulan
        };
    }
    const response = await api.get('/dashboard.php');
    if (!response.data.revenue_chart_12_bulan) {
        try {
            const ordersResponse = await api.get('/orders.php');
            const ordersList = ordersResponse.data;
            const currentYear = new Date().getFullYear();
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            const monthlyData = months.map(m => ({ name: m, pendapatan: 0, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 }));

            if (Array.isArray(ordersList)) {
                ordersList.forEach(order => {
                    const dateStr = order.created_at || order.date;
                    if (!dateStr) return;

                    const d = new Date(dateStr);
                    if (d.getFullYear() !== currentYear) return;

                    const monthIndex = d.getMonth();
                    const dateNum = d.getDate();
                    const total = parseFloat(order.total) || 0;

                    let week = 'minggu4';
                    if (dateNum <= 7) week = 'minggu1';
                    else if (dateNum <= 14) week = 'minggu2';
                    else if (dateNum <= 21) week = 'minggu3';

                    monthlyData[monthIndex].pendapatan += total;
                    monthlyData[monthIndex][week] += total;
                });
            }
            response.data.revenue_chart_12_bulan = monthlyData;
        } catch (error) {
            console.error('Gagal memuat orders untuk grafik 12 bulan:', error);
            response.data.revenue_chart_12_bulan = [];
        }
    }
    return response.data;
};

export const getServices = async () => {
    if (isDemoUser()) return services;
    const response = await api.get('/services.php');
    return response.data;
};

export const createService = async (serviceData) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.post('/services.php', serviceData);
    return response.data;
};

export const updateService = async (id, serviceData) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.put('/services.php', { id, ...serviceData });
    return response.data;
};

export const deleteService = async (id) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.delete(`/services.php?id=${id}`);
    return response.data;
};

export const getCustomers = async () => {
    if (isDemoUser()) {
        return customers.map(c => ({
            ...c,
            created_at: c.joinDate + 'T10:00:00'
        }));
    }
    const response = await api.get('/customers.php');
    return response.data;
};

export const createCustomer = async (customerData) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.post('/customers.php', customerData);
    return response.data;
};

export const updateCustomer = async (id, customerData) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.put('/customers.php', { id, ...customerData });
    return response.data;
};

export const getUsers = async () => {
    if (isDemoUser()) return dummyUsers;
    const response = await api.get('/users.php');
    return response.data;
};

export const createUser = async (userData) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.post('/users.php', userData);
    return response.data;
};

export const updateUser = async (id, userData) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.put('/users.php', { id, ...userData });
    return response.data;
};

export const deleteUser = async (id) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.delete(`/users.php?id=${id}`);
    return response.data;
};

export const getOrders = async () => {
    if (isDemoUser()) {
        return orders.map(o => ({
            id: o.id,
            customer_name: o.customerName,
            service_name: o.serviceName,
            weight: o.weight,
            total: o.total,
            status: o.status,
            created_at: o.date + 'T10:00:00'
        }));
    }
    const response = await api.get('/orders.php');
    return response.data;
};

export const createOrder = async (orderData) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.post('/orders.php', orderData);
    return response.data;
};

export const updateOrderStatus = async (id, status) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.put('/orders.php', { id, status });
    return response.data;
};

export const getSettings = async () => {
    if (isDemoUser()) {
        return {
            ...storeSettings,
            open_time: storeSettings.openTime,
            close_time: storeSettings.closeTime,
            operational_days: storeSettings.operationalDays.join(',')
        };
    }
    const response = await api.get('/settings.php');
    return response.data;
};

export const saveSettings = async (settingsData) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.post('/settings.php', settingsData);
    return response.data;
};

// Data Management
export const backupData = async (targets) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.post('/data.php', { action: 'backup', targets });
    return response.data;
};

export const restoreData = async (data) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.post('/data.php', { action: 'restore', data });
    return response.data;
};

export const resetData = async (adminId, password) => {
    if (isDemoUser()) return rejectDemo();
    const response = await api.post('/data.php', { action: 'reset', admin_id: adminId, password });
    return response.data;
};

export const checkOrderStatus = async (orderId) => {
    // This is a public call, doesn't need tenant ID header usually, but check-status.php handles it
    const response = await api.get(`/check-status.php?order_id=${orderId}`);
    return response.data;
};

export default api;
