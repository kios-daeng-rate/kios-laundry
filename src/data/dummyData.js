// ============================================
// DUMMY DATA - Laundry POS Application
// ============================================

export const users = [
    { id: 1, username: 'admin', password: 'password', name: 'Admin Utama', role: 'admin' },
    { id: 2, username: 'kasir', password: 'password', name: 'Kasir Satu', role: 'karyawan' },
];
// ============================================

export const services = [
    { id: 1, name: 'Cuci Kering', price: 7000, unit: 'kg', estimasi: '2 hari', category: 'Regular', icon: '👕' },
    { id: 2, name: 'Cuci Setrika', price: 10000, unit: 'kg', estimasi: '3 hari', category: 'Regular', icon: '👔' },
    { id: 3, name: 'Setrika Saja', price: 5000, unit: 'kg', estimasi: '1 hari', category: 'Regular', icon: '🧹' },
    { id: 4, name: 'Cuci Express', price: 15000, unit: 'kg', estimasi: '6 jam', category: 'Express', icon: '⚡' },
    { id: 5, name: 'Cuci Setrika Express', price: 20000, unit: 'kg', estimasi: '1 hari', category: 'Express', icon: '🚀' },
    { id: 6, name: 'Dry Clean', price: 25000, unit: 'pcs', estimasi: '3 hari', category: 'Premium', icon: '✨' },
    { id: 7, name: 'Cuci Sepatu', price: 35000, unit: 'pasang', estimasi: '3 hari', category: 'Spesial', icon: '👟' },
    { id: 8, name: 'Cuci Karpet', price: 15000, unit: 'kg', estimasi: '4 hari', category: 'Spesial', icon: '🧶' },
    { id: 9, name: 'Cuci Bed Cover', price: 30000, unit: 'pcs', estimasi: '3 hari', category: 'Spesial', icon: '🛏️' },
    { id: 10, name: 'Cuci Jas', price: 30000, unit: 'pcs', estimasi: '3 hari', category: 'Premium', icon: '🤵' },
];

export const customers = [
    { id: 1, name: 'Budi Santoso', phone: '081234567890', address: 'Jl. Merdeka No. 12, Jakarta', totalOrders: 15, totalSpent: 750000, joinDate: '2025-08-15' },
    { id: 2, name: 'Siti Rahayu', phone: '081345678901', address: 'Jl. Sudirman No. 45, Jakarta', totalOrders: 22, totalSpent: 1200000, joinDate: '2025-06-20' },
    { id: 3, name: 'Ahmad Hidayat', phone: '081456789012', address: 'Jl. Gatot Subroto No. 8, Bandung', totalOrders: 8, totalSpent: 450000, joinDate: '2025-10-05' },
    { id: 4, name: 'Dewi Lestari', phone: '081567890123', address: 'Jl. Diponegoro No. 33, Surabaya', totalOrders: 30, totalSpent: 1800000, joinDate: '2025-03-10' },
    { id: 5, name: 'Rizki Pratama', phone: '081678901234', address: 'Jl. Pahlawan No. 7, Yogyakarta', totalOrders: 5, totalSpent: 250000, joinDate: '2025-12-01' },
    { id: 6, name: 'Nina Marlina', phone: '081789012345', address: 'Jl. Ahmad Yani No. 22, Semarang', totalOrders: 12, totalSpent: 680000, joinDate: '2025-09-18' },
    { id: 7, name: 'Hendra Wijaya', phone: '081890123456', address: 'Jl. Veteran No. 15, Malang', totalOrders: 18, totalSpent: 950000, joinDate: '2025-07-25' },
    { id: 8, name: 'Fitri Handayani', phone: '081901234567', address: 'Jl. Kartini No. 9, Denpasar', totalOrders: 3, totalSpent: 180000, joinDate: '2026-01-08' },
];

const statuses = ['Baru', 'Diproses', 'Dicuci', 'Disetrika', 'Selesai', 'Diambil'];

