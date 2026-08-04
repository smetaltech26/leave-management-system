import React, { useState } from 'react';
import { Bell, User, LogOut, Shield, ChevronDown, Smartphone, Laptop } from 'lucide-react';

export default function Navbar({ currentUser, setCurrentUser, users, activeTab, setActiveTab }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <nav className="glass-panel sticky top-0 z-40 px-4 py-3 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-emerald-400 font-extrabold text-lg tracking-tighter">SMT</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                Leave Management System
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                v2.0 1:1 LINE
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">ระบบจัดการคำขอลางาน ออนไลน์ (S Metal Tech)</p>
          </div>
        </div>

        {/* Right Section: User Quick Switch & Profile */}
        <div className="flex items-center space-x-3">
          
          {/* Quick User Switcher for Testing */}
          <div className="relative hidden md:block">
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const selected = users.find(u => u.id === e.target.value);
                if (selected) setCurrentUser(selected);
              }}
              className="glass-input text-xs rounded-xl px-3 py-1.5 bg-slate-900/80 border border-slate-700 text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>-- สลับบัญชีทดสอบ --</option>
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                  {u.fullname} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* User Avatar Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-700"
            >
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser?.fullname}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/30"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">{currentUser?.fullname || 'ผู้ใช้งาน'}</div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  {currentUser?.role || 'Employee'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 glass-card rounded-2xl py-2 border border-slate-700 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-800">
                  <p className="text-xs text-slate-400">เข้าสู่ระบบในชื่อ</p>
                  <p className="text-sm font-semibold text-white truncate">{currentUser?.fullname}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
                  {currentUser?.line_user_id ? (
                    <span className="mt-1.5 inline-flex items-center px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                      ✅ ผูก LINE 1:1 แล้ว
                    </span>
                  ) : (
                    <span className="mt-1.5 inline-flex items-center px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
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
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 rounded-xl flex items-center space-x-2"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>ตั้งค่าโปรไฟล์ & LINE Notify</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center space-x-2 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
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
