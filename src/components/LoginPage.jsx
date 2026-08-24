import React, { useState } from 'react';
import { Lock, User, AlertCircle, Eye, EyeOff, Moon, Sun, Info, X } from 'lucide-react';
import logoUrl from '../assets/smt-logo.jpg';
import { supabase } from '../lib/supabase';

export default function LoginPage({ onLogin, theme = 'light', toggleTheme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // State for HR Popup
  const [showHRPopup, setShowHRPopup] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // ปิด focus และเริ่มซ่อนคีย์บอร์ดทันที
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    
    setError('');
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: username.trim(),
        password: password
      });

      if (signInError) throw signInError;

      // เราไม่จำเป็นต้องโหลด Profile ที่นี่ก็ได้ เพราะ App.jsx จะตรวจจับ onAuthStateChange
      // แต่เราสามารถเรียก onLogin พร้อมข้อมูลเพื่อ trigger UI ได้
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, fullname, agency_id, department_id, role, approver_step1_id, approver_step2_id, approver_step3_id, line_user_id, avatar_url, employee_id, created_at, auth_id')
        .eq('auth_id', data.user.id)
        .single();
        
      if (userError || !userData) {
         throw new Error('ไม่พบข้อมูลพนักงาน หรือยังไม่ได้เชื่อมโยงบัญชี');
      }

      const resetLoginViewport = () => {
        const documentScroller = document.scrollingElement;
        if (documentScroller) {
          documentScroller.scrollTop = 0;
          documentScroller.scrollLeft = 0;
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      };
      
      resetLoginViewport();
      requestAnimationFrame(() => {
        resetLoginViewport();
        requestAnimationFrame(() => {
          resetLoginViewport();
          onLogin(userData);
        });
      });

    } catch (err) {
      console.error("Login Error:", err);
      // แสดง error ตามจริงเพื่อ debug
      if (err.message && err.message.includes('Invalid login credentials')) {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError(err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      {/* Background layer */}
      <div className={`absolute inset-0 transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}></div>

      <div className="w-full max-w-md relative z-10 p-8 rounded-3xl shadow-xl bg-white dark:bg-slate-900 transition-all">
        
        {/* Theme Toggle Button & New Version top right inside card */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <span className="text-blue-600 dark:text-blue-400 font-bold text-[10px] animate-pulse bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md shadow-sm border border-blue-100 dark:border-blue-800 pointer-events-none">
            New Version ✨
          </span>
          <button 
            onClick={toggleTheme} 
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            title={theme === 'dark' ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Logo and Title Section */}
        <div className="flex items-center justify-center mt-4 mb-6 space-x-3">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-1 border border-slate-100 overflow-hidden shrink-0">
            <img src={logoUrl} alt="SMT Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Leave Management System (LMS)
          </h1>
        </div>
        
        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-6">
          เข้าสู่ระบบ
        </h2>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl flex items-center space-x-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">อีเมลหรือชื่อผู้ใช้</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  placeholder="ป้อนอีเมลหรือชื่อผู้ใช้ของคุณ"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  placeholder="ป้อนรหัสผ่านของคุณ"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <div className={`block w-9 h-5 rounded-full transition-colors ${rememberMe ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform transform ${rememberMe ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-2 text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">จดจำรหัสผ่าน</span>
            </label>
            <button 
              type="button" 
              onClick={() => setShowHRPopup(true)}
              className="text-blue-500 hover:text-blue-600 font-medium text-xs sm:text-sm"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600/30 dark:hover:bg-blue-600/50 dark:border dark:border-blue-500/50 text-white dark:text-blue-300 font-medium rounded-xl shadow-sm dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>กำลังเข้าสู่ระบบ...</span>
              </span>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center justify-center space-y-4">
          <div className="text-center text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400">ยังไม่มีบัญชีใช่ไหม? </span>
            <button 
              type="button" 
              onClick={() => setShowHRPopup(true)}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              สมัครสมาชิก
            </button>
          </div>
          <p className="text-[13px] font-bold text-[#2ab9d0]">
            Create by S Metal Tech Co., Ltd.
          </p>
        </div>
      </div>
      
      {/* HR Contact Popup Modal */}
      {showHRPopup && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl flex flex-col overflow-hidden max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0 shadow-2xl">
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Info className="w-5 h-5" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">แจ้งเตือน</h3>
              </div>
              <button 
                onClick={() => setShowHRPopup(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 min-h-0 overflow-y-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">ติดต่อฝ่ายบุคคล</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  หากต้องการสมัครสมาชิกใหม่ หรือลืมรหัสผ่าน กรุณาติดต่อฝ่ายบุคคล (HR) เพื่อดำเนินการค่ะ
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button 
                onClick={() => setShowHRPopup(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-medium rounded-xl transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
