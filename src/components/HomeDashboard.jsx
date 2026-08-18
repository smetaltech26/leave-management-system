import React, { useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, PlusCircle, Sparkles, Send, ShieldCheck, HeartPulse, Luggage, Search, Edit2, Trash2, Eye, RefreshCcw } from 'lucide-react';
import LeaveDetailsModal from './LeaveDetailsModal';
import LeaveTypeBadge, { getLeaveTypeMeta } from './ui/LeaveTypeBadge';
import { useModal } from '../contexts/ModalContext';

export default function HomeDashboard({ currentUser, userPolicies, requests, onDeleteRequest, onOpenLeaveModal, setActiveTab, agencies, departments, users, onRefresh, leaveTypes = [] }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showConfirm } = useModal();

  const myPolicies = useMemo(() => (userPolicies || []).filter(p => p.user_id === currentUser?.id), [userPolicies, currentUser?.id]);
  const myRequests = useMemo(() => (requests || []).filter(r => r.user_id === currentUser?.id), [requests, currentUser?.id]);

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      
      {/* Premium Hero Welcome Banner */}
      <div className="rounded-[1.5rem] p-3 md:p-4 relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 text-white shadow-xl shadow-sky-600/15 dark:shadow-none border border-transparent dark:border-slate-700/50">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight drop-shadow-sm">
              สวัสดีคุณ {currentUser?.fullname}
            </h2>
            <p className="text-blue-100 dark:text-slate-400 text-xs md:text-sm font-semibold">
              สังกัด: {agencies?.find(a => a.id === currentUser?.agency_id)?.name || currentUser?.agency_id || 'SMT'} | ฝ่าย: {departments?.find(d => d.id === currentUser?.department_id)?.name || currentUser?.department_id || 'ทั่วไป'}
            </p>
          </div>

          <button
            onClick={() => onOpenLeaveModal()}
            className="py-2 px-5 bg-white dark:bg-blue-500/20 hover:bg-blue-50 dark:hover:bg-blue-500/30 text-blue-900 dark:text-blue-300 font-extrabold rounded-xl shadow-lg dark:shadow-none flex items-center justify-center space-x-2 transition-all transform hover:scale-105 active:scale-95 shrink-0 text-sm border border-blue-100 dark:border-blue-500/30"
          >
            <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>ยื่นใบลาใหม่</span>
          </button>
        </div>
      </div>

      {/* Leave Quota Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-extrabold text-[var(--text-main)] dark:text-[var(--text-main)] tracking-tight">
            📊 สิทธิ์วันลาคงเหลือประจำปี 2026
          </h3>
          <button
            onClick={async () => {
              if (!onRefresh || isRefreshing) return;
              setIsRefreshing(true);
              try {
                await onRefresh();
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-800 dark:hover:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 disabled:opacity-50 flex items-center shadow-sm space-x-1.5"
            title="รีโหลดโควตาและคำขอล่าสุด"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span className="hidden sm:inline">รีโหลดข้อมูล</span>
            <span className="sm:hidden">รีโหลด</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {myPolicies.length > 0 ? (
            myPolicies.map((pol) => {
              const meta = getLeaveTypeMeta(pol.leave_type);
              const Icon = meta.icon;
              const dynamicUsedDays = requests
                .filter(r => r.user_id === currentUser?.id && r.leave_type === pol.leave_type && r.status !== 'Rejected')
                .reduce((sum, r) => sum + Number(r.leave_duration), 0);
                
              const displayUsed = dynamicUsedDays;
              const displayRemaining = Math.max(0, pol.max_days - displayUsed);
              const percentUsed = Math.min(100, (displayUsed / pol.max_days) * 100);

              return (
                <div key={pol.id} className="glass-card-clean-clean rounded-2xl p-3 sm:p-4 md:p-5 border border-slate-200 dark:border-[var(--card-border)] relative space-y-2.5 sm:space-y-3 shadow-sm flex flex-col justify-between">
                  
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                    <div className="flex items-center space-x-1.5 sm:space-x-2.5 min-w-0">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg} ${meta.iconColor}`}>
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="font-extrabold text-xs sm:text-sm md:text-base text-[var(--text-main)] dark:text-[var(--text-main)] truncate" title={meta.name}>
                        {meta.name}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] dark:text-[var(--text-muted)] shrink-0 self-start sm:self-auto">
                      สิทธิ์ {pol.max_days} วัน
                    </span>
                  </div>

                  {/* Big Number Display */}
                  <div className="flex items-baseline justify-between pt-0.5 sm:pt-1">
                    <div className="flex items-baseline">
                      <span className="text-2xl sm:text-3xl font-black text-[var(--text-main)] dark:text-[var(--text-main)] tracking-tight">
                        {displayRemaining}
                      </span>
                      <span className="text-[10px] sm:text-xs font-extrabold text-[var(--text-muted)] dark:text-[var(--text-muted)] ml-1">
                        วันคงเหลือ
                      </span>
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-[var(--text-muted)] dark:text-[var(--text-muted)] shrink-0">
                      ใช้ไป <span className="font-extrabold text-[var(--text-main)] dark:text-[var(--text-main)]">{displayUsed}</span> วัน
                    </div>
                  </div>

                  {/* Clean Progress Bar */}
                  <div className="space-y-1 sm:space-y-2">
                    <div className="w-full bg-slate-200 dark:bg-[var(--card-bg)] h-2 sm:h-3 rounded-full overflow-hidden border border-slate-300/50 dark:border-[var(--card-border)]">
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
            <div className="col-span-full glass-card-clean-clean p-8 rounded-3xl text-center text-[var(--text-muted)] dark:text-[var(--text-muted)] text-base font-bold">
              ยังไม่มีการกำหนดโควตาวันลา กรุณาติดต่อ HR หรือ Admin ค่ะ
            </div>
          )}
        </div>
      </div>

      {/* Recent Leave Requests (Table Format) */}
      <div className="bg-white dark:bg-[var(--card-bg)] rounded-3xl border border-slate-200 dark:border-[var(--card-border)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
          <h3 className="text-base md:text-lg font-extrabold text-[var(--text-main)] flex items-center gap-2">
            🕒 ประวัติคำขอลางานล่าสุดของคุณ ({myRequests.length})
          </h3>

        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[var(--text-main)] border-b border-slate-200 dark:border-[var(--card-border)]">
                <th className="py-4 px-4 font-bold whitespace-nowrap">รหัสคำขอ</th>
                <th className="py-4 pr-4 pl-[108px] font-bold">พนักงาน</th>
                <th className="py-4 px-4 font-bold text-center">รหัสพนักงาน</th>
                <th className="py-4 px-4 font-bold text-center">ประเภท</th>
                <th className="py-4 px-4 font-bold text-center">วันที่เริ่ม - สิ้นสุด</th>
                <th className="py-4 px-4 font-bold text-center">จำนวน</th>
                <th className="py-4 px-4 font-bold">เหตุผล</th>
                <th className="py-4 px-4 font-bold text-center">สถานะ</th>
                <th className="py-4 px-4 font-bold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[var(--card-border)]">
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center">
                    <Send className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-bold">คุณยังไม่มีคำขอลางานในขณะนี้</p>
                  </td>
                </tr>
              ) : (
                myRequests.map((req) => {
                  const canEditOrDelete = req.status === 'Pending' && req.current_step === 1;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="py-3 px-4 font-mono text-blue-500 dark:text-blue-400 text-xs font-bold">{req.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullname)}&background=random`} 
                            alt="" 
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800 shadow-md" 
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullname)}&background=random`; }}
                          />
                          <div>
                            <div className="font-bold text-[var(--text-main)] text-sm">
                              {currentUser?.fullname}
                            </div>
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">{agencies?.find(a => a.id === currentUser?.agency_id)?.name || currentUser?.agency_id || 'SMT'} | {departments?.find(d => d.id === currentUser?.department_id)?.name || currentUser?.department_id || 'ทั่วไป'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {currentUser?.employee_id ? (
                          <span className="text-[var(--text-main)] font-bold text-sm">{currentUser.employee_id}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <LeaveTypeBadge type={req.leave_type} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-[var(--text-muted)] leading-tight">
                        <div className="font-bold text-[var(--text-main)] mb-1">{req.date_start ? req.date_start.split('-').reverse().join('-') : ''}</div>
                        <div>ถึง</div>
                        <div className="font-bold text-[var(--text-main)] mt-1">{req.date_end ? req.date_end.split('-').reverse().join('-') : ''}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[var(--text-main)]">{req.leave_duration} วัน</td>
                      <td className="py-3 px-4 text-[var(--text-muted)] text-sm truncate max-w-[150px]" title={req.description}>{req.description}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          {req.status === 'Pending' && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> รออนุมัติ (ขั้น {req.current_step})</span>
                          )}
                          {req.status === 'Approved' && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> อนุมัติแล้ว</span>
                          )}
                          {req.status === 'Rejected' && (
                            <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/> {req.reject_reason?.startsWith('ยกเลิกโดย') ? 'ยกเลิก' : 'ไม่อนุมัติ'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => setSelectedRequest(req)} className="p-2 text-blue-600 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/40 rounded-lg transition-colors" title="ดูรายละเอียด">
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {canEditOrDelete ? (
                            <>
                              <button onClick={() => onOpenLeaveModal(req)} className="p-2 text-amber-600 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/40 rounded-lg transition-colors" title="แก้ไขคำขอ">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={async () => {
                                if(await showConfirm('คุณต้องการยกเลิก/ลบ คำขอลานี้ใช่หรือไม่?')) {
                                   onDeleteRequest(req.id);
                                }
                              }} className="p-2 text-rose-600 bg-rose-100 dark:bg-rose-500/20 hover:bg-rose-200 dark:hover:bg-rose-500/40 rounded-lg transition-colors" title="ลบคำขอ">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button disabled className="p-2 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-not-allowed opacity-50" title="ไม่สามารถแก้ไขได้ (มีการดำเนินการแล้ว)">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button disabled className="p-2 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-not-allowed opacity-50" title="ไม่สามารถลบได้ (มีการดำเนินการแล้ว)">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-[var(--card-border)]">
          {myRequests.length === 0 ? (
            <div className="py-12 text-center">
              <Send className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-bold">คุณยังไม่มีคำขอลางานในขณะนี้</p>
            </div>
          ) : (
            myRequests.map((req) => {
              const canEditOrDelete = req.status === 'Pending' && req.current_step === 1;

              return (
                <div key={req.id} className="p-4 space-y-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <img 
                        src={currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullname)}&background=random`} 
                        alt="" 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800 shadow-md" 
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullname)}&background=random`; }}
                      />
                      <div>
                        <div className="font-mono text-blue-500 dark:text-blue-400 text-xs font-bold mb-0.5">{req.id}</div>
                        <div className="font-bold text-[var(--text-main)] text-sm">{currentUser?.fullname}</div>
                        {currentUser?.employee_id && (
                          <div className="flex items-center gap-1 mt-0.5 text-[var(--text-muted)] text-xs">
                            รหัสพนักงาน: <span className="font-bold text-[var(--text-main)]">{currentUser.employee_id}</span>
                          </div>
                        )}
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{agencies?.find(a => a.id === currentUser?.agency_id)?.name || currentUser?.agency_id || 'SMT'} | {departments?.find(d => d.id === currentUser?.department_id)?.name || currentUser?.department_id || 'ทั่วไป'}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <LeaveTypeBadge type={req.leave_type} size="sm" />
                      
                      {req.status === 'Pending' && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit"><Clock className="w-2.5 h-2.5"/> ขั้น {req.current_step}</span>
                      )}
                      {req.status === 'Approved' && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-2.5 h-2.5"/> อนุมัติ</span>
                      )}
                      {req.status === 'Rejected' && (
                        <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit"><XCircle className="w-2.5 h-2.5"/> {req.reject_reason?.startsWith('ยกเลิกโดย') ? 'ยกเลิก' : 'ไม่อนุมัติ'}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-[var(--card-bg)] rounded-xl p-3 border border-slate-100 dark:border-[var(--card-border)]">
                    <div className="text-xs text-center">
                      <div className="text-[var(--text-muted)] font-medium mb-1">เริ่มต้น</div>
                      <div className="font-bold text-[var(--text-main)]">{req.date_start ? req.date_start.split('-').reverse().join('-') : ''}</div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex flex-col items-center">
                      <span>{req.leave_duration} วัน</span>
                      <div className="w-12 h-px bg-slate-300 dark:bg-slate-700 my-1"></div>
                    </div>
                    <div className="text-xs text-center">
                      <div className="text-[var(--text-muted)] font-medium mb-1">สิ้นสุด</div>
                      <div className="font-bold text-[var(--text-main)]">{req.date_end ? req.date_end.split('-').reverse().join('-') : ''}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <div className="text-xs text-[var(--text-muted)] truncate flex-1" title={req.description}>
                      <span className="font-bold">เหตุผล: </span>{req.description}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => setSelectedRequest(req)} className="p-2 text-blue-600 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/40 rounded-lg transition-colors" title="ดูรายละเอียด">
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {canEditOrDelete && (
                        <>
                          <button onClick={() => onOpenLeaveModal(req)} className="p-2 text-amber-600 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/40 rounded-lg transition-colors" title="แก้ไขคำขอ">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={async () => {
                            if(await showConfirm('คุณต้องการยกเลิก/ลบ คำขอลานี้ใช่หรือไม่?')) {
                              onDeleteRequest(req.id);
                            }
                          }} className="p-2 text-rose-600 bg-rose-100 dark:bg-rose-500/20 hover:bg-rose-200 dark:hover:bg-rose-500/40 rounded-lg transition-colors" title="ลบคำขอ">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <LeaveDetailsModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        user={currentUser}
        allPolicies={userPolicies}
        users={users}
        agencies={agencies}
        departments={departments}
        leaveTypes={leaveTypes}
      />

    </div>
  );
}
