import React, { useState } from 'react';
import { Bell, User, LogOut, Shield, ChevronDown, Sun, Moon, Sparkles } from 'lucide-react';

export default function Navbar({ currentUser, setCurrentUser, users, activeTab, setActiveTab, theme, toggleTheme }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <nav className="glass-panel-clean sticky top-0 z-40 px-4 py-3 border-b border-slate-200 dark:border-[var(--card-border)] transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 transform hover:scale-105 transition-all">
            <div className="w-full h-full bg-[var(--card-bg)] dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-emerald-400 font-black text-lg tracking-tight">SMT</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-[var(--text-main)] dark:text-[var(--text-main)] tracking-tight">
                Leave Management System
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                v2.0 1:1 LINE
              </span>
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

          {/* Quick User Switcher */}
          <div className="relative hidden md:block">
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const selected = users.find(u => u.id === e.target.value);
                if (selected) setCurrentUser(selected);
              }}
              className="glass-input-clean text-xs rounded-xl px-3 py-2 text-slate-700 dark:text-[var(--text-main)] focus:outline-none cursor-pointer border-slate-200 dark:border-[var(--card-border)]"
            >
              <option value="" disabled>-- สลับบัญชีทดสอบ --</option>
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-[var(--card-bg)] text-[var(--text-main)] dark:text-[var(--text-main)]">
                  {u.fullname} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* User Avatar Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2.5 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-[var(--card-bg)]/60 transition-all border border-transparent hover:border-slate-200 dark:hover:border-[var(--card-border)]"
            >
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser?.fullname}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/30"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-[var(--text-main)] dark:text-[var(--text-main)]">{currentUser?.fullname || 'ผู้ใช้งาน'}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  {currentUser?.role || 'Employee'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 glass-card-clean-clean rounded-2xl py-2 shadow-2xl z-50 border border-slate-200 dark:border-[var(--card-border)]">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-[var(--card-border)]">
                  <p className="text-xs text-[var(--text-muted)]">เข้าสู่ระบบในชื่อ</p>
                  <p className="text-sm font-semibold text-[var(--text-main)] dark:text-[var(--text-main)] truncate">{currentUser?.fullname}</p>
                  <p className="text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)] truncate">{currentUser?.email}</p>
                  {currentUser?.line_user_id ? (
                    <span className="mt-1.5 inline-flex items-center px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20 font-semibold">
                      ✅ ผูก LINE 1:1 เรียบร้อย
                    </span>
                  ) : (
                    <span className="mt-1.5 inline-flex items-center px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20 font-semibold">
                      ⚠️ ยังไม่ผูก LINE 1:1
                    </span>
                  )}
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-[var(--card-bg)] rounded-xl flex items-center space-x-2 font-medium"
                  >
                    <User className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>ตั้งค่าโปรไฟล์ & LINE Notify</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl flex items-center space-x-2 mt-1 font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </nav>
  );
}
