import React, { useState } from 'react';
import { useHospital } from '../HospitalContext';
import { ShieldCheck, Lock, User } from 'lucide-react';
import axios from 'axios';
import { TRANSLATIONS } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const LoginScreen: React.FC = () => {
    const { login, language } = useHospital();
    const t = TRANSLATIONS[language];
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { username, password });
            const { token, user } = res.data;

            if (!token || !user) {
                throw new Error('Invalid response from server');
            }

            localStorage.setItem('twpms_token', token);
            await login(user);
        } catch (err: any) {
            console.error('Login Error:', err);
            setError(err.response?.data?.error || err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="text-emerald-500" size={32} />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-white text-center mb-2">{t.securityTitle}</h2>
                <p className="text-slate-500 text-center text-sm mb-8">{t.authenticateContinue}</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block flex items-center"><User size={12} className="mr-2" /> {t.username}</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-emerald-500 transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block flex items-center"><Lock size={12} className="mr-2" /> {t.password}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-emerald-500 transition-all"
                            required
                        />
                    </div>
                    {error && <p className="text-rose-500 text-sm mt-2 font-bold">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-xl shadow-lg mt-6 transition-all disabled:opacity-50"
                    >
                        {loading ? t.authenticating : t.secureLogin}
                    </button>
                </form>
            </div>
        </div>
    );
};

export const PasswordResetScreen: React.FC = () => {
    const { login, logout, language } = useHospital();
    const t = TRANSLATIONS[language];
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            return setError('New passwords do not match');
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('twpms_token');
            const res = await axios.post(`${API_URL}/auth/reset-password`, { currentPassword, newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { token: newToken, user } = res.data;
            localStorage.setItem('twpms_token', newToken);
            login(user);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Password reset failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                        <Lock className="text-amber-500" size={24} />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-white text-center mb-2">{t.actionRequired}</h2>
                <p className="text-slate-500 text-center text-sm mb-8">{t.passwordResetDetail}</p>

                <form onSubmit={handleReset} className="space-y-4">
                    <div>
                        <input type="password" placeholder={t.currentPassword} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-amber-500 transition-all" required />
                    </div>
                    <div>
                        <input type="password" placeholder={t.newPassword} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-amber-500 transition-all" required />
                    </div>
                    <div>
                        <input type="password" placeholder={t.confirmNewPassword} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-amber-500 transition-all" required />
                    </div>
                    {error && <p className="text-rose-500 text-sm mt-2 font-bold">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-4 rounded-xl shadow-lg mt-6 transition-all disabled:opacity-50">
                        {loading ? t.updatingSecurity : t.updatePassword}
                    </button>
                    <button type="button" onClick={logout} className="w-full text-slate-500 hover:text-white text-sm py-2 mt-2">
                        {t.cancelLogout}
                    </button>
                </form>
            </div>
        </div>
    );
};

export const UserSettings: React.FC = () => {
    const { currentUser, language } = useHospital();
    const t = TRANSLATIONS[language];
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            return setMessage({ type: 'error', text: 'New passwords do not match' });
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('twpms_token');
            await axios.post(`${API_URL}/auth/reset-password`, { currentPassword, newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'Password successfully updated!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Password reset failed.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
                <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mr-4">
                        <User className="text-emerald-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{t.myProfile}</h3>
                        <p className="text-sm text-slate-400">{t.manageSecurity}</p>
                    </div>
                </div>

                <div className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-sm text-slate-300"><strong>{t.name}:</strong> {currentUser?.name}</p>
                    <p className="text-sm text-slate-300"><strong>{t.role}:</strong> {currentUser?.role}</p>
                </div>

                <h4 className="text-md font-bold text-white mb-4 flex items-center"><Lock size={16} className="mr-2" /> {t.changePassword}</h4>
                <form onSubmit={handleReset} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2">{t.currentPassword}</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 transition-all" required />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2">{t.newPassword}</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 transition-all" required />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2">{t.confirmNewPassword}</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 transition-all" required />
                    </div>
                    {message && <p className={`text-sm mt-2 font-bold ${message.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>{message.text}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 text-white font-bold p-3 rounded-xl transition-all disabled:opacity-50 mt-4">
                        {loading ? t.save + '...' : t.updatePassword}
                    </button>
                </form>
            </div>
        </div>
    );
};
