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
    dashboard: "Dashboard",
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
    userDirectory: "User Directory",
    settings: "Settings",
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
    logout: "Logout",
    totalPatients: "Total Patients",
    criticalCases: "Critical Cases",
    avgWaitTime: "Avg. Wait Time",
    triageDistribution: "Real-time Triage Distribution",
    recentAdmissions: "Recent Admissions",
    admit: "Admit to Ward",
    discharge: "Discharge",
    confirmDischarge: "Confirm Discharge",
    treatmentPlan: "Treatment Plan",
    prescribeMed: "Prescribe Medication",
    instructions: "Instructions",
    diagnosis: "Final Diagnosis",
    advice: "Post-Discharge Advice",
    followUp: "Follow-Up Date",
    patient: "Patient",
    vitals: "Vitals",
    action: "Action",
    priority: "Priority",
    waitingPatients: "Patients Waiting",
    noPatients: "No patients in queue",
    ward: "Ward",
    bedNumber: "Bed Number",
    role: "Role",
    status: "Status",
    addUser: "Add New User",
    username: "Username",
    password: "Password",
    saveNotes: "Save Notes",
    inQueue: "In Queue",
    admitted: "Admitted",
    discharged: "Discharged",
    systemUserManagement: "System User Management",
    provisionAccount: "Provision New Account",
    staffDirectory: "Active Staff Directory",
    timestamp: "Timestamp",
    user: "User",
    details: "Details",
    searchLogs: "Search logs...",
    loadingDirectory: "Loading directory...",
    active: "Active",
    disabled: "Disabled",
    deactivate: "Deactivate",
    deactivateConfirm: "Are you sure you want to deactivate this user?",
    fullName: "Full Name",
    systemRole: "System Role",
    createAccount: "Create Account",
    credentialsGenerated: "Credentials Generated",
    wardOccupancyOverview: "Ward Occupancy Overview",
    securityTitle: "TWPMS Security",
    authenticateContinue: "Please authenticate to continue",
    authenticating: "Authenticating...",
    secureLogin: "Secure Login",
    actionRequired: "Action Required",
    passwordResetDetail: "For security, you must reset your temporary password before proceeding.",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    updatePassword: "Update Password",
    updatingSecurity: "Updating Security...",
    cancelLogout: "Cancel & Logout",
    myProfile: "My Profile",
    manageSecurity: "Manage your account security",
    changePassword: "Change Password"
  },
  si: {
    title: "ClinQ",
    hospitalName: "මල්වතුහිරිපිටිය ප්‍රාදේශීය රෝහල",
    dashboard: "මුහුණත",
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
    userDirectory: "පරිශීලක ලැයිස්තුව",
    settings: "සැකසුම්",
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
    logout: "පිටවන්න",
    totalPatients: "මුළු රෝගීන්",
    criticalCases: "අසාධ්‍ය රෝගීන්",
    avgWaitTime: "සාමාන්්‍ය රැඳී සිටීමේ කාලය",
    triageDistribution: "රියල් ටයිම් ප්‍රමුඛතා ව්‍යාප්තිය",
    recentAdmissions: "මෑතකදී ඇතුළත් කළ රෝගීන්",
    admit: "වාට්ටුවට ඇතුළත් කරන්න",
    discharge: "මුදා හරින්න",
    confirmDischarge: "නිදහස් කිරීම තහවුරු කරන්න",
    treatmentPlan: "ප්‍රතිකාර සැලැස්ම",
    prescribeMed: "ඖෂධ නියම කරන්න",
    instructions: "උපදෙස්",
    diagnosis: "අවසාන රෝග විනිශ්චය",
    advice: "මුදා හැරීමෙන් පසු උපදෙස්",
    followUp: "නැවත සායනයට පැමිණිය යුතු දිනය",
    patient: "රෝගියා",
    vitals: "වැදගත් දත්ත",
    action: "පියවර",
    priority: "ප්‍රමුඛතාවය",
    waitingPatients: "රෝගීන් පෝලිමේ සිටී",
    noPatients: "පෝලිමේ රෝගීන් නැත",
    ward: "වාට්ටුව",
    bedNumber: "ඇඳ අංකය",
    role: "භූමිකාව",
    status: "තත්වය",
    addUser: "නව පරිශීලකයෙකු එක් කරන්න",
    username: "පරිශීලක නාමය",
    password: "මුරපදය",
    saveNotes: "සටහන් සුරකින්න",
    inQueue: "පෝලිමේ සිටී",
    admitted: "ඇතුළත් කර ඇත",
    discharged: "මුදා හැර ඇත",
    systemUserManagement: "පද්ධති පරිශීලක කළමනාකරණය",
    provisionAccount: "නව ගිණුමක් ආරම්භ කරන්න",
    staffDirectory: "කාර්ය මණ්ඩල නාමාවලිය",
    timestamp: "කාලය",
    user: "පරිශීලකයා",
    details: "විස්තර",
    searchLogs: "වාර්තා සොයන්න...",
    loadingDirectory: "නාමාවලිය පූරණය වෙමින් පවතී...",
    active: "ක්‍රියාකාරී",
    disabled: "අක්‍රීය",
    deactivate: "අක්‍රීය කරන්න",
    deactivateConfirm: "ඔබට විශ්වාසද මෙම පරිශීලකයා අක්‍රීය කිරීමට අවශ්‍ය බව?",
    fullName: "සම්පූර්ණ නම",
    systemRole: "පද්ධති භූමිකාව",
    createAccount: "ගිණුම සාදන්න",
    credentialsGenerated: "තොරතුරු සාදන ලදී",
    wardOccupancyOverview: "වාට්ටු පදිංචිය පිළිබඳ දළ විශ්ලේෂණය",
    securityTitle: "TWPMS ආරක්ෂණ පද්ධතිය",
    authenticateContinue: "ඉදිරියට යාමට කරුණාකර ඇතුළු වන්න",
    authenticating: "පරීක්ෂා කරමින් පවතී...",
    secureLogin: "ආරක්ෂිතව ඇතුළු වන්න",
    actionRequired: "වැදගත් පියවරක් අවශ්‍යයි",
    passwordResetDetail: "ආරක්ෂක හේතූන් මත, ඉදිරියට යාමට පෙර ඔබ විසින් තාවකාලික මුරපදය වෙනස් කළ යුතුය.",
    currentPassword: "වත්මන් මුරපදය",
    newPassword: "නව මුරපදය",
    confirmNewPassword: "නව මුරපදය තහවුරු කරන්න",
    updatePassword: "මුරපදය යාවත්කාලීන කරන්න",
    updatingSecurity: "යාවත්කාලීන කරමින් පවතී...",
    cancelLogout: "අවලංගු කර පිටවන්න",
    myProfile: "පරිශීලක ගිණුම",
    manageSecurity: "ඔබේ ගිණුමේ ආරක්ෂාව කළමනාකරණය කරන්න",
    changePassword: "මුරපදය වෙනස් කරන්න"
  }
};
