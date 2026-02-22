import React from 'react';
import { useHospital } from '../HospitalContext';
import { TRANSLATIONS } from '../types';
import { Stethoscope, ShieldCheck, Users, Bed, Search, Clock } from 'lucide-react';

export const WardManagement: React.FC = () => {
  const { wards, language } = useHospital();
  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {wards.map(ward => {
          const occupancyRate = (ward.occupied / ward.capacity) * 100;
          return (
            <div key={ward.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                  <Bed className="text-slate-400 group-hover:text-emerald-500" size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                  occupancyRate > 90 ? 'bg-rose-500/10 text-rose-500' :
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
                  className={`h-full transition-all duration-1000 ${
                    occupancyRate > 90 ? 'bg-rose-500' :
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
