import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, RefreshCcw, Ban } from 'lucide-react';

export default function AdminEditLeaveModal({ isOpen, onClose, request, holidays = [], onAdminAction, isSubmitting, users = [], agencies = [], departments = [], leaveTypes = [] }) {
  if (!isOpen || !request) return null;

  const [dateStart, setDateStart] = useState(request.date_start);
  const [dateEnd, setDateEnd] = useState(request.date_end);
  const [leaveDuration, setLeaveDuration] = useState(request.leave_duration);
  const [leaveType, setLeaveType] = useState(request.leave_type);
  const [leavePeriod, setLeavePeriod] = useState(request.leave_duration % 1 !== 0 ? 'Half' : 'Full');

  useEffect(() => {
    if (request) {
      setDateStart(request.date_start);
      setDateEnd(request.date_end);
      setLeaveDuration(request.leave_duration);
      setLeaveType(request.leave_type);
      setLeavePeriod(request.leave_duration % 1 !== 0 ? 'Half' : 'Full');
    }
  }, [request]);

  useEffect(() => {
    const sDate = new Date(dateStart);
    const eDate = new Date(dateEnd);
    if (sDate > eDate) {
      setLeaveDuration(0);
      return;
    }

    if (dateStart !== dateEnd && leavePeriod !== 'Full') {
      setLeavePeriod('Full'); 
    }

    let total = 0;
    let curr = new Date(sDate);
    while (curr <= eDate) {
      const dayOfWeek = curr.getDay();
      if (dayOfWeek !== 0) {
        const dateStr = curr.toISOString().split('T')[0];
        const isHoliday = holidays.some(h => h.date === dateStr);
        if (!isHoliday) {
          total += 1;
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    if (total > 0 && dateStart === dateEnd && leavePeriod !== 'Full') {
      total = 0.5;
    }

    setLeaveDuration(total);
  }, [dateStart, dateEnd, leavePeriod, holidays]);

  const [confirmAction, setConfirmAction] = useState(null);

  const handleUpdate = () => {
    onAdminAction(request, 'UPDATE', {
      date_start: dateStart,
      date_end: dateEnd,
      leave_duration: leaveDuration,
      leave_type: leaveType,
    });
  };

  const handleRevert = () => {
    setConfirmAction('REVERT_PENDING');
  };

  const handleCancel = () => {
    setConfirmAction('CANCEL_LEAVE');
  };
  
  const executeConfirmAction = () => {
    onAdminAction(request, confirmAction);
    setConfirmAction(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[var(--card-bg)] w-full max-w-lg rounded-[2rem] border border-[var(--card-border)] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100svh-2rem)] md:max-h-[90vh] min-h-0 relative">
        <div className="flex justify-between items-center p-5 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">แก้ไขคำขอพิเศษ (SuperAdmin)</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5">
          <div className="flex items-center space-x-5 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-[var(--card-border)]">
            <img 
              src={users?.find(u => u.id === request.user_id)?.avatar_url || `https://ui-avatars.com/api/?name=${users?.find(u => u.id === request.user_id)?.fullname || request.user_id}&background=random`} 
              alt="Avatar" 
              className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md shrink-0"
            />
            <div>
              <h3 className="font-bold text-[var(--text-main)] text-xl">{users?.find(u => u.id === request.user_id)?.fullname || request.user_id}</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {agencies?.find(a => a.id === users?.find(u => u.id === request.user_id)?.agency_id)?.name || users?.find(u => u.id === request.user_id)?.agency_id || '-'} / {departments?.find(d => d.id === users?.find(u => u.id === request.user_id)?.department_id)?.name || users?.find(u => u.id === request.user_id)?.department_id || '-'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
            <strong>คำเตือน:</strong> การแก้ไขหรือยกเลิกรายการที่ประมวลผลแล้ว ระบบจะทำการคำนวณและปรับยอดโควตาวันลา (Quota) ของพนักงานโดยอัตโนมัติ
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">รหัสคำขอ</label>
              <input type="text" value={request.id} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[var(--text-muted)] cursor-not-allowed" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">ประเภทการลา</label>
              <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[var(--text-main)] focus:ring-2 focus:ring-blue-500 outline-none">
                {leaveTypes.length > 0 ? (
                  leaveTypes.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))
                ) : (
                  <>
                    <option value="ลาพักร้อน">ลาพักร้อน</option>
                    <option value="ลากิจไม่ได้รับค่าจ้าง">ลากิจไม่ได้รับค่าจ้าง</option>
                    <option value="ลากิจได้รับค่าจ้าง">ลากิจได้รับค่าจ้าง</option>
                    <option value="ลาป่วย">ลาป่วย</option>
                    <option value="ลาอื่นๆ">ลาอื่นๆ</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">ตั้งแต่วันที่</label>
                <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[var(--text-main)] focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">ถึงวันที่</label>
                <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[var(--text-main)] focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            {dateStart === dateEnd && (
              <div>
                <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">ระยะเวลา</label>
                <select value={leavePeriod} onChange={(e) => setLeavePeriod(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[var(--text-main)] focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Full">เต็มวัน (1 วัน)</option>
                  <option value="Morning">ครึ่งวันเช้า (0.5 วัน)</option>
                  <option value="Afternoon">ครึ่งวันบ่าย (0.5 วัน)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">จำนวนวันลาสุทธิ (ระบบคำนวณ)</label>
              <input type="text" value={`${leaveDuration} วัน`} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[var(--text-main)] cursor-not-allowed font-bold" />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--card-border)] bg-slate-50 dark:bg-slate-800/30 grid grid-cols-3 gap-2 shrink-0">
          <button onClick={handleRevert} disabled={isSubmitting} className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50">
            <RefreshCcw className="w-4 h-4" />
            <span className="text-[10px] font-bold text-center leading-tight">ดึงกลับ<br/>(Pending)</span>
          </button>
          
          <button onClick={handleCancel} disabled={isSubmitting} className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-colors disabled:opacity-50">
            <Ban className="w-4 h-4" />
            <span className="text-[10px] font-bold text-center leading-tight">ยกเลิกการลา</span>
          </button>

          <button onClick={handleUpdate} disabled={isSubmitting} className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 shadow-sm transition-all disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span className="text-[10px] font-bold text-center leading-tight">บันทึกวันลา</span>
          </button>
        </div>

        {/* Custom Confirmation Overlay */}
        {confirmAction && (
          <div className="absolute inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white dark:bg-[var(--card-bg)] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[var(--card-border)] text-center space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${confirmAction === 'REVERT_PENDING' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                {confirmAction === 'REVERT_PENDING' ? <RefreshCcw className="w-8 h-8" /> : <Ban className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">
                  {confirmAction === 'REVERT_PENDING' ? 'ดึงกลับเป็นรออนุมัติ ?' : 'ยกเลิกการลา ?'}
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {confirmAction === 'REVERT_PENDING' 
                    ? 'สถานะการอนุมัติทั้งหมดจะถูกรีเซ็ต โควตาจะถูกคำนวณใหม่ และผู้เกี่ยวข้องจะต้องเข้ามาอนุมัติใหม่อีกครั้ง'
                    : 'คำขอนี้จะถูกเปลี่ยนเป็น "ยกเลิก" และระบบจะทำการคืนโควตาวันลาให้พนักงานทันที'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => setConfirmAction(null)}
                  className="py-2.5 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={executeConfirmAction}
                  className={`py-2.5 px-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
                    confirmAction === 'REVERT_PENDING' 
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' 
                      : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                  }`}
                >
                  ยืนยันทำรายการ
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
