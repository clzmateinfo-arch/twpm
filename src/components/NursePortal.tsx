import React, { useState } from 'react';
import { useHospital } from '../HospitalContext';
import { Gender, TRANSLATIONS, TRIAGE_LOGIC, TriageLevel } from '../types';
import { UserPlus, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export const PatientRegistration: React.FC = () => {
  const { registerPatient, language } = useHospital();
  const t = TRANSLATIONS[language];
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    dob: '',
    gender: Gender.MALE,
    contact: '',
    address: '',
    symptoms: ''
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerPatient({
      ...formData,
      symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s !== ''),
      triageLevel: TriageLevel.NON_URGENT // Initial default
    });
    setSuccess(true);
    setFormData({ name: '', nic: '', dob: '', gender: Gender.MALE, contact: '', address: '', symptoms: '' });
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mr-4">
            <UserPlus className="text-emerald-500" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{t.patientRegistration}</h3>
            <p className="text-sm text-slate-400">Enter basic demographic information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.name}</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.nic}</label>
              <input
                required
                type="text"
                value={formData.nic}
                onChange={e => setFormData({ ...formData, nic: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="NIC or ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.dob}</label>
              <input
                required
                type="date"
                value={formData.dob}
                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.gender}</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              >
                <option value={Gender.MALE}>Male</option>
                <option value={Gender.FEMALE}>Female</option>
                <option value={Gender.OTHER}>Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.address}</label>
            <textarea
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all h-24"
              placeholder="Full Address"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.symptoms} (comma separated)</label>
            <input
              type="text"
              value={formData.symptoms}
              onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              placeholder="e.g. Fever, Cough, Headache"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center"
          >
            {success ? <CheckCircle2 className="mr-2" /> : null}
            {success ? 'Registered Successfully' : t.register}
          </button>
        </form>
      </div>
    </div>
  );
};

export const VitalSignsEntry: React.FC = () => {
  const { patients, updateVitals, language } = useHospital();
  const t = TRANSLATIONS[language];
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [vitals, setVitals] = useState({
    temperature: 37,
    pulse: 80,
    bpSystolic: 120,
    bpDiastolic: 80,
    respiratoryRate: 18,
    spo2: 98
  });
  const [previewTriage, setPreviewTriage] = useState<TriageLevel>(TriageLevel.NON_URGENT);

  const triagePatients = patients.filter(p => p.status === 'TRIAGE');

  const handleVitalsChange = (field: string, value: number) => {
    const newVitals = { ...vitals, [field]: value };
    setVitals(newVitals);
    setPreviewTriage(TRIAGE_LOGIC(newVitals));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    updateVitals(selectedPatientId, vitals, previewTriage);
    setSelectedPatientId('');
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mr-4">
            <Activity className="text-emerald-500" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{t.vitalsEntry}</h3>
            <p className="text-sm text-slate-400">Capture real-time vital signs</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Select Patient</label>
            <select
              required
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            >
              <option value="">-- Select Patient in Triage --</option>
              {triagePatients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.temp}</label>
              <input
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={e => handleVitalsChange('temperature', parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.pulse}</label>
              <input
                type="number"
                value={vitals.pulse}
                onChange={e => handleVitalsChange('pulse', parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.spo2}</label>
              <input
                type="number"
                value={vitals.spo2}
                onChange={e => handleVitalsChange('spo2', parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Systolic BP</label>
              <input
                type="number"
                value={vitals.bpSystolic}
                onChange={e => handleVitalsChange('bpSystolic', parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Diastolic BP</label>
              <input
                type="number"
                value={vitals.bpDiastolic}
                onChange={e => handleVitalsChange('bpDiastolic', parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.rr}</label>
              <input
                type="number"
                value={vitals.respiratoryRate}
                onChange={e => handleVitalsChange('respiratoryRate', parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedPatientId}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all"
          >
            {t.save}
          </button>
        </form>
      </div>

      <div className="space-y-8">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">{t.triageResult}</h4>
          <div className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-800">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-2xl ${
              previewTriage === TriageLevel.CRITICAL ? 'bg-rose-500 shadow-rose-500/20' :
              previewTriage === TriageLevel.URGENT ? 'bg-amber-500 shadow-amber-500/20' :
              'bg-emerald-500 shadow-emerald-500/20'
            }`}>
              <AlertCircle size={48} className="text-white" />
            </div>
            <p className={`text-2xl font-black uppercase tracking-tighter ${
              previewTriage === TriageLevel.CRITICAL ? 'text-rose-500' :
              previewTriage === TriageLevel.URGENT ? 'text-amber-500' :
              'text-emerald-500'
            }`}>
              {previewTriage === TriageLevel.CRITICAL ? t.critical :
               previewTriage === TriageLevel.URGENT ? t.urgent :
               t.nonUrgent}
            </p>
          </div>
          
          <div className="mt-6 space-y-3">
             <div className="flex items-center text-xs text-slate-400">
               <div className="w-2 h-2 rounded-full bg-rose-500 mr-2"></div>
               <span>Critical: Immediate attention required</span>
             </div>
             <div className="flex items-center text-xs text-slate-400">
               <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
               <span>Urgent: High priority, see within 30 mins</span>
             </div>
             <div className="flex items-center text-xs text-slate-400">
               <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
               <span>Non-urgent: Standard priority</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
