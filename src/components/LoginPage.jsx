import React, { useState } from 'react';
import { Lock, User, AlertCircle, ChevronRight, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import logoUrl from '../assets/smt-logo.jpg';

export default function LoginPage({ onLogin, users, theme = 'light', toggleTheme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // ค้นหาพนักงานจาก users prop
      const user = users.find(
        (u) => 
          (u.email === username || u.id === username) && 
          u.password_hash === password
      );

      if (user) {
        onLogin(user);
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
      setIsLoading(false);
    }, 800); // จำลอง delay
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      {/* Overlay */}
      <div className={`absolute inset-0 backdrop-blur-md transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950/80' : 'bg-blue-50/70'}`}></div>

      <div className="w-full max-w-md relative z-10 p-8 rounded-3xl shadow-2xl border border-white/80 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transform transition-all hover:scale-[1.01]">
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="absolute top-4 right-4 p-2 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
          title={theme === 'dark' ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Logo Section */}
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-10 relative">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2 mb-6 border border-slate-100 overflow-hidden">
            <img src={logoUrl} alt="SMT Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2 text-center drop-shadow-sm relative inline-flex items-center justify-center flex-wrap gap-2">
            <span>Leave Management <span className="text-blue-600 dark:text-blue-400">System</span></span>
            <span className="text-blue-600 dark:text-blue-400 font-bold text-[10px] sm:text-xs animate-pulse bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md shadow-sm border border-blue-200 dark:border-blue-800 pointer-events-none align-super">
              New Version ✨
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 text-center bg-white/80 dark:bg-slate-800/80 px-4 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
            ระบบจัดการคำขอลางานออนไลน์
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl flex items-center space-x-3 animate-shake shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">Username (อีเมล)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/50 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner"
                  placeholder="กรอก Username หรือ UID"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">Password (รหัสผ่าน)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/50 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-4 px-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              <span className="flex items-center">
                เข้าสู่ระบบ
                <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            พบปัญหาการใช้งาน? ติดต่อ <span className="text-blue-600 dark:text-blue-400 font-bold">ฝ่ายบุคคล</span>
          </p>
        </div>
      </div>
    </div>
  );
}
