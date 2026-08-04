import React from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, PlusCircle, AlertCircle, Sparkles, Send } from 'lucide-react';

export default function HomeDashboard({ currentUser, userPolicies, requests, onOpenLeaveModal, setActiveTab }) {
  
  // กรองเฉพาะสิทธิ์วันลาของ currentUser
  const myPolicies = userPolicies.filter(p => p.user_id === currentUser?.id);

  // กรองเฉพาะรายการคำขอลาของ currentUser
  const myRequests = requests.filter(r => r.user_id === currentUser?.id);

  const pendingRequests = myRequests.filter(r => r.status === 'Pending');
  const approvedRequests = myRequests.filter(r => r.status === 'Approved');

  const leaveTypesLabel = {
    'Annual': { name: 'ลาพักร้อน', color: 'from-amber-500 to-orange-500', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    'Sick': { name: 'ลาป่วย', color: 'from-rose-500 to-pink-500', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
    'Personal': { name: 'ลากิจ', color: 'from-blue-500 to-cyan-500', text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    'Other': { name: 'อื่นๆ', color: 'from-purple-500 to-indigo-500', text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    'Maternity': { name: 'ลาคลอด', color: 'from-pink-500 to-rose-400', text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ยินดีต้อนรับสู่ระบบลางานเวอร์ชัน 2.0</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              สวัสดีค่ะคุณ <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{currentUser?.fullname}</span> 👋
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              สังกัด: {currentUser?.agency_id || 'SMT'} | ฝ่าย: {currentUser?.department_id || 'ทั่วไป'} | สิทธิ์การใช้งาน: {currentUser?.role}
            </p>
          </div>

          <button
            onClick={onOpenLeaveModal}
            className="py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform hover:scale-105 active:scale-95 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>ยื่นใบลาใหม่</span>
          </button>
        </div>
      </div>

      {/* Leave Quota Cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          📊 สิทธิ์วันลาคงเหลือประจำปี 2026
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myPolicies.length > 0 ? (
            myPolicies.map((pol) => {
              const meta = leaveTypesLabel[pol.leave_type] || { name: pol.leave_type, color: 'from-slate-500 to-slate-700', text: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-700' };
              const percentUsed = Math.min(100, (pol.used_days / pol.max_days) * 100);

              return (
                <div key={pol.id} className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${meta.bg} ${meta.text} border ${meta.border}`}>
                      {meta.name}
                    </span>
                    <span className="text-xs text-slate-400">สิทธิ์ทั้งหมด {pol.max_days} วัน</span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-3xl font-extrabold text-white">{pol.remaining_days}</span>
                      <span className="text-xs text-slate-400 ml-1">วันคงเหลือ</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      ใช้ไปแล้ว <span className="font-semibold text-slate-200">{pol.used_days}</span> วัน
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full bg-gradient-to-r ${meta.color} transition-all duration-500`}
                      style={{ width: `${percentUsed}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full glass-card p-6 rounded-2xl text-center text-slate-400 text-sm">
              ยังไม่มีการกำหนดโควตาวันลา กรุณาติดต่อ HR หรือ Admin ค่ะ
            </div>
          )}
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            🕒 ประวัติคำขอลางานล่าสุดของคุณ ({myRequests.length})
          </h3>
          <button onClick={() => setActiveTab('calendar')} className="text-xs text-emerald-400 hover:underline">
            ดูปฏิทินทั้งหมด →
          </button>
        </div>

        {myRequests.length > 0 ? (
          <div className="space-y-3">
            {myRequests.map((req) => {
              const meta = leaveTypesLabel[req.leave_type] || { name: req.leave_type, text: 'text-slate-300' };

              return (
                <div key={req.id} className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 text-emerald-400 font-bold shrink-0">
                      {req.id.replace('LEV-', '#')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold text-sm ${meta.text}`}>{meta.name}</span>
                        <span className="text-xs text-slate-400">• {req.leave_duration} วัน</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">{req.description}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        ช่วงเวลา: {req.date_start} ถึง {req.date_end}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center space-x-3 self-end md:self-center">
                    {req.status === 'Pending' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                        <Clock className="w-3.5 h-3.5" />
                        <span>รออนุมัติ Step {req.current_step}</span>
                      </span>
                    )}
                    {req.status === 'Approved' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>อนุมัติแล้ว</span>
                      </span>
                    )}
                    {req.status === 'Rejected' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ไม่อนุมัติ</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <Send className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm">คุณยังไม่มีคำขอลางานในขณะนี้</p>
            <button
              onClick={onOpenLeaveModal}
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              + คลิกเพื่อยื่นใบลาใหม่
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
