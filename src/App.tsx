import React, { useState } from 'react';
import { HospitalProvider, useHospital } from './HospitalContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PatientRegistration, VitalSignsEntry } from './components/NursePortal';
import { PriorityQueue, PatientDetailView } from './components/DoctorPortal';
import { WardManagement, AuditTrail, UserManagement } from './components/AdminPortal';
import { LoginScreen, PasswordResetScreen, UserSettings } from './components/AuthScreens';
import { Patient } from './types';

const AppContent: React.FC = () => {
  const { currentUser } = useHospital();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (currentUser.isFirstLogin) {
    return <PasswordResetScreen />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'registration' && <PatientRegistration />}
      {activeTab === 'vitals' && <VitalSignsEntry />}
      {activeTab === 'queue' && <PriorityQueue onSelectPatient={setSelectedPatient} />}
      {activeTab === 'wards' && <WardManagement />}
      {activeTab === 'audit' && <AuditTrail />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'settings' && <UserSettings />}

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