export const orders = [
    { id: 'ORD-2026-001', customerId: 1, customerName: 'Budi Santoso', serviceId: 2, serviceName: 'Cuci Setrika', weight: 3.5, total: 35000, status: 'Diambil', date: '2026-02-18', pickupDate: '2026-02-21', paymentMethod: 'Cash', notes: '' },
    { id: 'ORD-2026-002', customerId: 2, customerName: 'Siti Rahayu', serviceId: 1, serviceName: 'Cuci Kering', weight: 5, total: 35000, status: 'Diambil', date: '2026-02-18', pickupDate: '2026-02-20', paymentMethod: 'Transfer', notes: 'Pisahkan warna terang dan gelap' },
    { id: 'ORD-2026-003', customerId: 4, customerName: 'Dewi Lestari', serviceId: 5, serviceName: 'Cuci Setrika Express', weight: 2, total: 40000, status: 'Selesai', date: '2026-02-19', pickupDate: '2026-02-20', paymentMethod: 'QRIS', notes: '' },
    { id: 'ORD-2026-004', customerId: 3, customerName: 'Ahmad Hidayat', serviceId: 7, serviceName: 'Cuci Sepatu', weight: 1, total: 35000, status: 'Selesai', date: '2026-02-19', pickupDate: '2026-02-22', paymentMethod: 'Cash', notes: '2 pasang sneakers' },
    { id: 'ORD-2026-005', customerId: 7, customerName: 'Hendra Wijaya', serviceId: 2, serviceName: 'Cuci Setrika', weight: 4, total: 40000, status: 'Disetrika', date: '2026-02-20', pickupDate: '2026-02-23', paymentMethod: 'Cash', notes: '' },
    { id: 'ORD-2026-006', customerId: 6, customerName: 'Nina Marlina', serviceId: 9, serviceName: 'Cuci Bed Cover', weight: 1, total: 30000, status: 'Dicuci', date: '2026-02-21', pickupDate: '2026-02-24', paymentMethod: 'Transfer', notes: 'Bed cover ukuran king' },
    { id: 'ORD-2026-007', customerId: 1, customerName: 'Budi Santoso', serviceId: 4, serviceName: 'Cuci Express', weight: 2.5, total: 37500, status: 'Dicuci', date: '2026-02-22', pickupDate: '2026-02-22', paymentMethod: 'QRIS', notes: 'Urgent, butuh hari ini' },
    { id: 'ORD-2026-008', customerId: 5, customerName: 'Rizki Pratama', serviceId: 2, serviceName: 'Cuci Setrika', weight: 6, total: 60000, status: 'Diproses', date: '2026-02-23', pickupDate: '2026-02-26', paymentMethod: 'Cash', notes: '' },
    { id: 'ORD-2026-009', customerId: 2, customerName: 'Siti Rahayu', serviceId: 6, serviceName: 'Dry Clean', weight: 2, total: 50000, status: 'Diproses', date: '2026-02-23', pickupDate: '2026-02-26', paymentMethod: 'Transfer', notes: 'Gaun pesta dan blazer' },
    { id: 'ORD-2026-010', customerId: 8, customerName: 'Fitri Handayani', serviceId: 1, serviceName: 'Cuci Kering', weight: 4, total: 28000, status: 'Baru', date: '2026-02-24', pickupDate: '2026-02-26', paymentMethod: 'Cash', notes: '' },
    { id: 'ORD-2026-011', customerId: 4, customerName: 'Dewi Lestari', serviceId: 10, serviceName: 'Cuci Jas', weight: 1, total: 30000, status: 'Baru', date: '2026-02-24', pickupDate: '2026-02-27', paymentMethod: 'QRIS', notes: 'Jas hitam formal' },
    { id: 'ORD-2026-012', customerId: 7, customerName: 'Hendra Wijaya', serviceId: 8, serviceName: 'Cuci Karpet', weight: 3, total: 45000, status: 'Baru', date: '2026-02-24', pickupDate: '2026-02-28', paymentMethod: 'Cash', notes: 'Karpet bulu tebal' },
];

export const revenueData7Days = [
    { day: 'Sen', revenue: 185000 },
    { day: 'Sel', revenue: 220000 },
    { day: 'Rab', revenue: 150000 },
    { day: 'Kam', revenue: 310000 },
    { day: 'Jum', revenue: 280000 },
    { day: 'Sab', revenue: 420000 },
    { day: 'Min', revenue: 190000 },
];

export const revenueData12Bulan = [
    { name: 'Mar', pendapatan: 3800000, minggu1: 950000, minggu2: 850000, minggu3: 1000000, minggu4: 1000000 },
    { name: 'Apr', pendapatan: 4100000, minggu1: 1100000, minggu2: 900000, minggu3: 1050000, minggu4: 1050000 },
    { name: 'Mei', pendapatan: 5500000, minggu1: 1500000, minggu2: 1200000, minggu3: 1300000, minggu4: 1500000 },
    { name: 'Jun', pendapatan: 4900000, minggu1: 1200000, minggu2: 1100000, minggu3: 1400000, minggu4: 1200000 },
    { name: 'Jul', pendapatan: 5200000, minggu1: 1300000, minggu2: 1300000, minggu3: 1200000, minggu4: 1400000 },
    { name: 'Agt', pendapatan: 5700000, minggu1: 1500000, minggu2: 1400000, minggu3: 1300000, minggu4: 1500000 },
    { name: 'Sep', pendapatan: 4500000, minggu1: 1100000, minggu2: 1200000, minggu3: 1100000, minggu4: 1100000 },
    { name: 'Okt', pendapatan: 5200000, minggu1: 1300000, minggu2: 1300000, minggu3: 1300000, minggu4: 1300000 },
    { name: 'Nov', pendapatan: 4800000, minggu1: 1200000, minggu2: 1200000, minggu3: 1100000, minggu4: 1300000 },
    { name: 'Des', pendapatan: 6100000, minggu1: 1600000, minggu2: 1500000, minggu3: 1400000, minggu4: 1600000 },
    { name: 'Jan', pendapatan: 5800000, minggu1: 1450000, minggu2: 1450000, minggu3: 1500000, minggu4: 1400000 },
    { name: 'Feb', pendapatan: 4200000, minggu1: 1000000, minggu2: 1100000, minggu3: 1050000, minggu4: 1050000 },
];

export const storeSettings = {
    name: 'FreshClean Laundry',
    address: 'Jl. Kenanga No. 88, Kelurahan Menteng, Jakarta Pusat',
    phone: '021-555-1234',
    openTime: '07:00',
    closeTime: '21:00',
    operationalDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
};

// Helper functions
export const getStatusColor = (status) => {
    const colors = {
        'Baru': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
        'Diproses': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
        'Dicuci': { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
        'Disetrika': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
        'Selesai': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        'Diambil': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
    };
    return colors[status] || colors['Baru'];
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};
