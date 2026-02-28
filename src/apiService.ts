/// <reference types="vite/client" />
import axios from 'axios';
import { Patient, Vitals, TriageLevel } from './types';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

// Axios Interceptor for JWT
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('twpms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  initSocket: (onPatientUpdated: (p: Patient) => void, onWardUpdated: (w: any) => void) => {
    if (!socket) {
      socket = io(SOCKET_URL);
      socket.on('PATIENT_UPDATED', onPatientUpdated);
      socket.on('WARD_UPDATED', onWardUpdated);
      socket.on('CRITICAL_ALERT', (p: Patient) => {
        if (Notification.permission === 'granted') {
          new Notification(`CRITICAL ALERT: ${p.name}`, {
            body: `Patient ${p.id} has critical vitals!`,
            icon: '/vite.svg'
          });
        }
      });
    }
  },
  fetchData: async () => {
    const res = await axios.get(`${API_URL}/data`);
    return res.data;
  },

  registerPatient: async (patient: Omit<Patient, 'id' | 'registrationDate' | 'status'>, userId: string, userName: string): Promise<Patient> => {
    const res = await axios.post(`${API_URL}/patients`, patient, {
      headers: { 'x-user-id': userId, 'x-user-name': userName }
    });
    return res.data;
  },

  updateVitals: async (patientId: string, vitals: Vitals, triageLevel: TriageLevel, userId: string, userName: string): Promise<void> => {
    await axios.put(`${API_URL}/patients/${patientId}/vitals`, { vitals, triageLevel }, {
      headers: { 'x-user-id': userId, 'x-user-name': userName }
    });
  },

  addConsultationNotes: async (patientId: string, notes: string, userId: string, userName: string): Promise<void> => {
    await axios.put(`${API_URL}/patients/${patientId}/notes`, { notes }, {
      headers: { 'x-user-id': userId, 'x-user-name': userName }
    });
  },

  admitPatient: async (patientId: string, wardId: string, bedNumber: string, userId: string, userName: string): Promise<void> => {
    await axios.put(`${API_URL}/patients/${patientId}/admit`, { wardId, bedNumber }, {
      headers: { 'x-user-id': userId, 'x-user-name': userName }
    });
  },

  logLogin: async (userId: string, userName: string): Promise<void> => {
    await axios.post(`${API_URL}/login-log`, {}, {
      headers: { 'x-user-id': userId, 'x-user-name': userName }
    });
  },

  dischargePatient: async (patientId: string, summary: any, userId: string, userName: string): Promise<void> => {
    await axios.put(`${API_URL}/patients/${patientId}/discharge`, { summary }, {
      headers: { 'x-user-id': userId, 'x-user-name': userName }
    });
  },

  fetchAnalytics: async (): Promise<any> => {
    const res = await axios.get(`${API_URL}/analytics`);
    return res.data;
  },

  updateTreatment: async (patientId: string, treatmentPlan: any, userId: string, userName: string): Promise<void> => {
    await axios.put(`${API_URL}/patients/${patientId}/treatment`, { treatmentPlan }, {
      headers: { 'x-user-id': userId, 'x-user-name': userName }
    });
  }
};
