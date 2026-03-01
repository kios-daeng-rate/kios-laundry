import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../data/dummyData';

const Receipt = forwardRef(({ order }, ref) => {
    if (!order) return null;

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // QR data contains order summary
    const qrData = JSON.stringify({
        id: order.id,
        customer: order.customerName,
        total: order.total,
        date: dateStr,
        time: timeStr,
    });

    return (
        <div ref={ref} className="receipt-content bg-white w-[300px] mx-auto p-6 font-mono text-xs text-slate-800">
            {/* Header */}
            <div className="text-center mb-4">
                <h2 className="text-base font-bold tracking-wide">FreshClean Laundry</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Jl. Kenanga No. 88, Jakarta Pusat</p>
                <p className="text-[10px] text-slate-500">Telp: 021-555-1234</p>
            </div>

            <div className="border-t border-dashed border-slate-300 my-3" />

            {/* Order Info */}
            <div className="space-y-1 mb-3">
                <div className="flex justify-between">
                    <span className="text-slate-500">No. Order</span>
                    <span className="font-bold">{order.id}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal</span>
                    <span>{dateStr}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Waktu</span>
                    <span>{timeStr}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Pelanggan</span>
                    <span className="font-semibold">{order.customerName}</span>
                </div>
                {order.customerPhone && (
                    <div className="flex justify-between">
                        <span className="text-slate-500">Telepon</span>
                        <span>{order.customerPhone}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-slate-500">Pembayaran</span>
                    <span>{order.paymentMethod}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-slate-300 my-3" />

            {/* Items */}
            <div className="space-y-2 mb-3">
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                    <span>Item</span>
                    <span>Subtotal</span>
                </div>
                {order.items.map((item, i) => (
                    <div key={i}>
                        <div className="flex justify-between">
                            <span className="font-semibold">{item.name}</span>
                            <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                            {item.qty} {item.unit} × {formatCurrency(item.price)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed border-slate-300 my-3" />

            {/* Total */}
            <div className="flex justify-between text-sm font-bold mb-1">
                <span>TOTAL</span>
                <span>{formatCurrency(order.total)}</span>
            </div>

            {order.notes && (
                <>
                    <div className="border-t border-dashed border-slate-300 my-3" />
                    <div>
                        <span className="text-slate-500">Catatan:</span>
                        <p className="mt-0.5">{order.notes}</p>
                    </div>
                </>
            )}

            <div className="border-t border-dashed border-slate-300 my-3" />

            {/* QR Code */}
            <div className="flex flex-col items-center py-2">
                <QRCodeSVG value={qrData} size={100} level="M" />
                <p className="text-[10px] text-slate-400 mt-2">Scan untuk cek status order</p>
            </div>

            <div className="border-t border-dashed border-slate-300 my-3" />

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-400 space-y-1">
                <p>Terima kasih telah menggunakan</p>
                <p className="font-semibold text-slate-500">FreshClean Laundry</p>
                <p>Simpan struk ini sebagai bukti pengambilan</p>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';
export default Receipt;
