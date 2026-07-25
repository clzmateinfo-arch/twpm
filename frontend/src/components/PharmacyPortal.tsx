import React, { useState } from 'react';
import { useHospital } from '../HospitalContext';
import {
  Drug, DrugForm, DRUG_UNITS, DrugUnit, isFractionalDrugUnit, DRUG_EXPIRY_WARNING_DAYS, TRANSLATIONS
} from '../types';
import {
  Pill, Plus, Search, AlertTriangle, Package, Edit2, Trash2, X, CheckCircle2, ClipboardList, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DRUG_FORM_OPTIONS = Object.values(DrugForm);

const isExpired = (drug: Drug) => new Date(drug.expiryDate) < new Date();
const isNearExpiry = (drug: Drug) => {
  const warnDate = new Date();
  warnDate.setDate(warnDate.getDate() + DRUG_EXPIRY_WARNING_DAYS);
  return new Date(drug.expiryDate) <= warnDate;
};
const isLowStock = (drug: Drug) => drug.stock <= drug.reorderThreshold;

interface DrugFormState {
  name: string;
  form: DrugForm;
  strength: string;
  unit: DrugUnit;
  stock: string;
  reorderThreshold: string;
  expiryDate: string;
}

const emptyForm = (): DrugFormState => ({
  name: '', form: DrugForm.TABLET, strength: '', unit: 'tablet', stock: '0', reorderThreshold: '10', expiryDate: ''
});

const DrugFormModal: React.FC<{ drug: Drug | null; onClose: () => void }> = ({ drug, onClose }) => {
  const { createDrug, updateDrug, language } = useHospital();
  const t = TRANSLATIONS[language];
  const [form, setForm] = useState<DrugFormState>(drug ? {
    name: drug.name,
    form: drug.form,
    strength: drug.strength,
    unit: drug.unit,
    stock: String(drug.stock),
    reorderThreshold: String(drug.reorderThreshold),
    expiryDate: drug.expiryDate.slice(0, 10)
  } : emptyForm());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        form: form.form,
        strength: form.strength.trim(),
        unit: form.unit,
        stock: Number(form.stock),
        reorderThreshold: Number(form.reorderThreshold),
        expiryDate: form.expiryDate
      };
      if (drug) {
        await updateDrug(drug.id, payload);
      } else {
        await createDrug(payload as any);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save drug');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{drug ? t.editDrug : t.addDrug}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.drugName}</label>
              <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.drugForm}</label>
              <select value={form.form} onChange={e => setForm({ ...form, form: e.target.value as DrugForm })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                {DRUG_FORM_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.drugStrength}</label>
              <input required type="text" placeholder="e.g. 500mg" value={form.strength} onChange={e => setForm({ ...form, strength: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.drugUnit}</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as DrugUnit })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                {DRUG_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.stockQuantity}</label>
              <input required type="number" min={0} step="any" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.reorderThreshold}</label>
              <input required type="number" min={0} step="any" value={form.reorderThreshold} onChange={e => setForm({ ...form, reorderThreshold: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.expiryDate}</label>
              <input required type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
          {error && <p className="text-rose-500 text-sm font-bold flex items-center"><AlertTriangle size={14} className="mr-2" /> {error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">
            {loading ? '...' : t.save}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const DrugCatalog: React.FC = () => {
  const { drugs, deactivateDrug, language } = useHospital();
  const t = TRANSLATIONS[language];
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);

  const filtered = drugs
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.strength.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const activeDrugs = drugs.filter(d => d.active);
  const lowStockCount = activeDrugs.filter(isLowStock).length;
  const expiringSoonCount = activeDrugs.filter(d => isNearExpiry(d) && !isExpired(d)).length;
  const expiredCount = activeDrugs.filter(isExpired).length;

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this drug?')) return;
    try {
      await deactivateDrug(id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to deactivate drug');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center">
          <Package className="text-emerald-500 mr-4" size={28} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Drugs</p>
            <p className="text-2xl font-bold text-white">{activeDrugs.length}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center">
          <AlertTriangle className="text-amber-500 mr-4" size={28} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{t.lowStockWarning}</p>
            <p className="text-2xl font-bold text-white">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center">
          <AlertTriangle className="text-orange-500 mr-4" size={28} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{t.expiryWarning}</p>
            <p className="text-2xl font-bold text-white">{expiringSoonCount}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center">
          <AlertTriangle className="text-rose-500 mr-4" size={28} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Expired</p>
            <p className="text-2xl font-bold text-white">{expiredCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <Pill className="text-emerald-500 mr-3" size={20} />
            <h3 className="text-lg font-bold text-white">{t.drugCatalog}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder={t.searchDrugs} value={search} onChange={e => setSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white w-full md:w-64" />
            </div>
            <button onClick={() => { setEditingDrug(null); setModalOpen(true); }}
              className="flex items-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap">
              <Plus size={16} className="mr-2" /> {t.addDrug}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{t.drugName}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{t.stockQuantity}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{t.expiryDate}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{t.status}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(d => (
                <tr key={d.id} className={`hover:bg-slate-800/50 transition-colors ${!d.active ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">{d.name} {d.strength}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{d.form} • {d.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${isLowStock(d) ? 'text-rose-500' : 'text-white'}`}>{d.stock} {d.unit}(s)</span>
                    <p className="text-[10px] text-slate-500">{t.reorderThreshold}: {d.reorderThreshold}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${isExpired(d) ? 'text-rose-500' : isNearExpiry(d) ? 'text-amber-500' : 'text-slate-300'}`}>
                      {new Date(d.expiryDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest rounded ${d.active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                      {d.active ? t.active : t.disabled}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => { setEditingDrug(d); setModalOpen(true); }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all">
                        <Edit2 size={14} />
                      </button>
                      {d.active && (
                        <button onClick={() => handleDeactivate(d.id)}
                          className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">{t.noDrugs}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && <DrugFormModal drug={editingDrug} onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

const DispenseView: React.FC = () => {
  const { patients, drugs, dispenseMedication, language } = useHospital();
  const t = TRANSLATIONS[language];
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [lineMessages, setLineMessages] = useState<Record<string, { type: 'error' | 'success'; text: string } | undefined>>({});
  const [busyLine, setBusyLine] = useState<string | null>(null);

  const candidatePatients = patients.filter(p =>
    p.status !== 'DISCHARGED' &&
    p.treatmentPlan?.medications?.some(m => m.drugId && m.status !== 'FULFILLED') &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;
  const pendingMeds = (selectedPatient?.treatmentPlan?.medications || []).filter(m => m.drugId && m.status !== 'FULFILLED');

  const handleDispense = async (medicationId: string, drugId: string, remaining: number) => {
    const raw = quantities[medicationId];
    const quantity = Number(raw);
    setLineMessages(prev => ({ ...prev, [medicationId]: undefined }));

    if (!raw || !Number.isFinite(quantity) || quantity <= 0) {
      setLineMessages(prev => ({ ...prev, [medicationId]: { type: 'error', text: 'Enter a valid positive quantity' } }));
      return;
    }
    if (quantity > remaining) {
      setLineMessages(prev => ({ ...prev, [medicationId]: { type: 'error', text: `Exceeds remaining amount (${remaining})` } }));
      return;
    }
    const drug = drugs.find(d => d.id === drugId);
    if (drug && !isFractionalDrugUnit(drug.unit) && !Number.isInteger(quantity)) {
      setLineMessages(prev => ({ ...prev, [medicationId]: { type: 'error', text: `Quantity must be a whole number for unit '${drug.unit}'` } }));
      return;
    }

    setBusyLine(medicationId);
    try {
      await dispenseMedication(selectedPatient!.id, medicationId, drugId, quantity);
      setLineMessages(prev => ({ ...prev, [medicationId]: { type: 'success', text: t.dispenseSuccess } }));
      setQuantities(prev => ({ ...prev, [medicationId]: '' }));
    } catch (err: any) {
      setLineMessages(prev => ({ ...prev, [medicationId]: { type: 'error', text: err.response?.data?.error || 'Dispense failed' } }));
    } finally {
      setBusyLine(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">{t.patient}</h4>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input type="text" placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white" />
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {candidatePatients.map(p => (
            <button key={p.id} onClick={() => setSelectedPatientId(p.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center ${selectedPatientId === p.id ? 'bg-emerald-600/20 border-emerald-500/50' : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'}`}>
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mr-3">
                <User size={14} className="text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{p.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{p.id} • {p.status}</p>
              </div>
            </button>
          ))}
          {candidatePatients.length === 0 && (
            <p className="text-xs text-slate-500 italic p-4 text-center">No patients with pending pharmacy-linked prescriptions</p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center mb-6">
          <ClipboardList className="text-emerald-500 mr-3" size={20} />
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">{t.dispenseMedication}</h4>
        </div>

        {!selectedPatient && <p className="text-sm text-slate-500 italic">Select a patient to view their prescribed medications.</p>}

        {selectedPatient && pendingMeds.length === 0 && (
          <p className="text-sm text-slate-500 italic">No pending pharmacy-linked prescriptions for this patient.</p>
        )}

        {selectedPatient && pendingMeds.map(med => {
          const drug = drugs.find(d => d.id === med.drugId);
          const remaining = (med.quantityPrescribed || 0) - med.dispensedQuantity;
          const msg = lineMessages[med._id || ''];
          const blocked = !drug || !drug.active || (drug && isExpired(drug));

          return (
            <div key={med._id} className="bg-slate-800/50 p-5 rounded-2xl border border-slate-800 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-white">{med.name} {drug ? `(${drug.strength})` : ''}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{med.dosage} • {med.frequency}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest rounded ${med.status === 'PARTIALLY_DISPENSED' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-700 text-slate-300'}`}>
                  {med.status === 'PARTIALLY_DISPENSED' ? t.partiallyDispensed : t.pending}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                <span>{t.quantityPrescribed}: {med.quantityPrescribed}</span>
                <span>{t.quantityDispensed}: {med.dispensedQuantity}</span>
                <span className="font-bold text-white">{t.quantityRemaining}: {remaining}</span>
                {drug && <span className={isLowStock(drug) ? 'text-rose-500 font-bold' : ''}>Stock: {drug.stock} {drug.unit}(s)</span>}
              </div>

              {blocked && (
                <p className="text-xs text-rose-500 font-bold mb-3 flex items-center">
                  <AlertTriangle size={12} className="mr-1" />
                  {!drug ? 'Drug not found' : !drug.active ? 'Drug is inactive' : t.expiredCannotDispense}
                </p>
              )}

              <div className="flex gap-2">
                <input type="number" min={0} step="any" placeholder={t.dispenseQuantity}
                  value={quantities[med._id || ''] || ''}
                  onChange={e => setQuantities(prev => ({ ...prev, [med._id || '']: e.target.value }))}
                  disabled={blocked}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white disabled:opacity-50" />
                <button
                  onClick={() => handleDispense(med._id!, med.drugId!, remaining)}
                  disabled={blocked || busyLine === med._id}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-lg text-sm transition-all">
                  {busyLine === med._id ? '...' : t.dispenseMedication}
                </button>
              </div>

              {msg && (
                <p className={`text-xs font-bold mt-2 flex items-center ${msg.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {msg.type === 'success' ? <CheckCircle2 size={12} className="mr-1" /> : <AlertTriangle size={12} className="mr-1" />}
                  {msg.text}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PharmacyPortal: React.FC = () => {
  const { language } = useHospital();
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'catalog' | 'dispense'>('catalog');

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-slate-800 pb-2">
        <button onClick={() => setActiveTab('catalog')}
          className={`text-sm font-bold uppercase tracking-widest px-4 py-2 ${activeTab === 'catalog' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>
          {t.drugCatalog}
        </button>
        <button onClick={() => setActiveTab('dispense')}
          className={`text-sm font-bold uppercase tracking-widest px-4 py-2 ${activeTab === 'dispense' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>
          {t.dispenseMedication}
        </button>
      </div>

      {activeTab === 'catalog' && <DrugCatalog />}
      {activeTab === 'dispense' && <DispenseView />}
    </div>
  );
};
