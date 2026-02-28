import React from 'react';
import { useHospital } from '../HospitalContext';
import { TRANSLATIONS, TriageLevel } from '../types';
import { Users, Activity, Bed, AlertCircle, TrendingUp, Clock, User } from 'lucide-react';

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string
}> = ({ label, value, icon, trend, color }) => (
  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
        {React.cloneElement(icon as React.ReactElement, { className: color.replace('bg-', 'text-') })}
      </div>
      {trend && (
        <div className="flex items-center text-emerald-500 text-xs font-bold">
          <TrendingUp size={14} className="mr-1" />
          {trend}
        </div>
      )}
    </div>
    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
    <h3 className="text-2xl font-black text-white">{value}</h3>
  </div>
);

export const Dashboard: React.FC = () => {
  const { patients, wards, language } = useHospital();
  const t = TRANSLATIONS[language];

  const totalPatients = patients.length;
  const criticalPatients = patients.filter(p => p.triageLevel === TriageLevel.CRITICAL && p.status === 'QUEUE').length;
  const totalBeds = wards.reduce((acc, w) => acc + w.capacity, 0);
  const occupiedBeds = wards.reduce((acc, w) => acc + w.occupied, 0);
  const avgWaitTime = "12m"; // Mock stat

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label={t.totalPatients}
          value={totalPatients}
          icon={<Users size={24} />}
          trend="+12%"
          color="bg-emerald-500"
        />
        <StatCard
          label={t.criticalCases}
          value={criticalPatients}
          icon={<AlertCircle size={24} />}
          color="bg-rose-500"
        />
        <StatCard
          label={t.wardManagement}
          value={`${occupiedBeds}/${totalBeds}`}
          icon={<Bed size={24} />}
          color="bg-amber-500"
        />
        <StatCard
          label={t.avgWaitTime}
          value={avgWaitTime}
          icon={<Clock size={24} />}
          trend="-2m"
          color="bg-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <Activity className="text-emerald-500 mr-3" size={20} />
            {t.triageDistribution}
          </h3>
          <div className="flex items-center justify-around h-48">
            {[
              { label: t.critical, count: patients.filter(p => p.triageLevel === TriageLevel.CRITICAL).length, color: 'bg-rose-500' },
              { label: t.urgent, count: patients.filter(p => p.triageLevel === TriageLevel.URGENT).length, color: 'bg-amber-500' },
              { label: t.nonUrgent, count: patients.filter(p => p.triageLevel === TriageLevel.NON_URGENT).length, color: 'bg-emerald-500' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`w-16 rounded-t-lg ${item.color} transition-all duration-1000`}
                  style={{ height: `${(item.count / totalPatients) * 150 + 10}px` }}
                ></div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                <p className="text-sm font-bold text-white">{item.count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <Users className="text-emerald-500 mr-3" size={20} />
            {t.recentAdmissions}
          </h3>
          <div className="space-y-4">
            {patients.filter(p => p.status === 'ADMITTED').slice(-4).reverse().map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mr-3">
                    <User size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{p.wardId} • {t.beds} {p.bedNumber}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{new Date(p.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
