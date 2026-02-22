import React, { useState } from 'react';
import { useHospital } from '../HospitalContext';
import { Patient, TriageLevel, TRANSLATIONS } from '../types';
import { ClipboardList, User, Activity, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TriageBadge: React.FC<{ level: TriageLevel }> = ({ level }) => {
  const colors = {
    [TriageLevel.CRITICAL]: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    [TriageLevel.URGENT]: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    [TriageLevel.NON_URGENT]: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };
  return (
    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border rounded-full ${colors[level]}`}>
      {level}
    </span>
  );
};

export const PriorityQueue: React.FC<{ onSelectPatient: (p: Patient) => void }> = ({ onSelectPatient }) => {
  const { patients, language } = useHospital();
  const t = TRANSLATIONS[language];

  const queue = patients
    .filter(p => p.status === 'QUEUE')
    .sort((a, b) => {
      const priority = { [TriageLevel.CRITICAL]: 0, [TriageLevel.URGENT]: 1, [TriageLevel.NON_URGENT]: 2 };
      return priority[a.triageLevel] - priority[b.triageLevel];
    });

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center">
          <ClipboardList className="text-emerald-500 mr-3" size={20} />
          <h3 className="text-lg font-bold text-white">{t.priorityQueue}</h3>
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{queue.length} Patients Waiting</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Priority</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Patient</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Symptoms</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Vitals</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {queue.map(p => (
              <tr key={p.id} className="hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4">
                  <TriageBadge level={p.triageLevel} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mr-3 group-hover:bg-emerald-500/20 transition-colors">
                      <User size={16} className="text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {p.symptoms.map((s, i) => (
                      <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-4 text-[10px] font-bold">
                    <span className={p.vitals?.spo2 && p.vitals.spo2 < 92 ? 'text-rose-500' : 'text-emerald-500'}>
                      SpO2: {p.vitals?.spo2}%
                    </span>
                    <span className={p.vitals?.temperature && p.vitals.temperature > 38 ? 'text-rose-500' : 'text-slate-400'}>
                      T: {p.vitals?.temperature}°C
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => onSelectPatient(p)}
                    className="p-2 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white rounded-lg transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No patients in queue</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const PatientDetailView: React.FC<{ patient: Patient; onClose: () => void }> = ({ patient, onClose }) => {
  const { addConsultationNotes, admitPatient, wards, language } = useHospital();
  const t = TRANSLATIONS[language];
  const [notes, setNotes] = useState(patient.consultationNotes || '');
  const [selectedWard, setSelectedWard] = useState('');

  const isRedFlag = patient.vitals && (patient.vitals.spo2 < 90 || patient.vitals.bpSystolic < 90);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mr-4">
              <User className="text-emerald-500" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{patient.name}</h3>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-xs text-slate-500 uppercase tracking-widest">{patient.id}</span>
                <TriageBadge level={patient.triageLevel} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronRight size={24} className="rotate-180 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Red Flag Alert */}
            {isRedFlag && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center animate-pulse">
                <AlertTriangle className="text-rose-500 mr-4" size={32} />
                <div>
                  <h4 className="text-rose-500 font-black uppercase tracking-tighter">Red Flag Alert</h4>
                  <p className="text-xs text-rose-500/80 font-medium">Critical vital signs detected. Immediate intervention required.</p>
                </div>
              </div>
            )}

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: t.temp, value: `${patient.vitals?.temperature}°C`, icon: <Activity size={16} /> },
                { label: t.pulse, value: `${patient.vitals?.pulse} bpm`, icon: <Activity size={16} /> },
                { label: t.spo2, value: `${patient.vitals?.spo2}%`, icon: <Activity size={16} /> },
                { label: 'BP', value: `${patient.vitals?.bpSystolic}/${patient.vitals?.bpDiastolic}`, icon: <Activity size={16} /> },
                { label: t.rr, value: `${patient.vitals?.respiratoryRate}`, icon: <Activity size={16} /> },
                { label: 'Gender', value: patient.gender, icon: <User size={16} /> },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Symptoms */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center">
                <FileText size={14} className="mr-2" /> {t.symptoms}
              </h4>
              <div className="flex flex-wrap gap-2">
                {patient.symptoms.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-900 text-slate-300 rounded-lg text-sm font-medium border border-slate-700">{s}</span>
                ))}
              </div>
            </div>

            {/* Consultation Notes */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center">
                <ClipboardList size={14} className="mr-2" /> {t.notes}
              </h4>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all h-40"
                placeholder="Enter clinical findings and treatment plan..."
              />
              <button 
                onClick={() => addConsultationNotes(patient.id, notes)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-all"
              >
                {t.save} Notes
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Ward Allocation */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">{t.wardManagement}</h4>
              <div className="space-y-4">
                <select
                  value={selectedWard}
                  onChange={e => setSelectedWard(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                >
                  <option value="">Select Ward</option>
                  {wards.map(w => (
                    <option key={w.id} value={w.id} disabled={w.occupied >= w.capacity}>
                      {w.name} ({w.occupied}/{w.capacity})
                    </option>
                  ))}
                </select>
                <button 
                  disabled={!selectedWard}
                  onClick={() => {
                    admitPatient(patient.id, selectedWard, 'B' + Math.floor(Math.random() * 20));
                    onClose();
                  }}
                  className="w-full bg-slate-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl transition-all text-sm"
                >
                  Admit to Ward
                </button>
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Patient Info</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">NIC</p>
                  <p className="text-sm font-bold text-white">{patient.nic}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">DOB</p>
                  <p className="text-sm font-bold text-white">{patient.dob}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Contact</p>
                  <p className="text-sm font-bold text-white">{patient.contact}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
