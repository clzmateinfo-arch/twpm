import { Patient, Vitals, TriageLevel } from './types';

/**
 * Placeholder API Service Layer
 * In a real application, these would use axios or fetch to communicate with the backend.
 */

export const apiService = {
  registerPatient: async (patient: Omit<Patient, 'id' | 'registrationDate' | 'status'>): Promise<Patient> => {
    console.log('API: Registering patient', patient);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      ...patient,
      id: 'P' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      registrationDate: new Date().toISOString(),
      status: 'TRIAGE'
    };
  },

  updateVitals: async (patientId: string, vitals: Vitals, triageLevel: TriageLevel): Promise<void> => {
    console.log('API: Updating vitals', { patientId, vitals, triageLevel });
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  getTriageQueue: async (): Promise<Patient[]> => {
    console.log('API: Fetching triage queue');
    await new Promise(resolve => setTimeout(resolve, 500));
    return []; // Mock data handled by context in this demo
  },

  admitPatient: async (patientId: string, wardId: string, bedNumber: string): Promise<void> => {
    console.log('API: Admitting patient', { patientId, wardId, bedNumber });
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  getWardStatus: async (): Promise<any> => {
    console.log('API: Fetching ward status');
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  getAuditTrail: async (): Promise<any[]> => {
    console.log('API: Fetching audit trail');
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  }
};
