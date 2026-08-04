import React, { useState } from 'react';
import { Lock, Mail, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

export default function FormLogin({ onLogin, users }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      onLogin(user);
    } else {
      setError('ไม่พบผู้ใช้งานด้วยอีเมลนี้ กรุณาตรวจสอบอีเมลหรือเลือกสลับผู้ใช้ตัวอย่างด้านล่างค่ะ');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card-clean rounded-3xl p-8 border border-[var(--card-border)] shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-emerald-400 font-extrabold text-2xl tracking-tight">SMT</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
            Leave Management System
          </h2>
          <p className="text-xs text-[var(--text-muted)]">ระบบจัดการคำขอลางานออนไลน์ (เวอร์ชัน 2.0 รองรับ 1:1 LINE Notify)</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">อีเมลผู้ใช้งาน</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="กรอกอีเมลของคุณ (เช่น admin@smetaltech.co.th)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm border-[var(--card-border)] bg-[var(--card-bg)]/60 text-[var(--text-main)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm border-[var(--card-border)] bg-[var(--card-bg)]/60 text-[var(--text-main)] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[var(--text-main)] font-semibold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] mt-2"
          >
            <span>เข้าสู่ระบบ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Logins */}
        <div className="mt-8 pt-6 border-t border-[var(--card-border)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] mb-3 text-center">หรือเลือกเข้าสู่ระบบด่วน (Demo Users)</p>
          <div className="space-y-2">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => onLogin(u)}
                className="w-full p-2.5 rounded-xl bg-[var(--card-bg)]/50 hover:bg-[var(--card-bg)]/80 border border-[var(--card-border)]/80 hover:border-emerald-500/40 text-left flex items-center justify-between transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <img src={u.avatar_url} alt={u.fullname} className="w-8 h-8 rounded-lg object-cover" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-main)] group-hover:text-emerald-400">{u.fullname}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] bg-[var(--card-bg)] text-[var(--text-muted)] rounded-md border border-[var(--card-border)] group-hover:bg-emerald-500/20 group-hover:text-emerald-400">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
