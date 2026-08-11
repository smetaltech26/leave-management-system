import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Clock, XCircle, FileText, User, Calendar, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LeaveDetailsModal({ isOpen, onClose, request, user, allPolicies = [], users, agencies, departments }) {
  const [approvalSteps, setApprovalSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && request) {
      // ดึงข้อมูลขั้นตอนการอนุมัติจาก request object โดยตรง (รองรับข้อมูลที่เพิ่งสร้างใหม่)
      if (request.approvers && request.approvers.length > 0) {
        // Map ข้อมูลให้อยู่ในโครงสร้างเดียวกับที่ UI ต้องการ
        const mappedSteps = request.approvers.map(a => ({
          ...a,
          approver: {
            fullname: a.approver_name || a.approver_id,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(a.approver_name || a.approver_id)}&background=random`
          }
        })).sort((a, b) => a.step_number - b.step_number);
        setApprovalSteps(mappedSteps);
      } else {
        setApprovalSteps([]);
      }
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(-2)}`;
  };

  // Calculate Policy Usage (if policies are provided)
  const policy = allPolicies.find(p => p.leave_type === request.leave_type && p.user_id === request.user_id);
  const quota = policy ? Number(policy.max_days) : 0;
  const used = policy ? Number(policy.used_days) : 0;
  const remaining = policy ? Number(policy.remaining_days) : 0;
  const percentage = quota > 0 ? Math.round((used / quota) * 100) : 0;

  const leaveTypeMap = {
    'Annual': { name: 'ลาพักร้อน', color: 'text-blue-500', bg: 'bg-blue-500' },
    'Sick': { name: 'ลาป่วย', color: 'text-rose-500', bg: 'bg-rose-500' },
    'Personal': { name: 'ลากิจ', color: 'text-purple-500', bg: 'bg-purple-500' },
    'Other': { name: 'ลาอื่นๆ', color: 'text-amber-500', bg: 'bg-amber-500' },
    'Maternity': { name: 'ลาคลอด', color: 'text-pink-500', bg: 'bg-pink-500' },
    'Study': { name: 'ลาศึกษา', color: 'text-orange-500', bg: 'bg-orange-500' },
    'Military': { name: 'ลาทหาร', color: 'text-sky-500', bg: 'bg-sky-500' },
  };

  const typeInfo = leaveTypeMap[request.leave_type] || { name: request.leave_type, color: 'text-slate-500', bg: 'bg-slate-500' };

  return (
    <div className="fixed top-0 left-0 w-full h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] shadow-2xl w-[90vw] md:w-full md:max-w-2xl max-h-[calc(100dvh-2rem)] md:max-h-[85dvh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 relative" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 shadow-inner`}>
              <FileText className={`w-5 h-5 ${typeInfo.color}`} />
            </div>
            <div className="min-w-0 pr-2">
              <h2 className="text-sm md:text-base lg:text-lg font-bold text-[var(--text-main)] leading-tight">รายละเอียดคำขอ {request.id}</h2>
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium truncate mt-0.5">ยื่นเมื่อ: {new Date(request.created_at).toLocaleString('th-TH')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pb-24 md:pb-6 overflow-y-auto custom-scrollbar flex-grow space-y-6 bg-slate-50 dark:bg-slate-900">
          
          {/* User Info & Status */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm min-w-0">
            <div className="flex items-center space-x-4 min-w-0">
              <img 
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullname || request.user_id)}&background=random`}
                alt="Profile" 
                className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-md"
              />
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)] truncate">{user?.fullname || request.user_id}</h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">{agencies?.find(a => a.id === user?.agency_id)?.name || 'ไม่ระบุสังกัด'} | {departments?.find(d => d.id === user?.department_id)?.name || 'ไม่ระบุฝ่าย'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              {request.status === 'Approved' ? (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center shadow-sm">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> อนุมัติแล้ว
                </span>
              ) : request.status === 'Rejected' ? (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center shadow-sm">
                  <XCircle className="w-4 h-4 mr-1.5" /> ไม่อนุมัติ
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center shadow-sm">
                  <Clock className="w-4 h-4 mr-1.5" /> รออนุมัติ (ขั้น {request.current_step}/{request.total_steps})
                </span>
              )}
            </div>
          </div>

          {/* Leave Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm">
              <div className="text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">ประเภทการลา</div>
              <div className={`font-semibold text-base ${typeInfo.color}`}>{typeInfo.name}</div>
              <div className="mt-4 text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">ช่วงเวลาที่ลา</div>
              <div className="font-semibold text-[var(--text-main)] text-sm">
                {request.date_start === request.date_end 
                  ? formatDate(request.date_start) 
                  : `${formatDate(request.date_start)} ถึง ${formatDate(request.date_end)}`}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                จำนวน {request.leave_duration} วัน {request.leave_period === 'Morning' ? '(เช้า)' : request.leave_period === 'Afternoon' ? '(บ่าย)' : '(ทั้งวัน)'}
              </div>
            </div>

            {/* Quota Progress (If policy exists) */}
            <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm flex flex-col justify-center">
              {policy ? (
                <>
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">โควตาวันลาคงเหลือ</div>
                    <div className={`text-2xl font-black ${typeInfo.color}`}>{remaining} <span className="text-xs font-medium text-[var(--text-muted)]">วัน</span></div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
                    <div className={`${typeInfo.bg} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-medium text-right">ใช้ไปแล้ว {used}/{quota} วัน ({percentage}%)</div>
                </>
              ) : (
                <div className="text-center text-[var(--text-muted)] text-sm font-medium opacity-60">ไม่มีข้อมูลโควตา</div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-[var(--card-border)] shadow-sm">
            <div className="text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">เหตุผลการลา / รายละเอียด</div>
            <p className="text-sm text-[var(--text-main)] font-medium leading-relaxed">{request.description || '-'}</p>
          </div>

          {request.reject_reason && (
            <div className={`p-4 rounded-2xl border shadow-sm ${request.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50'}`}>
              <div className={`text-xs font-bold mb-1 uppercase tracking-wider ${request.status === 'Rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>เหตุผล</div>
              <p className={`text-sm font-medium leading-relaxed ${request.status === 'Rejected' ? 'text-rose-700 dark:text-rose-300' : 'text-blue-700 dark:text-blue-300'}`}>{request.reject_reason}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 flex items-center"><Activity className="w-4 h-4 mr-2 text-[var(--text-muted)]"/> ขั้นตอนการอนุมัติ</h3>
            {loading ? (
              <div className="text-center py-4 text-sm text-[var(--text-muted)] animate-pulse">กำลังโหลดข้อมูล...</div>
            ) : approvalSteps.length > 0 ? (
              <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                {approvalSteps.map((step, idx) => {
                  const isApproved = step.status === 'Approved';
                  const isRejected = step.status === 'Rejected';
                  const isPending = step.status === 'Pending';
                  
                  let dotColor = 'bg-slate-300 dark:bg-slate-600';
                  if (isApproved) dotColor = 'bg-blue-500';
                  if (isRejected) dotColor = 'bg-rose-500';
                  if (isPending && request.current_step === step.step_number) dotColor = 'bg-amber-500 animate-pulse';

                  const approverUser = users?.find(u => u.id === step.approver_id);
                  const approverAgency = agencies?.find(a => a.id === approverUser?.agency_id)?.name || 'ไม่ระบุ';
                  const approverDept = departments?.find(d => d.id === approverUser?.department_id)?.name || 'ไม่ระบุ';
                  const roleTitle = approverUser?.role === 'SuperUser' ? 'หัวหน้างาน' : approverUser?.role === 'Admin' ? 'ผู้จัดการ' : approverUser?.role === 'SuperAdmin' ? 'HR' : (approverUser?.role || 'ผู้อนุมัติ');

                  return (
                    <div key={step.id} className="relative pl-6">
                      <div className={`absolute w-3 h-3 rounded-full ${dotColor} -left-[7.5px] top-1.5 shadow-sm ring-4 ring-[var(--bg-main)]`}></div>
                      <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--card-border)] shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-sm text-[var(--text-main)]">ขั้นตอนที่ {step.step_number}</div>
                          {isApproved ? (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">อนุมัติแล้ว</span>
                          ) : isRejected ? (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">ไม่อนุมัติ</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">รอดำเนินการ</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 sm:space-x-4 mb-2 min-w-0">
                          <img src={approverUser?.avatar_url || step.approver?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(approverUser?.fullname || step.approver?.fullname || step.approver_id)}&background=random`} className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full shadow-sm object-cover border-2 border-slate-100 dark:border-slate-700" alt="approver" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-[var(--text-main)] truncate">{approverUser?.fullname || step.approver?.fullname || step.approver_id}</span>
                            <span className="text-[10px] sm:text-xs font-medium text-[var(--text-muted)] truncate">{approverAgency} | {approverDept} <span className="font-bold">({roleTitle})</span></span>
                          </div>
                        </div>
                        {step.action_date && (
                          <div className="text-[10px] text-[var(--text-muted)] flex items-center mt-2">
                            <Clock className="w-3 h-3 mr-1" /> ดำเนินการเมื่อ {(() => {
                              const d = new Date(step.action_date);
                              let dtStr = d.toLocaleString('en-GB').replace(',', '');
                              if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) {
                                return d.toLocaleDateString('en-GB');
                              }
                              return dtStr;
                            })()}
                          </div>
                        )}
                        {step.comment && (
                          <div className="mt-2 text-xs text-[var(--text-muted)] bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-[var(--card-border)]">
                            "{step.comment}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-[var(--text-muted)]">ไม่พบข้อมูลขั้นตอนการอนุมัติ</div>
            )}
          </div>

        </div>

        {/* Empty Footer for Spacing (Matches other modals) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 min-h-[72px]"></div>

      </div>
    </div>
  );
}
