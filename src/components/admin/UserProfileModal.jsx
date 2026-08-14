import React from 'react';
import { X, Plane, BriefcaseMedical, Briefcase, HelpCircle, CalendarClock, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function UserProfileModal({ user, userPolicies, requests, agencies = [], departments = [], onClose, leaveTypes = [] }) {
  if (!user) return null;

  // กรองนโยบายวันลาเฉพาะของพนักงานคนนี้
  const userPolicyData = userPolicies.filter(p => p.user_id === user.id);
  
  // หาโควต้าตามประเภท
  const getPolicy = (type) => userPolicyData.find(p => p.leave_type === type) || { max_days: 0, used_days: 0, remaining_days: 0 };

  // คำนวณเปอร์เซ็นต์
  const getPercent = (used, max) => max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0;

  // กรองประวัติการลาเฉพาะของคนนี้เรียงจากใหม่ไปเก่า
  const userRequests = requests
    .filter(r => r.user_id === user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'approved':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> อนุมัติ</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> ไม่อนุมัติ</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 rounded-full text-xs font-bold flex items-center gap-1"><X className="w-3 h-3"/> ยกเลิก</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> รออนุมัติ</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[var(--bg-main)] w-full max-w-4xl max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-4">
            <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=random`} alt={user.fullname} className="w-24 h-24 rounded-2xl shadow-sm object-cover" />
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-blue-500" />
                ข้อมูลวันหยุด - {user.fullname}
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {agencies?.find(a => a.id === user.agency_id)?.name || user.agency_id || '-'} / {departments?.find(d => d.id === user.department_id)?.name || user.department_id || '-'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 min-h-0 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Quota Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaveTypes.length > 0 ? (
              leaveTypes.map(lt => {
                const policy = getPolicy(lt.name);
                const bgColors = lt.bg.replace('bg-', '');
                const textColors = lt.color.replace('text-', '');
                
                return (
                  <div key={lt.id} className={`border border-${bgColors}/30 rounded-2xl p-4 bg-${bgColors}/5`}>
                    <div className="flex justify-between items-start">
                      <div className={`p-2.5 ${lt.bg} text-white rounded-xl shadow-md shadow-${bgColors}/20`}>
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${lt.color}`}>{policy.remaining_days || 0}</div>
                        <div className="text-xs text-[var(--text-muted)]">คงเหลือ</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="font-bold text-[var(--text-main)]">{lt.name}</div>
                      <div className="text-xs text-[var(--text-muted)] mb-2">ใช้ไป {policy.used_days || 0}/{policy.max_days || 0} วัน</div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${lt.bg} rounded-full`} style={{ width: `${getPercent(policy.used_days, policy.max_days)}%` }}></div>
                      </div>
                      <div className="text-right text-[10px] text-[var(--text-muted)] mt-1">{getPercent(policy.used_days, policy.max_days)}% ใช้ไปแล้ว</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center text-[var(--text-muted)]">
                ไม่พบประเภทการลาในระบบ
              </div>
            )}
          </div>

          {/* History */}
          <div className="mt-8 bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-[var(--card-border)] bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                ประวัติการลา
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {userRequests.length === 0 ? (
                <div className="text-center text-[var(--text-muted)] py-6 text-sm">ไม่มีประวัติการลา</div>
              ) : (
                userRequests.map(req => (
                  <div key={req.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex justify-between items-start hover:border-blue-300 transition-colors">
                    <div>
                      <h4 className="font-bold text-[var(--text-main)] text-sm">{req.description || req.reason || 'ไม่ได้ระบุเหตุผล'}</h4>
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        {formatDate(req.date_start || req.start_date)} ถึง {formatDate(req.date_end || req.end_date)} ({req.leave_duration || req.total_days} วัน) • {req.leave_type}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1.5 opacity-70">
                        ส่งคำขอ: {formatDate(req.created_at)}
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
