import React from 'react';
import { Home, CheckSquare, Calendar, Users, Settings, FileText, PlusCircle } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, pendingCount, onOpenLeaveModal }) {
  
  const navItems = [
    { id: 'home', label: 'หน้าหลัก', icon: Home },
    { 
      id: 'approval', 
      label: 'อนุมัติคำขอ', 
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : null,
      show: currentUser?.role === 'Manager' || currentUser?.role === 'Admin'
    },
    { id: 'calendar', label: 'ปฏิทินวันลา', icon: Calendar },
    { 
      id: 'users', 
      label: 'พนักงาน & LINE', 
      icon: Users,
      show: currentUser?.role === 'Admin' || currentUser?.role === 'Manager'
    },
    { 
      id: 'settings', 
      label: 'ตั้งค่าระบบ', 
      icon: Settings,
      show: currentUser?.role === 'Admin'
    },
    { id: 'report', label: 'รายงาน', icon: FileText },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 glass-panel-clean border-r border-slate-200 dark:border-[var(--card-border)] p-4 hidden md:flex flex-col justify-between min-h-[calc(100vh-65px)] transition-colors">
        <div className="space-y-6">
          
          {/* Quick Action Button */}
          <button
            onClick={onOpenLeaveModal}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-[var(--text-main)] font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>ยื่นคำขอลางาน</span>
          </button>

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-[var(--text-muted)] dark:text-slate-500 uppercase tracking-wider mb-2">เมนูหลัก</p>
            {navItems.filter(item => item.show !== false).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-[var(--card-bg)]/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-extrabold bg-rose-500 text-[var(--text-main)] rounded-full animate-pulse shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-[var(--card-bg)]/60 border border-slate-200 dark:border-[var(--card-border)]/80 text-center">
          <p className="text-xs font-semibold text-slate-600 dark:text-[var(--text-muted)]">SMT Leave System v2.0</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">LINE 1:1 Messaging Integrated</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel-clean border-t border-slate-200 dark:border-[var(--card-border)] z-40 px-2 py-2 flex items-center justify-around shadow-2xl">
        {navItems.filter(item => item.show !== false).slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl relative transition-all ${
                isActive ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-[var(--text-muted)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[var(--text-main)] text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
