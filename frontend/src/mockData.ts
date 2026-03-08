import { Patient, TriageLevel, Gender, Ward, AuditLog } from './types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P001',
    nic: '199012345678',
    name: 'Sunil Perera',
    dob: '1990-05-15',
    gender: Gender.MALE,
    contact: '0771234567',
    address: '123, Kandy Road, Malwathuhiripitiya',
    registrationDate: '2026-02-22T08:30:00Z',
    vitals: {
      temperature: 38.2,
      pulse: 95,
      bpSystolic: 145,
      bpDiastolic: 90,
      respiratoryRate: 20,
      spo2: 93
    },
    symptoms: ['Fever', 'Cough', 'Shortness of breath'],
    triageLevel: TriageLevel.URGENT,
    status: 'QUEUE'
  },
  {
    id: 'P002',
    nic: '198598765432',
    name: 'Kamala Silva',
    dob: '1985-11-20',
    gender: Gender.FEMALE,
    contact: '0719876543',
    address: '45, Temple Road, Gampaha',
    registrationDate: '2026-02-22T09:15:00Z',
    vitals: {
      temperature: 39.8,
      pulse: 135,
      bpSystolic: 85,
      bpDiastolic: 55,
      respiratoryRate: 28,
      spo2: 88
    },
    symptoms: ['Chest pain', 'Severe dizziness'],
    triageLevel: TriageLevel.CRITICAL,
    status: 'QUEUE'
  },
  {
    id: 'P003',
    nic: '200245678901',
    name: 'Nuwan Bandara',
    dob: '2002-02-10',
    gender: Gender.MALE,
    contact: '0754567890',
    address: '78, School Lane, Malwathuhiripitiya',
    registrationDate: '2026-02-22T10:00:00Z',
    vitals: {
      temperature: 37.0,
      pulse: 72,
      bpSystolic: 120,
      bpDiastolic: 80,
      respiratoryRate: 16,
      spo2: 98
    },
    symptoms: ['Mild headache'],
    triageLevel: TriageLevel.NON_URGENT,
    status: 'QUEUE'
  }
];

export const MOCK_WARDS: Ward[] = [
  { id: 'W1', name: 'General Ward - Male', capacity: 20, occupied: 15, type: 'General' },
  { id: 'W2', name: 'General Ward - Female', capacity: 20, occupied: 18, type: 'General' },
  { id: 'W3', name: 'Emergency Care Unit', capacity: 5, occupied: 4, type: 'Emergency' },
  { id: 'W4', name: 'Pediatric Ward', capacity: 10, occupied: 6, type: 'Specialized' }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'L1',
    timestamp: '2026-02-22T08:30:00Z',
    userId: 'N001',
    userName: 'Nurse Anula',
    action: 'PATIENT_REGISTRATION',
    details: 'Registered patient Sunil Perera (P001)'
  },
  {
    id: 'L2',
    timestamp: '2026-02-22T09:15:00Z',
    userId: 'N001',
    userName: 'Nurse Anula',
    action: 'VITALS_CAPTURE',
    details: 'Captured vitals for Kamala Silva (P002) - CRITICAL'
  },
  {
    id: 'L3',
    timestamp: '2026-02-22T10:05:00Z',
    userId: 'D001',
    userName: 'Dr. Perera',
    action: 'CONSULTATION_NOTES',
    details: 'Added notes for Kamala Silva (P002)'
  }
];
