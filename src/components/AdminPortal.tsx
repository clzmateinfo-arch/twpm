import React from 'react';
import { useHospital } from '../HospitalContext';
import { TRANSLATIONS } from '../types';
import { Stethoscope, ShieldCheck, Users, Bed, Search, Clock, AlertTriangle, UserPlus, Trash2 } from 'lucide-react';
import axios from 'axios';

import { apiService } from '../apiService';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const WardManagement: React.FC = () => {
  const { wards, language } = useHospital();
  const t = TRANSLATIONS[language];
  const [analytics, setAnalytics] = React.useState<any>(null);

  React.useEffect(() => {
    apiService.fetchAnalytics().then(setAnalytics).catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center">
            <Users className="text-emerald-500 mr-4" size={32} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Patients</p>
              <p className="text-2xl font-bold text-white">{analytics.total}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center">
            <Clock className="text-amber-500 mr-4" size={32} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">In Queue</p>
              <p className="text-2xl font-bold text-white">{analytics.inQueue}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center">
            <Bed className="text-blue-500 mr-4" size={32} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Admitted</p>
              <p className="text-2xl font-bold text-white">{analytics.admitted}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center">
            <Users className="text-purple-500 mr-4" size={32} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Discharged</p>
              <p className="text-2xl font-bold text-white">{analytics.discharged}</p>
            </div>
          </div>
        </div>
      )}

      {/* Predictive & Capacity Warnings */}
      {wards.some(w => (w.occupied / w.capacity) >= 0.8) && (
        <div className="bg-rose-900/20 border border-rose-500/50 p-6 rounded-2xl flex items-start mt-8">
          <AlertTriangle className="text-rose-500 mr-4 mt-1 flex-shrink-0" size={24} />
          <div>
            <h4 className="text-rose-500 font-bold mb-2">Capacity Warning & Predictive Alert</h4>
            <p className="text-sm text-rose-200">
              One or more wards are operating at critically high capacity (&ge;80%). Based on current admission rates and average lengths of stay, you may face a bed shortage within the next 12-24 hours. Consider expediting discharges or halting non-critical admissions.
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-rose-300">
              {wards.filter(w => (w.occupied / w.capacity) >= 0.8).map(w => (
                <li key={w.id}>
                  <strong>{w.name}</strong> is at {Math.round((w.occupied / w.capacity) * 100)}% capacity ({w.occupied}/{w.capacity} beds).
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Email Configurations Mock */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl mt-8">
        <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">System Alerts Configuration</h4>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Alert Dest. Email</label>
            <input type="email" defaultValue="admin@twpms.local" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white" />
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-lg transition-all text-sm h-10">
            Save Config
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {wards.map(ward => {
          const occupancyRate = (ward.occupied / ward.capacity) * 100;
          return (
            <div key={ward.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                  <Bed className="text-slate-400 group-hover:text-emerald-500" size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${occupancyRate > 90 ? 'bg-rose-500/10 text-rose-500' :
                  occupancyRate > 70 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                  {ward.type}
                </span>
              </div>
              <h4 className="text-white font-bold mb-1">{ward.name}</h4>
              <p className="text-xs text-slate-500 mb-6">{t.beds}: {ward.occupied} / {ward.capacity}</p>

              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-1000 ${occupancyRate > 90 ? 'bg-rose-500' :
                    occupancyRate > 70 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>{t.occupancy}</span>
                <span>{Math.round(occupancyRate)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6">Ward Occupancy Overview</h3>
        <div className="h-64 flex items-end justify-around px-4">
          {wards.map(ward => (
            <div key={ward.id} className="flex flex-col items-center w-full max-w-[100px]">
              <div
                className="w-12 bg-emerald-500/20 border-t-4 border-emerald-500 rounded-t-lg transition-all duration-1000"
                style={{ height: `${(ward.occupied / ward.capacity) * 200}px` }}
              ></div>
              <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-center">{ward.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AuditTrail: React.FC = () => {
  const { auditLogs, language } = useHospital();
  const t = TRANSLATIONS[language];
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredLogs = auditLogs.filter(log =>
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <ShieldCheck className="text-emerald-500 mr-3" size={20} />
          <h3 className="text-lg font-bold text-white">{t.auditTrail}</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all w-full md:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">User</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Action</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center text-xs text-slate-400">
                    <Clock size={12} className="mr-2" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center mr-2">
                      <Users size={12} className="text-emerald-500" />
                    </div>
                    <span className="text-xs font-bold text-white">{log.userName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-300 px-2 py-1 rounded">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-slate-400 max-w-xs truncate">{log.details}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const UserManagement: React.FC = () => {
  const { currentUser } = useHospital();
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formData, setFormData] = React.useState({ name: '', username: '', role: 'NURSE' });
  const [tempCreds, setTempCreds] = React.useState<{ username: string, tempPassword: string } | null>(null);
  const [error, setError] = React.useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('twpms_token');
      const res = await axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (currentUser?.role === 'ADMIN') fetchUsers();
  }, [currentUser]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTempCreds(null);
    try {
      const token = localStorage.getItem('twpms_token');
      const res = await axios.post(`${API_URL}/users`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setTempCreds({ username: res.data.username, tempPassword: res.data.tempPassword });
      setFormData({ name: '', username: '', role: 'NURSE' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      const token = localStorage.getItem('twpms_token');
      await axios.delete(`${API_URL}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to deactivate user');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mr-4">
          <UserPlus className="text-purple-500" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">System User Management</h3>
          <p className="text-sm text-slate-400">Create and manage staff accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <h4 className="text-md font-bold text-white">Provision New Account</h4>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2">Full Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2">Username</label>
              <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2">System Role</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                <option value="NURSE">Nurse</option>
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            {error && <p className="text-sm text-rose-500">{error}</p>}

            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-lg transition-all mt-4">
              Create Account
            </button>
          </form>

          {tempCreds && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <h5 className="text-emerald-500 font-bold mb-2 flex items-center"><ShieldCheck size={16} className="mr-2" /> Credentials Generated</h5>
              <p className="text-sm text-slate-300 mb-1">Username: <span className="font-mono text-white ml-2">{tempCreds.username}</span></p>
              <p className="text-sm text-slate-300">Temp Password: <span className="font-mono text-white bg-slate-950 px-2 py-1 rounded ml-2">{tempCreds.tempPassword}</span></p>
              <p className="text-xs text-amber-500 mt-3 flex items-center"><AlertTriangle size={12} className="mr-1" /> Make sure to copy this password now. It will not be shown again.</p>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h4 className="text-md font-bold text-white mb-6">Active Staff Directory</h4>

          {loading ? (
            <p className="text-slate-500 italic">Loading directory...</p>
          ) : (
            <div className="space-y-3">
              {users.map((u, i) => (
                <div key={i} className={`flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 ${!u.active ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 text-white font-bold
                                            ${u.role === 'ADMIN' ? 'bg-purple-600' : u.role === 'DOCTOR' ? 'bg-amber-600' : 'bg-emerald-600'}
                                        `}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{u.name} {u.id === currentUser?.id ? '(You)' : ''}</p>
                      <p className="text-xs text-slate-400">@{u.username} • {u.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest rounded ${u.active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                      {u.active ? 'Active' : 'Disabled'}
                    </span>
                    {u.id !== currentUser?.id && u.active && (
                      <button onClick={() => handleDeactivate(u.id)} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all" title="Deactivate User">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
