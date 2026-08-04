import React from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, PlusCircle, Sparkles, Send, ShieldCheck, HeartPulse, Luggage } from 'lucide-react';

export default function HomeDashboard({ currentUser, userPolicies, requests, onOpenLeaveModal, setActiveTab }) {
  
  const myPolicies = userPolicies.filter(p => p.user_id === currentUser?.id);
  const myRequests = requests.filter(r => r.user_id === currentUser?.id);

  const leaveTypesLabel = {
    'Annual': { 
      name: 'ลาพักร้อน', 
      icon: Luggage, 
      badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
      bar: 'from-amber-500 to-orange-500'
    },
    'Sick': { 
      name: 'ลาป่วย', 
      icon: HeartPulse, 
      badge: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40',
      bar: 'from-rose-500 to-pink-500'
    },
    'Personal': { 
      name: 'ลากิจได้รับค่าจ้าง', 
      icon: ShieldCheck, 
      badge: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40',
      bar: 'from-blue-500 to-cyan-500'
    },
    'Other': { 
      name: 'อื่นๆ', 
      icon: Calendar, 
      badge: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40',
      bar: 'from-purple-500 to-indigo-500'
    },
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      
      {/* Premium Hero Welcome Banner */}
      <div className="rounded-3xl p-7 md:p-9 relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-xl shadow-teal-600/15">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs md:text-sm font-bold border border-white/30">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>ระบบลางานยุคใหม่ Clean & High-Contrast Typography</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm">
              สวัสดีค่ะคุณ {currentUser?.fullname} 👋
            </h2>
            <p className="text-emerald-100 text-sm md:text-base font-semibold">
              สังกัด: {currentUser?.agency_id || 'SMT'} | ฝ่าย: {currentUser?.department_id || 'ทั่วไป'} | ตำแหน่ง: {currentUser?.role}
            </p>
          </div>

          <button
            onClick={onOpenLeaveModal}
            className="py-4 px-7 bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold rounded-2xl shadow-xl flex items-center justify-center space-x-2.5 transition-all transform hover:scale-105 active:scale-95 shrink-0 text-base border-2 border-emerald-100"
          >
            <PlusCircle className="w-6 h-6 text-emerald-600" />
            <span>ยื่นใบลาใหม่</span>
          </button>
        </div>
      </div>

      {/* Leave Quota Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            📊 สิทธิ์วันลาคงเหลือประจำปี 2026
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myPolicies.length > 0 ? (
            myPolicies.map((pol) => {
              const meta = leaveTypesLabel[pol.leave_type] || { 
                name: pol.leave_type, 
                icon: Calendar, 
                badge: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200',
                bar: 'from-teal-500 to-emerald-500'
              };
              const Icon = meta.icon;
              const percentUsed = Math.min(100, (pol.used_days / pol.max_days) * 100);

              return (
                <div key={pol.id} className="glass-card-clean rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 relative space-y-5 shadow-lg">
                  
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white">{meta.name}</span>
                    </div>
                    <span className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400">สิทธิ์ {pol.max_days} วัน</span>
                  </div>

                  {/* Big Number Display */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{pol.remaining_days}</span>
                      <span className="text-sm font-extrabold text-slate-600 dark:text-slate-400 ml-2">วันคงเหลือ</span>
                    </div>
                    <div className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400">
                      ใช้ไป <span className="font-extrabold text-slate-900 dark:text-white">{pol.used_days}</span> วัน
                    </div>
                  </div>

                  {/* Clean Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-300/50 dark:border-slate-700">
                      <div
                        className={`h-full bg-gradient-to-r ${meta.bar} transition-all duration-500 rounded-full`}
                        style={{ width: `${percentUsed}%` }}
                      ></div>
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="col-span-full glass-card-clean p-8 rounded-3xl text-center text-slate-600 dark:text-slate-400 text-base font-bold">
              ยังไม่มีการกำหนดโควตาวันลา กรุณาติดต่อ HR หรือ Admin ค่ะ
            </div>
          )}
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            🕒 ประวัติคำขอลางานล่าสุดของคุณ ({myRequests.length})
          </h3>
          <button onClick={() => setActiveTab('calendar')} className="text-sm text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline">
            ดูปฏิทินทั้งหมด →
          </button>
        </div>

        {myRequests.length > 0 ? (
          <div className="space-y-3.5">
            {myRequests.map((req) => {
              const meta = leaveTypesLabel[req.leave_type] || { name: req.leave_type };

              return (
                <div key={req.id} className="glass-card-clean rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-base shrink-0">
                      {req.id.replace('LEV-', '#')}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">{meta.name}</span>
                        <span className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400">• {req.leave_duration} วัน</span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{req.description}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        ช่วงเวลา: <span className="font-bold text-slate-800 dark:text-slate-200">{req.date_start}</span> ถึง <span className="font-bold text-slate-800 dark:text-slate-200">{req.date_end}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center space-x-3 self-end md:self-center">
                    {req.status === 'Pending' && (
                      <span className="inline-flex items-center space-x-2 px-4 py-2 text-xs md:text-sm font-extrabold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 rounded-xl">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>รออนุมัติ Step {req.current_step}</span>
                      </span>
                    )}
                    {req.status === 'Approved' && (
                      <span className="inline-flex items-center space-x-2 px-4 py-2 text-xs md:text-sm font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>อนุมัติแล้ว</span>
                      </span>
                    )}
                    {req.status === 'Rejected' && (
                      <span className="inline-flex items-center space-x-2 px-4 py-2 text-xs md:text-sm font-extrabold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 rounded-xl">
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>ไม่อนุมัติ</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card-clean rounded-3xl p-10 text-center text-slate-600 dark:text-slate-400 space-y-3">
            <Send className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-base font-bold">คุณยังไม่มีคำขอลางานในขณะนี้</p>
            <button
              onClick={onOpenLeaveModal}
              className="text-sm text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline"
            >
              + คลิกเพื่อยื่นใบลาใหม่
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
