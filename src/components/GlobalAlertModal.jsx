import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function GlobalAlertModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('Pemberitahuan');

    useEffect(() => {
        // Override native window.alert
        window.alert = (msg) => {
            setMessage(msg);

            // Auto-detect title based on message content
            if (msg && msg.toLowerCase().includes('demo')) {
                setTitle('Aksi Dinonaktifkan');
            } else if (msg && msg.toLowerCase().includes('gagal')) {
                setTitle('Terjadi Kesalahan');
            } else {
                setTitle('Pemberitahuan');
            }

            setIsOpen(true);
        };

        // Cleanup function is usually good practice, but since we want this
        // to persist throughout the session, we can leave it.
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto'; // Or ''
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const isError = message.toLowerCase().includes('gagal') || message.toLowerCase().includes('error');
    const isDemo = message.toLowerCase().includes('demo');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isDemo ? 'bg-amber-100 text-amber-600' : isError ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {message}
                </p>

                <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                    Mengerti
                </button>
            </div>
        </div>
    );
}
