import React from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, PlusCircle, Sparkles, Send, TrendingUp, ShieldCheck, HeartPulse, Luggage } from 'lucide-react';

export default function HomeDashboard({ currentUser, userPolicies, requests, onOpenLeaveModal, setActiveTab }) {
  
  const myPolicies = userPolicies.filter(p => p.user_id === currentUser?.id);
  const myRequests = requests.filter(r => r.user_id === currentUser?.id);

  const pendingRequests = myRequests.filter(r => r.status === 'Pending');
  const approvedRequests = myRequests.filter(r => r.status === 'Approved');

  const leaveTypesLabel = {
    'Annual': { 
      name: 'ลาพักร้อน', 
      icon: Luggage, 
      bgLight: 'bg-amber-50', 
      textLight: 'text-amber-700', 
      borderLight: 'border-amber-200',
      gradient: 'from-amber-500 to-orange-500',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
    },
    'Sick': { 
      name: 'ลาป่วย', 
      icon: HeartPulse, 
      bgLight: 'bg-rose-50', 
      textLight: 'text-rose-700', 
      borderLight: 'border-rose-200',
      gradient: 'from-rose-500 to-pink-500',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
    },
    'Personal': { 
      name: 'ลากิจได้รับค่าจ้าง', 
      icon: ShieldCheck, 
      bgLight: 'bg-blue-50', 
      textLight: 'text-blue-700', 
      borderLight: 'border-blue-200',
      gradient: 'from-blue-500 to-cyan-500',
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
    },
    'Other': { 
      name: 'อื่นๆ', 
      icon: Calendar, 
      bgLight: 'bg-purple-50', 
      textLight: 'text-purple-700', 
      borderLight: 'border-purple-200',
      gradient: 'from-purple-500 to-indigo-500',
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
    },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Premium Hero Welcome Banner */}
      <div className="glass-card-clean rounded-3xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl shadow-teal-500/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold border border-white/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ระบบลางานยุคใหม่ Clean & Premium Design</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              สวัสดีค่ะคุณ {currentUser?.fullname} 👋
            </h2>
            <p className="text-emerald-100 text-xs md:text-sm font-medium">
              สังกัด: {currentUser?.agency_id || 'SMT'} | ฝ่าย: {currentUser?.department_id || 'ทั่วไป'} | ตำแหน่ง: {currentUser?.role}
            </p>
          </div>

          <button
            onClick={onOpenLeaveModal}
            className="py-3.5 px-6 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-105 active:scale-95 shrink-0 text-sm"
          >
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <span>ยื่นใบลาใหม่</span>
          </button>
        </div>
      </div>

      {/* Leave Quota Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <span>📊 สิทธิ์วันลาคงเหลือประจำปี 2026</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {myPolicies.length > 0 ? (
            myPolicies.map((pol) => {
              const meta = leaveTypesLabel[pol.leave_type] || { 
                name: pol.leave_type, 
                icon: Calendar, 
                gradient: 'from-teal-500 to-emerald-500',
                badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
              };
              const Icon = meta.icon;
              const percentUsed = Math.min(100, (pol.used_days / pol.max_days) * 100);
              const remaining = pol.remaining_days;

              return (
                <div key={pol.id} className="glass-card-clean rounded-3xl p-6 border border-slate-200 dark:border-slate-800 relative space-y-4">
                  
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${meta.gradient} flex items-center justify-center text-white shadow-md`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-800 dark:text-white">{meta.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">สิทธิ์ทั้งหมด {pol.max_days} วัน</span>
                  </div>

                  {/* Main Value Display */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{remaining}</span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1.5">วันคงเหลือ</span>
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      ใช้ไปแล้ว <span className="font-bold text-slate-700 dark:text-slate-200">{pol.used_days}</span> วัน
                    </div>
                  </div>

                  {/* Clean Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                      <div
                        className={`h-full bg-gradient-to-r ${meta.gradient} transition-all duration-500 rounded-full`}
                        style={{ width: `${percentUsed}%` }}
                      ></div>
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="col-span-full glass-card-clean p-8 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-sm">
              ยังไม่มีการกำหนดโควตาวันลา กรุณาติดต่อ HR หรือ Admin ค่ะ
            </div>
          )}
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            🕒 ประวัติคำขอลางานล่าสุดของคุณ ({myRequests.length})
          </h3>
          <button onClick={() => setActiveTab('calendar')} className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            ดูปฏิทินทั้งหมด →
          </button>
        </div>

        {myRequests.length > 0 ? (
          <div className="space-y-3">
            {myRequests.map((req) => {
              const meta = leaveTypesLabel[req.leave_type] || { name: req.leave_type, badge: 'text-slate-700 dark:text-slate-300' };

              return (
                <div key={req.id} className="glass-card-clean rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-extrabold text-sm shrink-0">
                      {req.id.replace('LEV-', '#')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{meta.name}</span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">• {req.leave_duration} วัน</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">{req.description}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        ช่วงเวลา: <span className="font-semibold text-slate-700 dark:text-slate-300">{req.date_start}</span> ถึง <span className="font-semibold text-slate-700 dark:text-slate-300">{req.date_end}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center space-x-3 self-end md:self-center">
                    {req.status === 'Pending' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-xl">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>รออนุมัติ Step {req.current_step}</span>
                      </span>
                    )}
                    {req.status === 'Approved' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>อนุมัติแล้ว</span>
                      </span>
                    )}
                    {req.status === 'Rejected' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 rounded-xl">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span>ไม่อนุมัติ</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card-clean rounded-3xl p-10 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <Send className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">คุณยังไม่มีคำขอลางานในขณะนี้</p>
            <button
              onClick={onOpenLeaveModal}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              + คลิกเพื่อยื่นใบลาใหม่
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
