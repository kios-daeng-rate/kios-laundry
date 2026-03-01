import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, User, Lock, LogIn, AlertCircle, Loader2, Eye, EyeOff, CheckCircle, UserPlus, ArrowRight, ArrowLeft, Store } from 'lucide-react';
import { login, register, verifyOtp, resendOtp } from '../services/api';

export default function Login({ onLogin, settings }) {
    const [isLoginView, setIsLoginView] = useState(true);

    // Login State
    const [loginTenantCode, setLoginTenantCode] = useState(localStorage.getItem('lastTenantCode') || '');
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register (Daftar Toko Baru) State
    const [regStoreName, setRegStoreName] = useState('');
    const [regStoreSlug, setRegStoreSlug] = useState('');
    const [regAdminName, setRegAdminName] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regEmail, setRegEmail] = useState('');

    // OTP Step
    const [otpStep, setOtpStep] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [pendingSlug, setPendingSlug] = useState('');
    const [pendingMaskedEmail, setPendingMaskedEmail] = useState('');

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);

    // Generate slug otomatis dari nama toko
    useEffect(() => {
        const slug = regStoreName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
        setRegStoreSlug(slug);
    }, [regStoreName]);

    // Reset messages on toggle
    useEffect(() => {
        setError('');
        setSuccessMsg('');
    }, [isLoginView]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const data = await login(loginUsername, loginPassword, loginTenantCode);
            if (data.user) {
                localStorage.setItem('lastTenantCode', loginTenantCode);
                onLogin(data.user);
                navigate(data.user.role === 'admin' ? '/' : '/new-order');
            }
        } catch (err) {
            const d = err.response?.data;
            if (d?.unverified) {
                setPendingSlug(d.tenant_slug);
                setIsLoginView(false);
                setOtpStep(true);
                setError('Akun belum diverifikasi. Masukkan kode OTP dari email Anda.');
            } else {
                setError(d?.error || 'Koneksi ke server gagal. Pastikan sudah install.php');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await register({
                store_name: regStoreName,
                store_slug: regStoreSlug,
                admin_name: regAdminName,
                admin_username: regUsername,
                password: regPassword,
                email: regEmail,
            });
            setPendingSlug(res.tenant_slug);
            setPendingMaskedEmail(res.email_masked || regEmail);
            setOtpStep(true);
            setSuccessMsg(`Kode OTP dikirim ke ${res.email_masked}. Berlaku 10 menit.`);
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal mendaftarkan toko. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await verifyOtp(pendingSlug, otpCode);
            setOtpStep(false);
            setIsLoginView(true);
            setLoginTenantCode(pendingSlug);
            setSuccessMsg('Email terverifikasi! Toko siap digunakan. Silakan login.');
            setRegStoreName(''); setRegStoreSlug(''); setRegAdminName('');
            setRegUsername(''); setRegPassword(''); setRegEmail(''); setOtpCode('');
        } catch (err) {
            setError(err.response?.data?.error || 'Kode OTP salah atau kadaluarsa.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setIsLoading(true);
        try {
            const res = await resendOtp(pendingSlug);
            setSuccessMsg(res.message || 'OTP baru telah dikirim.');
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal mengirim ulang OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    // Shared input style
    const inputCls = "w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all";
    const inputClsRight = "w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden min-h-[680px] md:min-h-[630px] flex flex-col md:flex-row transition-all duration-300">

                {/* === MOBILE VIEW ONLY === */}
                <div className="md:hidden flex flex-col w-full min-h-[680px]">
                    <div className="bg-primary-600 text-white p-8 text-center relative overflow-hidden rounded-b-[40px] shadow-lg">
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-inner">
                                {settings?.brand_logo ? (
                                    <img src={settings.brand_logo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Droplets className="w-8 h-8 text-primary-600" />
                                )}
                            </div>
                            <h1 className="text-2xl font-bold mb-1">{settings?.store_name || 'FreshClean POS'}</h1>
                            <p className="text-primary-100 text-sm mb-4">
                                {isLoginView ? 'Silakan login untuk melanjutkan' : 'Daftar toko laundry baru Anda'}
                            </p>
                        </div>
                    </div>

                    <div className="p-8 flex-1 bg-white overflow-y-auto">
                        {isLoginView ? (
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                {successMsg && <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {successMsg}</div>}
                                {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm mb-2">{error}</div>}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Kode Toko</label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" value={loginTenantCode} onChange={(e) => setLoginTenantCode(e.target.value)} className={inputCls} required placeholder="Contoh: toko-utama" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className={inputCls} required placeholder="Username" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type={showPassword ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputClsRight} required placeholder="Password" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl mt-2">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-4 h-4" /> Masuk</>}
                                </button>
                                <div className="text-center mt-4">
                                    <p className="text-sm text-slate-500">Belum punya toko? <button type="button" onClick={() => setIsLoginView(false)} className="text-primary-600 font-semibold">Daftar Sekarang</button></p>
                                </div>
                            </form>
                        ) : otpStep ? (
                            /* === Step OTP Mobile === */
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="text-center mb-4">
                                    <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <span className="text-3xl">📧</span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg">Verifikasi Email</h3>
                                    <p className="text-sm text-slate-500 mt-1">Kode OTP dikirim ke<br /><strong className="text-primary-600">{pendingMaskedEmail}</strong></p>
                                </div>
                                {successMsg && <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {successMsg}</div>}
                                {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Kode OTP 6 Digit</label>
                                    <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-full py-3 text-center text-3xl font-bold tracking-[0.5em] border-2 border-primary-200 rounded-xl focus:outline-none focus:border-primary-500" placeholder="------" required />
                                </div>
                                <button type="submit" disabled={isLoading || otpCode.length < 6} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl disabled:opacity-50">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Verifikasi</>}
                                </button>
                                <div className="text-center">
                                    <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-sm text-slate-500">Tidak dapat kode? <span className="text-primary-600 font-semibold">Kirim Ulang</span></button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleRegisterSubmit} className="space-y-3">
                                {successMsg && <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {successMsg}</div>}
                                {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Nama Toko</label>
                                    <div className="relative"><Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={regStoreName} onChange={(e) => setRegStoreName(e.target.value)} className={inputCls} required placeholder="Contoh: Laundry Bersih" /></div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Kode Toko <span className="text-slate-400 font-normal">(otomatis)</span></label>
                                    <div className="relative"><Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={regStoreSlug} onChange={(e) => setRegStoreSlug(e.target.value)} className={inputCls} required placeholder="laundry-bersih" /></div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Nama Admin</label>
                                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={regAdminName} onChange={(e) => setRegAdminName(e.target.value)} className={inputCls} required placeholder="Nama lengkap" /></div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Username Admin</label>
                                    <div className="relative"><UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className={inputCls} required placeholder="Username untuk login" autoComplete="off" /></div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Email Admin</label>
                                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={inputCls} required placeholder="email@contoh.com" autoComplete="email" /></div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type={showRegPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={inputClsRight} required placeholder="Password" autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl mt-2">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Daftar Toko</>}
                                </button>
                                <div className="text-center mt-4">
                                    <p className="text-sm text-slate-500">Sudah punya akun? <button type="button" onClick={() => setIsLoginView(true)} className="text-primary-600 font-semibold">Masuk</button></p>
                                </div>
                            </form>
                        )}
                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <button onClick={() => { onLogin({ id: 'demo', username: 'demo', name: 'Akun Demo', role: 'demo', tenant_id: 0 }); navigate('/'); }} className="text-sm font-medium text-slate-500">Coba fitur? <span className="font-semibold text-primary-600">Login Demo</span></button>
                        </div>
                    </div>
                </div>

                {/* === DESKTOP VIEW (Sliding Animation) === */}

                {/* 1. REGISTER / OTP FORM (Left Side) */}
                <div className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full bg-white flex-col p-10 overflow-y-auto transition-all duration-700 ease-in-out ${isLoginView ? 'opacity-0 translate-x-[20%] pointer-events-none z-0' : 'opacity-100 translate-x-0 z-10'}`}>
                    {otpStep ? (
                        /* === Step OTP Desktop === */
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                                <span className="text-4xl">📧</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">Cek Email Anda</h2>
                            <p className="text-slate-500 text-sm text-center mb-6">Kode OTP 6 digit telah dikirim ke<br /><strong className="text-primary-600">{pendingMaskedEmail}</strong></p>
                            {successMsg && (<div className="w-full p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center gap-2 mb-3"><CheckCircle className="w-4 h-4 shrink-0" />{successMsg}</div>)}
                            {error && (<div className="w-full p-3 bg-red-50 text-red-600 rounded-xl text-sm mb-3">{error}</div>)}
                            <form onSubmit={handleVerifyOtp} className="w-full space-y-4">
                                <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-full py-4 text-center text-4xl font-bold tracking-[0.6em] border-2 border-primary-200 rounded-xl focus:outline-none focus:border-primary-500 transition-all" placeholder="------" required />
                                <button type="submit" disabled={isLoading || otpCode.length < 6} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/30">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Verifikasi Email</>}
                                </button>
                                <div className="text-center">
                                    <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-sm text-slate-500 hover:text-primary-600 transition-colors">Tidak menerima kode? <span className="font-semibold text-primary-600">Kirim Ulang</span></button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800 mb-1">Daftar Toko Baru</h2>
                                <p className="text-slate-500 text-sm">Isi data toko dan akun admin Anda</p>
                            </div>

                            <form onSubmit={handleRegisterSubmit} className="space-y-4" autoComplete="off">
                                {successMsg && (<div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center gap-2 animate-in fade-in"><CheckCircle className="w-4 h-4 shrink-0" />{successMsg}</div>)}
                                {error && (<div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-in fade-in"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>)}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-semibold text-slate-700">Nama Toko</label>
                                        <div className="relative"><Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={regStoreName} onChange={(e) => setRegStoreName(e.target.value)} placeholder="Laundry Bersih" className={inputCls} required disabled={isLoading} /></div>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-semibold text-slate-700">Kode Toko <span className="text-slate-400 font-normal">(untuk login)</span></label>
                                        <div className="relative"><Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={regStoreSlug} onChange={(e) => setRegStoreSlug(e.target.value)} placeholder="laundry-bersih" className={inputCls} required disabled={isLoading} /></div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-700">Nama Admin</label>
                                        <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={regAdminName} onChange={(e) => setRegAdminName(e.target.value)} placeholder="Nama lengkap" className={inputCls} required disabled={isLoading} /></div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-700">Username Admin</label>
                                        <div className="relative"><UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="Username" className={inputCls} required disabled={isLoading} autoComplete="off" /></div>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-semibold text-slate-700">Email Admin <span className="text-slate-400 font-normal">(untuk verifikasi)</span></label>
                                        <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="email@contoh.com" className={inputCls} required disabled={isLoading} autoComplete="email" /></div>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-semibold text-slate-700">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type={showRegPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Password" className={inputClsRight} required disabled={isLoading} autoComplete="new-password" />
                                            <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all active:scale-[0.98] shadow-lg shadow-primary-500/30">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Daftar Toko</>}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                {/* 2. LOGIN FORM (Right Side) */}
                <div className={`hidden md:flex absolute top-0 right-0 w-1/2 h-full bg-white flex-col justify-center p-12 transition-all duration-700 ease-in-out ${!isLoginView ? 'opacity-0 -translate-x-[20%] pointer-events-none z-0' : 'opacity-100 translate-x-0 z-10'}`}>
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm overflow-hidden">
                            {settings?.brand_logo ? (<img src={settings.brand_logo} alt="Logo" className="w-full h-full object-cover" />) : (
                                <div className="w-full h-full bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center"><Droplets className="w-8 h-8 text-white" /></div>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-1">{settings?.store_name || 'FreshClean POS'}</h1>
                        <p className="text-slate-500 text-sm">Selamat datang kembali</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
                        {successMsg && (<div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center gap-2 animate-in fade-in"><CheckCircle className="w-4 h-4 shrink-0" />{successMsg}</div>)}
                        {error && (<div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-in fade-in"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>)}

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Kode Toko</label>
                            <div className="relative"><Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={loginTenantCode} onChange={(e) => setLoginTenantCode(e.target.value)} placeholder="Contoh: toko-utama" className={inputCls} required disabled={isLoading} autoComplete="off" /></div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Username</label>
                            <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="Masukkan username" className={inputCls} required disabled={isLoading} autoComplete="off" /></div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type={showPassword ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Masukkan password" className={inputClsRight} required disabled={isLoading} autoComplete="new-password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all active:scale-[0.98] mt-4 shadow-lg shadow-primary-500/30">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-4 h-4" /> Masuk</>}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <button onClick={() => { onLogin({ id: 'demo', username: 'demo', name: 'Akun Demo', role: 'demo', tenant_id: 0 }); navigate('/'); }} className="text-sm font-medium text-slate-500 transition-colors">Coba fitur? <span className="font-semibold text-primary-600 hover:underline">Login Demo</span></button>
                    </div>
                </div>

                {/* 3. BLUE OVERLAY PANEL (Slides over forms) */}
                <div className={`hidden md:block absolute top-0 left-0 w-1/2 h-full bg-primary-600 text-white overflow-hidden transition-transform duration-700 ease-in-out z-20 rounded-3xl shadow-2xl ${!isLoginView ? 'translate-x-full' : 'translate-x-0'}`}>
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-accent-400/20 rounded-full blur-2xl"></div>

                    {/* Content for Login View */}
                    <div className={`absolute inset-0 p-12 flex flex-col justify-center transition-all duration-500 ${!isLoginView ? 'opacity-0 -translate-x-12 pointer-events-none' : 'opacity-100 translate-x-0 delay-200'}`}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-inner"><Droplets className="w-6 h-6 text-white" /></div>
                            <h2 className="text-3xl font-bold tracking-tight">FreshClean</h2>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 leading-tight">Solusi Manajemen<br /><span className="text-accent-300">Laundry Digital</span></h3>
                        <p className="text-primary-100 mb-8 text-sm leading-relaxed">Tingkatkan efisiensi bisnis laundry Anda dengan aplikasi kasir modern yang mudah digunakan.</p>
                        <ul className="space-y-3 mb-10">
                            {['Manajemen Pesanan & Status Cepat', 'Laporan Keuangan Otomatis', 'Multi-Toko, Satu Platform', 'Sistem Multi-Pengguna'].map((fitur, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm font-medium text-primary-50">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-400/20 flex items-center justify-center"><CheckCircle className="w-3 h-3 text-accent-300" /></div>
                                    {fitur}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setIsLoginView(false)} className="w-full md:w-fit px-8 py-3 rounded-xl border-2 border-white/50 text-white font-semibold hover:bg-white hover:text-primary-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                            Daftar Toko Baru <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Content for Register View */}
                    <div className={`absolute inset-0 p-12 flex flex-col justify-center items-center text-center transition-all duration-500 ${isLoginView ? 'opacity-0 translate-x-12 pointer-events-none' : 'opacity-100 translate-x-0 delay-200'}`}>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm shadow-inner"><Store className="w-8 h-8 text-white" /></div>
                        <h3 className="text-2xl font-bold mb-4">Sudah Punya Akun?</h3>
                        <p className="text-primary-100 mb-8 max-w-sm">Jika Anda sudah terdaftar, masukkan kode toko dan username Anda untuk masuk ke dashboard.</p>
                        <button onClick={() => setIsLoginView(true)} className="px-8 py-3 rounded-xl border-2 border-white/50 text-white font-semibold hover:bg-white hover:text-primary-600 transition-all active:scale-[0.98] flex items-center gap-2 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali untuk Masuk
                        </button>
                    </div>
                </div>

            </div>

            {/* Footer Attribution */}
            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <p className="text-slate-400 text-xs font-medium tracking-wide">
                    Powered by <span className="text-primary-600 font-bold">Kios Daeng Rate</span> with AI &copy; 2026
                </p>
            </div>
        </div >
    );
}
