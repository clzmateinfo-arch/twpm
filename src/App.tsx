import React, { useState } from 'react';
import { HospitalProvider, useHospital } from './HospitalContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PatientRegistration, VitalSignsEntry } from './components/NursePortal';
import { PriorityQueue, PatientDetailView } from './components/DoctorPortal';
import { WardManagement, AuditTrail } from './components/AdminPortal';
import { UserRole, Patient } from './types';
import { Stethoscope, User, ShieldCheck, Activity } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, setCurrentUser } = useHospital();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
              <Stethoscope className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter">ClinQ LOGIN</h1>
            <p className="text-slate-500 text-sm font-medium mt-2">Malwathuhiripitiya Divisional Hospital</p>
          </div>

          <div className="space-y-4">
            {[
              { role: UserRole.NURSE, name: 'Nurse Anula', icon: <Activity className="text-emerald-500" /> },
              { role: UserRole.DOCTOR, name: 'Dr. Perera', icon: <Stethoscope className="text-emerald-500" /> },
              { role: UserRole.ADMIN, name: 'Admin Sarath', icon: <ShieldCheck className="text-emerald-500" /> },
              { role: UserRole.IT_SUPPORT, name: 'IT Support', icon: <ShieldCheck className="text-emerald-500" /> },
            ].map((user) => (
              <button
                key={user.role}
                onClick={() => setCurrentUser({ id: user.role.charAt(0) + '001', name: user.name, role: user.role })}
                className="w-full flex items-center p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mr-4 group-hover:bg-emerald-500/10 transition-colors">
                  {user.icon}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{user.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{user.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'registration' && <PatientRegistration />}
      {activeTab === 'vitals' && <VitalSignsEntry />}
      {activeTab === 'queue' && <PriorityQueue onSelectPatient={setSelectedPatient} />}
      {activeTab === 'wards' && <WardManagement />}
      {activeTab === 'audit' && <AuditTrail />}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
          <p className="text-slate-500 italic">System settings and user management module coming soon.</p>
        </div>
      )}

      {selectedPatient && (
        <PatientDetailView 
          patient={selectedPatient} 
          onClose={() => setSelectedPatient(null)} 
        />
      )}
    </Layout>
  );
};

export default function App() {
  return (
    <HospitalProvider>
      <AppContent />
    </HospitalProvider>
  );
}
