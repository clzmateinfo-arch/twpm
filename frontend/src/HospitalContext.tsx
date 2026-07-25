import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, Ward, UserRole, AuditLog, TriageLevel, Drug } from './types';
import { apiService } from './apiService';

const DRUG_CATALOG_ROLES = [UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.ADMIN];

interface HospitalContextType {
  patients: Patient[];
  wards: Ward[];
  auditLogs: AuditLog[];
  drugs: Drug[];
  currentUser: { id: string; name: string; role: UserRole; isFirstLogin?: boolean; language?: 'en' | 'si' } | null;
  language: 'en' | 'si';
  setLanguage: (lang: 'en' | 'si') => void;
  setCurrentUser: (user: { id: string; name: string; role: UserRole; isFirstLogin?: boolean; language?: 'en' | 'si' } | null) => void;
  login: (user: { id: string; name: string; role: UserRole; isFirstLogin?: boolean; language?: 'en' | 'si' }) => Promise<void>;
  logout: () => void;
  registerPatient: (patient: Omit<Patient, 'id' | 'registrationDate' | 'status'>) => Promise<void>;
  updateVitals: (patientId: string, vitals: Patient['vitals'], triageLevel: TriageLevel) => Promise<void>;
  addConsultationNotes: (patientId: string, notes: string) => Promise<void>;
  admitPatient: (patientId: string, wardId: string, bedNumber: string) => Promise<void>;
  dischargePatient: (patientId: string, summary?: any) => Promise<void>;
  updateTreatment: (patientId: string, plan: any) => Promise<void>;
  refreshData: () => Promise<void>;
  refreshDrugs: (roleOverride?: UserRole) => Promise<void>;
  createDrug: (drug: Omit<Drug, 'id' | 'active'>) => Promise<void>;
  updateDrug: (id: string, updates: Partial<Omit<Drug, 'id'>>) => Promise<void>;
  deactivateDrug: (id: string) => Promise<void>;
  dispenseMedication: (patientId: string, medicationId: string, drugId: string, quantity: number) => Promise<void>;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: UserRole; isFirstLogin?: boolean; language?: 'en' | 'si' } | null>(null);
  const [language, setLanguage] = useState<'en' | 'si'>((localStorage.getItem('twpms_lang') as 'en' | 'si') || 'en');

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

  // Drug catalog is fetched separately from /api/data (not folded into it),
  // since NURSE must never receive inventory data and /api/data is
  // role-agnostic. Backend also enforces this at the route level (403 for
  // NURSE) - this client-side role check just avoids a pointless failing
  // request for a role we already know can't see it.
  const refreshDrugs = async (roleOverride?: UserRole) => {
    if (!localStorage.getItem('twpms_token')) return;
    const effectiveRole = roleOverride || currentUser?.role;
    if (!effectiveRole || !DRUG_CATALOG_ROLES.includes(effectiveRole)) return;
    try {
      const data = await apiService.fetchDrugs();
      setDrugs(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      }
      console.error('Failed to fetch drugs', err);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('twpms_token')) {
      refreshData();
      refreshDrugs();
    }

    apiService.initSocket(
      (updatedPatient: Patient) => {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      },
      (updatedWard: Ward) => {
        setWards(prev => prev.map(w => w.id === updatedWard.id ? updatedWard : w));
      },
      (updatedDrug: Drug) => {
        setDrugs(prev => {
          const idx = prev.findIndex(d => d.id === updatedDrug.id);
          if (idx === -1) return [...prev, updatedDrug];
          const next = [...prev];
          next[idx] = updatedDrug;
          return next;
        });
      }
    );

    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const handleSetLanguage = async (lang: 'en' | 'si') => {
    setLanguage(lang);
    localStorage.setItem('twpms_lang', lang);
    if (currentUser) {
      try {
        await apiService.updateLanguage(lang);
      } catch (err) {
        console.error('Failed to update language preference', err);
      }
    }
  };

  const login = async (user: { id: string; name: string; role: UserRole; isFirstLogin?: boolean; language?: 'en' | 'si' }) => {
    setCurrentUser(user as any);
    if (user.language) {
      setLanguage(user.language);
      localStorage.setItem('twpms_lang', user.language);
    }
    try {
      await refreshData();
      // currentUser state hasn't committed yet in this closure, so the
      // role is passed explicitly rather than read from context state.
      await refreshDrugs(user.role);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem('twpms_token');
    setCurrentUser(null);
  };

  const handleSetCurrentUser = (user: { id: string; name: string; role: UserRole; isFirstLogin?: boolean; language?: 'en' | 'si' } | null) => {
    setCurrentUser(user);
    if (user?.language) setLanguage(user.language);
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

  const createDrug = async (drug: Omit<Drug, 'id' | 'active'>) => {
    await apiService.createDrug(drug);
    await refreshDrugs();
  };

  const updateDrug = async (id: string, updates: Partial<Omit<Drug, 'id'>>) => {
    await apiService.updateDrug(id, updates);
    await refreshDrugs();
  };

  const deactivateDrug = async (id: string) => {
    await apiService.deactivateDrug(id);
    await refreshDrugs();
  };

  const dispenseMedication = async (patientId: string, medicationId: string, drugId: string, quantity: number) => {
    await apiService.dispenseMedication(patientId, medicationId, drugId, quantity);
    await refreshDrugs();
    await refreshData();
  };

  return (
    <HospitalContext.Provider value={{
      patients,
      wards,
      auditLogs,
      drugs,
      currentUser,
      language,
      setLanguage: handleSetLanguage,
      setCurrentUser: handleSetCurrentUser,
      login,
      logout,
      registerPatient,
      updateVitals,
      addConsultationNotes,
      admitPatient,
      dischargePatient,
      updateTreatment,
      refreshDrugs,
      createDrug,
      updateDrug,
      deactivateDrug,
      dispenseMedication,
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
