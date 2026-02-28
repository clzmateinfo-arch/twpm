export enum UserRole {
  NURSE = 'NURSE',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
  IT_SUPPORT = 'IT_SUPPORT'
}

export enum TriageLevel {
  CRITICAL = 'CRITICAL', // Red
  URGENT = 'URGENT',     // Yellow
  NON_URGENT = 'NON_URGENT' // Green
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export interface Vitals {
  temperature: number; // Celsius
  pulse: number;       // bpm
  bpSystolic: number;  // mmHg
  bpDiastolic: number; // mmHg
  respiratoryRate: number; // breaths/min
  spo2: number;        // %
}

export interface Patient {
  id: string;
  nic: string;
  name: string;
  dob: string;
  gender: Gender;
  contact: string;
  address: string;
  registrationDate: string;
  vitals?: Vitals;
  symptoms: string[];
  triageLevel: TriageLevel;
  consultationNotes?: string;
  wardId?: string;
  bedNumber?: string;
  status: 'TRIAGE' | 'QUEUE' | 'ADMITTED' | 'DISCHARGED';
  vitalsHistory?: Array<Vitals & { timestamp: string }>;
  treatmentPlan?: {
    medications: Array<{ name: string; dosage: string; frequency: string }>;
    procedures: string[];
    instructions: string;
  };
  dischargeSummary?: {
    diagnosis: string;
    followUpDate: string;
    prescriptions: string[];
    advice: string;
    dischargedAt: string;
  };
}

export interface Ward {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  type: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export const TRIAGE_LOGIC = (vitals: Vitals): TriageLevel => {
  // Simple triage logic based on common medical thresholds
  if (vitals.spo2 < 90 || vitals.pulse > 130 || vitals.pulse < 40 || vitals.bpSystolic < 90 || vitals.temperature > 39.5) {
    return TriageLevel.CRITICAL;
  }
  if (vitals.spo2 < 94 || vitals.pulse > 110 || vitals.bpSystolic > 160 || vitals.temperature > 38.5) {
    return TriageLevel.URGENT;
  }
  return TriageLevel.NON_URGENT;
};

export const TRANSLATIONS = {
  en: {
    title: "ClinQ",
    hospitalName: "Malwathuhiripitiya Divisional Hospital",
    nursePortal: "Nurse Portal",
    doctorPortal: "Doctor Portal",
    adminPortal: "Admin Portal",
    itPortal: "IT Support Portal",
    patientRegistration: "Patient Registration",
    vitalSigns: "Vital Signs",
    symptoms: "Symptoms",
    triageResult: "Triage Result",
    priorityQueue: "Priority Queue",
    wardManagement: "Ward Management",
    auditTrail: "Audit Trail",
    userManagement: "User Management",
    name: "Name",
    nic: "NIC / Patient ID",
    dob: "Date of Birth",
    gender: "Gender",
    contact: "Contact",
    address: "Address",
    register: "Register Patient",
    vitalsEntry: "Enter Vitals",
    temp: "Temperature (°C)",
    pulse: "Pulse (bpm)",
    bp: "Blood Pressure (mmHg)",
    rr: "Resp. Rate",
    spo2: "SpO2 (%)",
    critical: "Critical",
    urgent: "Urgent",
    nonUrgent: "Non-urgent",
    notes: "Consultation Notes",
    save: "Save",
    occupancy: "Occupancy",
    beds: "Beds",
    language: "Language",
    logout: "Logout"
  },
  si: {
    title: "ClinQ",
    hospitalName: "මල්වතුහිරිපිටිය ප්‍රාදේශීය රෝහල",
    nursePortal: "හෙද ද්වාරය",
    doctorPortal: "වෛද්‍ය ද්වාරය",
    adminPortal: "පරිපාලන ද්වාරය",
    itPortal: "තොරතුරු තාක්ෂණ ද්වාරය",
    patientRegistration: "රෝගී ලියාපදිංචිය",
    vitalSigns: "වැදගත් ලකුණු",
    symptoms: "රෝග ලක්ෂණ",
    triageResult: "ප්‍රමුඛතා ප්‍රතිඵලය",
    priorityQueue: "ප්‍රමුඛතා පෝලිම",
    wardManagement: "වාට්ටු කළමනාකරණය",
    auditTrail: "විගණන වාර්තාව",
    userManagement: "පරිශීලක කළමනාකරණය",
    name: "නම",
    nic: "ජාතික හැඳුනුම්පත් අංකය",
    dob: "උපන් දිනය",
    gender: "ස්ත්‍රී/පුරුෂ භාවය",
    contact: "සම්බන්ධතා අංකය",
    address: "ලිපිනය",
    register: "රෝගියා ලියාපදිංචි කරන්න",
    vitalsEntry: "වැදගත් ලකුණු ඇතුළත් කරන්න",
    temp: "උෂ්ණත්වය (°C)",
    pulse: "හෘද ස්පන්දනය (bpm)",
    bp: "රුධිර පීඩනය (mmHg)",
    rr: "ශ්වසන වේගය",
    spo2: "ඔක්සිජන් මට්ටම (%)",
    critical: "අසාධ්‍ය",
    urgent: "හදිසි",
    nonUrgent: "හදිසි නොවන",
    notes: "වෛද්‍ය සටහන්",
    save: "සුරකින්න",
    occupancy: "පදිංචිය",
    beds: "ඇඳන්",
    language: "භාෂාව",
    logout: "පිටවන්න"
  }
};
