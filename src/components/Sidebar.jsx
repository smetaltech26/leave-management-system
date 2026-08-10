import React from 'react';
import { Home, CheckSquare, Calendar, Users, Settings, FileText, PlusCircle, LogOut, ShieldCheck, X } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, setCurrentUser, pendingCount, onOpenLeaveModal, permissions, isMobileMenuOpen, setIsMobileMenuOpen }) {
  
  // ตรวจสอบสิทธิ์การเข้าถึงเมนูจาก Role ปัจจุบัน
  const checkPermission = (menuItemCode) => {
    if (!currentUser || !currentUser.role) return false;
    const perm = permissions?.find(p => p.MenuItems === menuItemCode);
    if (!perm) return false;
    // perm จะมี key เช่น "SuperAdmin", "Admin", "SuperUser", "User"
    return perm[currentUser.role] === true;
  };

  const navItems = [
    { 
      id: 'home', 
      label: 'หน้าหลัก', 
      icon: Home,
      show: checkPermission('sidebarManu1')
    },
    { 
      id: 'approval', 
      label: 'อนุมัติคำขอ', 
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : null,
      show: checkPermission('sidebarManu2')
    },
    { 
      id: 'calendar', 
      label: 'ปฏิทินวันลา', 
      icon: Calendar,
      show: checkPermission('sidebarManu3')
    },
    { 
      id: 'users', 
      label: 'พนักงาน & LINE', 
      icon: Users,
      show: checkPermission('sidebarManu6')
    },
    { 
      id: 'settings', 
      label: 'ตั้งค่าระบบ', 
      icon: Settings,
      show: checkPermission('sidebarManu14')
    },
    { 
      id: 'permissions', 
      label: 'สิทธิการใช้งาน', 
      icon: ShieldCheck,
      show: checkPermission('sidebarManu10')
    },
    { 
      id: 'report', 
      label: 'รายงาน', 
      icon: FileText,
      show: checkPermission('sidebarManu5')
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="group w-[5.5rem] hover:w-64 glass-panel-clean border-r border-slate-200 dark:border-[var(--card-border)] py-6 px-3 hidden md:flex flex-col justify-between min-h-[calc(100vh-65px)] transition-all duration-300 relative z-40 overflow-hidden">
        <div className="space-y-6">


          {/* Navigation Links */}
          <div className="space-y-2">
            <p className="px-3 text-sm font-extrabold text-center group-hover:text-left text-[var(--text-muted)] dark:text-[var(--text-muted)] uppercase tracking-wider mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">เมนูหลัก</p>
            {navItems.filter(item => item.show !== false).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center px-4 py-3.5 rounded-2xl font-bold text-base transition-all overflow-hidden ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'text-[var(--text-muted)] dark:text-[var(--text-muted)] hover:text-[var(--text-main)] dark:hover:text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-[var(--card-bg)]/60'
                  }`}
                >
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <Icon className={`w-[22px] h-[22px] ${isActive ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)] dark:group-hover:text-[var(--text-main)]'}`} />
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap ml-4">
                    {item.label}
                  </span>
                  
                  {item.badge && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-auto px-2 py-0.5 text-xs font-extrabold bg-rose-500 text-white rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 pb-4">
          <button
            onClick={() => setCurrentUser(null)}
            title="ออกจากระบบ"
            className="w-full flex items-center px-4 py-3.5 rounded-xl text-rose-500 hover:bg-rose-500/10 font-bold text-base transition-all border border-transparent group-hover:border-rose-500/20 overflow-hidden"
          >
            <div className="flex-shrink-0 flex items-center justify-center">
              <LogOut className="w-[22px] h-[22px]" />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap ml-4">
              ออกจากระบบ
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Drawer */}
      <aside className={`fixed top-0 left-0 bottom-0 w-72 glass-panel-clean border-r border-slate-200 dark:border-[var(--card-border)] py-6 px-3 flex flex-col justify-between z-50 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 mb-4">
            <span className="font-bold text-[var(--text-main)] text-lg">เมนูหลัก</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[var(--text-muted)] hover:text-slate-800 dark:hover:text-slate-200">
              <X className="w-6 h-6" />
            </button>
          </div>
          {/* Navigation Links */}
          <div className="space-y-2">
            {navItems.filter(item => item.show !== false).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  title={item.label}
                  className={`w-full flex items-center px-4 py-3.5 rounded-2xl font-bold text-base transition-all overflow-hidden ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'text-[var(--text-muted)] dark:text-[var(--text-muted)] hover:text-[var(--text-main)] dark:hover:text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-[var(--card-bg)]/60'
                  }`}
                >
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <Icon className={`w-[22px] h-[22px] ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                  </div>
                  <span className="ml-4">{item.label}</span>
                  
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-extrabold bg-rose-500 text-white rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 pb-4">
          <button
            onClick={() => setCurrentUser(null)}
            title="ออกจากระบบ"
            className="w-full flex items-center px-4 py-3.5 rounded-xl text-rose-500 hover:bg-rose-500/10 font-bold text-base transition-all border border-transparent overflow-hidden"
          >
            <div className="flex-shrink-0 flex items-center justify-center">
              <LogOut className="w-[22px] h-[22px]" />
            </div>
            <span className="ml-4">ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}
