import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, Ward, UserRole, AuditLog, TriageLevel } from './types';
import { MOCK_PATIENTS, MOCK_WARDS, MOCK_AUDIT_LOGS } from './mockData';

interface HospitalContextType {
  patients: Patient[];
  wards: Ward[];
  auditLogs: AuditLog[];
  currentUser: { id: string; name: string; role: UserRole } | null;
  language: 'en' | 'si';
  setLanguage: (lang: 'en' | 'si') => void;
  setCurrentUser: (user: { id: string; name: string; role: UserRole } | null) => void;
  registerPatient: (patient: Omit<Patient, 'id' | 'registrationDate' | 'status'>) => void;
  updateVitals: (patientId: string, vitals: Patient['vitals'], triageLevel: TriageLevel) => void;
  addConsultationNotes: (patientId: string, notes: string) => void;
  admitPatient: (patientId: string, wardId: string, bedNumber: string) => void;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [wards, setWards] = useState<Ward[]>(MOCK_WARDS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: UserRole } | null>({
    id: 'N001',
    name: 'Nurse Anula',
    role: UserRole.NURSE
  });
  const [language, setLanguage] = useState<'en' | 'si'>('en');

  const addLog = (action: string, details: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: `L${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const registerPatient = (patientData: Omit<Patient, 'id' | 'registrationDate' | 'status'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `P${patients.length + 1}`.padStart(4, '0'),
      registrationDate: new Date().toISOString(),
      status: 'TRIAGE'
    };
    setPatients(prev => [...prev, newPatient]);
    addLog('PATIENT_REGISTRATION', `Registered patient ${newPatient.name} (${newPatient.id})`);
  };

  const updateVitals = (patientId: string, vitals: Patient['vitals'], triageLevel: TriageLevel) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId ? { ...p, vitals, triageLevel, status: 'QUEUE' } : p
    ));
    addLog('VITALS_CAPTURE', `Updated vitals for patient ${patientId} - ${triageLevel}`);
  };

  const addConsultationNotes = (patientId: string, notes: string) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId ? { ...p, consultationNotes: notes } : p
    ));
    addLog('CONSULTATION_NOTES', `Added consultation notes for patient ${patientId}`);
  };

  const admitPatient = (patientId: string, wardId: string, bedNumber: string) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId ? { ...p, wardId, bedNumber, status: 'ADMITTED' } : p
    ));
    setWards(prev => prev.map(w => 
      w.id === wardId ? { ...w, occupied: w.occupied + 1 } : w
    ));
    addLog('WARD_ADMISSION', `Admitted patient ${patientId} to ward ${wardId}, bed ${bedNumber}`);
  };

  return (
    <HospitalContext.Provider value={{
      patients,
      wards,
      auditLogs,
      currentUser,
      language,
      setLanguage,
      setCurrentUser,
      registerPatient,
      updateVitals,
      addConsultationNotes,
      admitPatient
    }}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) throw new Error('useHospital must be used within a HospitalProvider');
  return context;
};
