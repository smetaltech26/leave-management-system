import React, { useState } from 'react';
import { Bell, User, LogOut, Shield, ChevronDown, Sun, Moon, Sparkles } from 'lucide-react';

export default function Navbar({ currentUser, setCurrentUser, users, activeTab, setActiveTab, theme, toggleTheme }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <nav className="glass-panel-clean sticky top-0 z-50 px-4 py-3 border-b border-slate-200 dark:border-[var(--card-border)] transition-colors">
      <div className="w-full flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex items-center justify-center">
            <img src="/smt-logo.jpg" alt="SMT Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-[var(--text-main)] dark:text-[var(--text-main)] tracking-tight">
                Leave Management System
              </h1>
            </div>
            <p className="text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)] hidden sm:block">ระบบจัดการคำขอลางานออนไลน์ (S Metal Tech)</p>
          </div>
        </div>

        {/* Right Section: Theme Toggle, User Switch & Profile */}
        <div className="flex items-center space-x-3">
          
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[var(--card-bg)]/80 text-[var(--text-muted)] dark:text-[var(--text-muted)] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-[var(--card-border)] flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
            title="สลับโทนสว่าง / โทนมืด"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="hidden sm:inline text-amber-400">โหมดสว่าง</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline text-indigo-600">โหมดมืด</span>
              </>
            )}
          </button>



          {/* User Avatar Menu */}
          <div className="relative">
            <div
              className="flex items-center space-x-2.5 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-[var(--card-bg)]/60 transition-all border border-transparent hover:border-slate-200 dark:hover:border-[var(--card-border)]"
            >
              <img
                src={currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullname || 'User')}&background=random`}
                alt={currentUser?.fullname}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/30"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullname || 'User')}&background=random`; }}
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-[var(--text-main)] dark:text-[var(--text-main)]">{currentUser?.fullname || 'ผู้ใช้งาน'}</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  {currentUser?.role || 'Employee'}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </nav>
  );
}
