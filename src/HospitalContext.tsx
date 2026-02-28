import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, Ward, UserRole, AuditLog, TriageLevel } from './types';
import { apiService } from './apiService';

interface HospitalContextType {
  patients: Patient[];
  wards: Ward[];
  auditLogs: AuditLog[];
  currentUser: { id: string; name: string; role: UserRole; isFirstLogin?: boolean } | null;
  language: 'en' | 'si';
  setLanguage: (lang: 'en' | 'si') => void;
  setCurrentUser: (user: { id: string; name: string; role: UserRole; isFirstLogin?: boolean } | null) => void;
  login: (user: { id: string; name: string; role: UserRole; isFirstLogin?: boolean }) => Promise<void>;
  logout: () => void;
  registerPatient: (patient: Omit<Patient, 'id' | 'registrationDate' | 'status'>) => Promise<void>;
  updateVitals: (patientId: string, vitals: Patient['vitals'], triageLevel: TriageLevel) => Promise<void>;
  addConsultationNotes: (patientId: string, notes: string) => Promise<void>;
  admitPatient: (patientId: string, wardId: string, bedNumber: string) => Promise<void>;
  dischargePatient: (patientId: string, summary?: any) => Promise<void>;
  updateTreatment: (patientId: string, plan: any) => Promise<void>;
  refreshData: () => Promise<void>;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: UserRole; isFirstLogin?: boolean } | null>(null);
  const [language, setLanguage] = useState<'en' | 'si'>('en');

  const refreshData = async () => {
    if (!localStorage.getItem('twpms_token')) return;
    try {
      const { patients, wards, auditLogs } = await apiService.fetchData();
      setPatients(patients);
      setWards(wards);
      setAuditLogs(auditLogs);
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      }
      console.error('Failed to fetch data', err);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('twpms_token')) {
      refreshData();
    }

    apiService.initSocket(
      (updatedPatient: Patient) => {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      },
      (updatedWard: Ward) => {
        setWards(prev => prev.map(w => w.id === updatedWard.id ? updatedWard : w));
      }
    );

    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const login = async (user: { id: string; name: string; role: UserRole; isFirstLogin?: boolean }) => {
    setCurrentUser(user);
    try {
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem('twpms_token');
    setCurrentUser(null);
  };

  const handleSetCurrentUser = (user: { id: string; name: string; role: UserRole; isFirstLogin?: boolean } | null) => {
    setCurrentUser(user);
  };

  const registerPatient = async (patientData: Omit<Patient, 'id' | 'registrationDate' | 'status'>) => {
    if (!currentUser) return;
    await apiService.registerPatient(patientData, currentUser.id, currentUser.name);
    await refreshData();
  };

  const updateVitals = async (patientId: string, vitals: Patient['vitals'], triageLevel: TriageLevel) => {
    if (!currentUser) return;
    await apiService.updateVitals(patientId, vitals as any, triageLevel, currentUser.id, currentUser.name);
    await refreshData();
  };

  const addConsultationNotes = async (patientId: string, notes: string) => {
    if (!currentUser) return;
    await apiService.addConsultationNotes(patientId, notes, currentUser.id, currentUser.name);
    await refreshData();
  };

  const admitPatient = async (patientId: string, wardId: string, bedNumber: string) => {
    if (!currentUser) return;
    await apiService.admitPatient(patientId, wardId, bedNumber, currentUser.id, currentUser.name);
    await refreshData();
  };

  const dischargePatient = async (patientId: string, summary?: any) => {
    if (!currentUser) return;
    await apiService.dischargePatient(patientId, summary || {}, currentUser.id, currentUser.name);
    await refreshData();
  };

  const updateTreatment = async (patientId: string, plan: any) => {
    if (!currentUser) return;
    await apiService.updateTreatment(patientId, plan, currentUser.id, currentUser.name);
    await refreshData();
  };

  return (
    <HospitalContext.Provider value={{
      patients,
      wards,
      auditLogs,
      currentUser,
      language,
      setLanguage,
      setCurrentUser: handleSetCurrentUser,
      login,
      logout,
      registerPatient,
      updateVitals,
      addConsultationNotes,
      admitPatient,
      dischargePatient,
      updateTreatment,
      refreshData
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
