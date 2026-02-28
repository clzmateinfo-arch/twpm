import React from 'react';
import { useHospital } from '../HospitalContext';
import { UserRole, TRANSLATIONS } from '../types';
import {
  LayoutDashboard,
  UserPlus,
  Stethoscope,
  Activity,
  ClipboardList,
  Settings,
  LogOut,
  Globe,
  Bell,
  Menu,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 mb-1 transition-colors rounded-lg ${active
      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    <span className="mr-3">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<{
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void
}> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, language, setLanguage, setCurrentUser, patients } = useHospital();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const t = TRANSLATIONS[language];

  const criticalPatients = patients.filter(p => p.triageLevel === 'CRITICAL' && p.status === 'QUEUE');
  const criticalCount = criticalPatients.length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: [UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN] },
    { id: 'registration', label: t.patientRegistration, icon: <UserPlus size={20} />, roles: [UserRole.NURSE, UserRole.ADMIN] },
    { id: 'vitals', label: t.vitalSigns, icon: <Activity size={20} />, roles: [UserRole.NURSE, UserRole.ADMIN] },
    { id: 'queue', label: t.priorityQueue, icon: <ClipboardList size={20} />, roles: [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN] },
    { id: 'wards', label: t.wardManagement, icon: <Stethoscope size={20} />, roles: [UserRole.ADMIN, UserRole.DOCTOR] },
    { id: 'users', label: 'User Directory', icon: <UserPlus size={20} />, roles: [UserRole.ADMIN] },
    { id: 'audit', label: t.auditTrail, icon: <ShieldCheck size={20} />, roles: [UserRole.ADMIN, UserRole.IT_SUPPORT] },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, roles: [UserRole.ADMIN, UserRole.IT_SUPPORT] },
  ];

  const filteredNavItems = navItems.filter(item => currentUser && item.roles.includes(currentUser.role));

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="relative flex flex-col bg-slate-900 border-r border-slate-800"
      >
        <div className="p-6">
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/20">
              <Stethoscope className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">{t.title}</h1>
          </div>

          <nav className="flex-1">
            <p className="px-4 mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">{t.hospitalName}</p>
            {filteredNavItems.map(item => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center p-3 mb-4 bg-slate-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-emerald-400">{currentUser?.name.charAt(0)}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{currentUser?.role}</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            {t.logout}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-bottom border-slate-800 flex items-center justify-between px-8 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-4 text-slate-400 hover:text-white transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-lg font-semibold text-white">
              {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${language === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('si')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${language === 'si' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                සිං
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 transition-colors relative rounded-lg ${isNotificationsOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Bell size={20} />
                {criticalCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                    {criticalCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Notifications</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{criticalCount} Urgent</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {criticalPatients.length > 0 ? (
                        criticalPatients.map(p => (
                          <div key={p.id} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => { setIsNotificationsOpen(false); setActiveTab('queue'); }}>
                            <div className="flex items-start">
                              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center mr-3 shrink-0">
                                <AlertCircle size={16} className="text-rose-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">Critical Patient: {p.name}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Immediate attention required in triage queue.</p>
                                <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-tighter">SpO2: {p.vitals?.spo2}% • BP: {p.vitals?.bpSystolic}/{p.vitals?.bpDiastolic}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-xs text-slate-500 italic">No new notifications</p>
                        </div>
                      )}
                    </div>
                    {criticalPatients.length > 0 && (
                      <button
                        onClick={() => { setIsNotificationsOpen(false); setActiveTab('queue'); }}
                        className="w-full p-3 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/5 transition-colors border-t border-slate-800"
                      >
                        View All in Queue
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
