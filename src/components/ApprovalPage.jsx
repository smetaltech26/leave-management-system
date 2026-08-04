import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, FileText, User, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { notifyLeaveApprover, sendLinePushToUser } from '../lib/lineNotify';

export default function ApprovalPage({ currentUser, requests, users, onApproveStep, onRejectStep }) {
  const [activeSubTab, setActiveSubTab] = useState('pending'); // pending | completed
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState('');

  // คำขอที่คอยการอนุมัติจาก currentUser
  const pendingForMe = requests.filter(r => {
    if (r.status !== 'Pending') return false;
    const currentStepObj = r.approvers.find(a => a.step_number === r.current_step);
    return currentStepObj && currentStepObj.approver_id === currentUser?.id && currentStepObj.status === 'Pending';
  });

  // คำขอที่อนุมัติไปแล้ว
  const completedByMe = requests.filter(r => {
    return r.approvers.some(a => a.approver_id === currentUser?.id && a.status !== 'Pending');
  });

  const displayList = activeSubTab === 'pending' ? pendingForMe : completedByMe;

  const handleAction = async (action) => {
    if (!selectedRequest) return;

    const currentStepNum = selectedRequest.current_step;
    const isFinalStep = currentStepNum >= selectedRequest.approvers.length;

    if (action === 'Approved') {
      onApproveStep(selectedRequest.id, currentStepNum, comment);

      // ถ้ายังไม่ใช่ Step สุดท้าย -> ยิง LINE Push 1:1 หาผู้อนุมัติ Step ถัดไป!
      if (!isFinalStep) {
        const nextStepNum = currentStepNum + 1;
        const nextStepObj = selectedRequest.approvers.find(a => a.step_number === nextStepNum);
        if (nextStepObj) {
          const nextApprover = users.find(u => u.id === nextStepObj.approver_id);
          const requester = users.find(u => u.id === selectedRequest.user_id);
          if (nextApprover && nextApprover.line_user_id) {
            await notifyLeaveApprover({
              approverName: nextApprover.fullname,
              lineUserId: nextApprover.line_user_id,
              requesterName: requester?.fullname || 'พนักงาน',
              leaveType: selectedRequest.leave_type,
              dateRange: `${selectedRequest.date_start} ถึง ${selectedRequest.date_end}`,
              stepNum: nextStepNum
            });
          }
        }
      } else {
        // Step สุดท้าย อนุมัติเสร็จสมบูรณ์ -> ยิง LINE Push 1:1 แจ้งเตือนผู้ขอลา!
        const requester = users.find(u => u.id === selectedRequest.user_id);
        if (requester && requester.line_user_id) {
          await sendLinePushToUser(
            requester.line_user_id,
            `🎉 ใบขอลาของคุณ (${selectedRequest.leave_type}) เลขที่ ${selectedRequest.id} ได้รับการอนุมัติเรียบร้อยแล้วค่ะ!`
          );
        }
      }
    } else if (action === 'Rejected') {
      onRejectStep(selectedRequest.id, currentStepNum, comment);

      // ปฏิเสธ -> ยิง LINE Push 1:1 แจ้งเตือนผู้ขอลา!
      const requester = users.find(u => u.id === selectedRequest.user_id);
      if (requester && requester.line_user_id) {
        await sendLinePushToUser(
          requester.line_user_id,
          `❌ ใบขอลาของคุณ (${selectedRequest.leave_type}) เลขที่ ${selectedRequest.id} ถูกปฏิเสธการอนุมัติ (เหตุผล: ${comment || 'ไม่ระบุ'})`
        );
      }
    }

    setSelectedRequest(null);
    setComment('');
  };

  return (
    <div className="space-y-6">
      
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center space-x-2">
            <span>การอนุมัติคำขอลางาน</span>
            <span className="px-2.5 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-normal">
              1:1 LINE Notify Integrated
            </span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">รายการคำขอลางานที่รอให้คุณตรวจสอบและอนุมัติตามลำดับขั้นตอน</p>
        </div>

        {/* Sub Tabs */}
        <div className="flex p-1 bg-[var(--card-bg)]/80 rounded-2xl border border-[var(--card-border)] self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 ${
              activeSubTab === 'pending'
                ? 'bg-emerald-500 text-[var(--text-main)] shadow-lg shadow-emerald-500/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>รอการอนุมัติ</span>
            {pendingForMe.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-[var(--text-main)] rounded-full font-bold">
                {pendingForMe.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('completed')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubTab === 'completed'
                ? 'bg-emerald-500 text-[var(--text-main)] shadow-lg shadow-emerald-500/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>ดำเนินการแล้ว</span>
          </button>
        </div>
      </div>

      {/* Request Cards List */}
      {displayList.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {displayList.map((req) => {
            const requester = users.find(u => u.id === req.user_id);
            const currentStepObj = req.approvers.find(a => a.step_number === req.current_step);

            return (
              <div key={req.id} className="glass-card-clean rounded-2xl p-5 border border-[var(--card-border)] hover:border-[var(--card-border)] transition-all space-y-4">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--card-border)]/80">
                  <div className="flex items-center space-x-3">
                    <img
                      src={requester?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={requester?.fullname}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/30"
                    />
                    <div>
                      <div className="font-semibold text-sm text-[var(--text-main)]">{requester?.fullname || req.user_id}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {requester?.agency_id || 'SMT'} • {requester?.department_id || 'ทั่วไป'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {req.leave_type} ({req.leave_duration} วัน)
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {req.id} (Step {req.current_step}/{req.total_steps})
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">เหตุผลการลา:</span>
                    <p className="font-medium text-[var(--text-main)] mt-0.5">{req.description}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ช่วงเวลาลางาน:</span>
                    <p className="font-medium text-[var(--text-main)] mt-0.5">{req.date_start} ถึง {req.date_end}</p>
                  </div>
                </div>

                {/* Approvers Step Timeline */}
                <div className="pt-3 border-t border-[var(--card-border)]/80">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] block mb-2">ขั้นตอนการอนุมัติ (Approval Chain):</span>
                  <div className="flex flex-wrap gap-2">
                    {req.approvers.map((step) => (
                      <div
                        key={step.step_id}
                        className={`px-3 py-1.5 rounded-xl border text-xs flex items-center space-x-2 ${
                          step.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : step.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--card-border)]'
                        }`}
                      >
                        <span className="font-bold text-[10px]">Step {step.step_number}:</span>
                        <span>{step.approver_name}</span>
                        <span className="font-semibold text-[10px]">({step.status})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons for Pending */}
                {activeSubTab === 'pending' && (
                  <div className="pt-3 border-t border-[var(--card-border)] flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="py-2 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[var(--text-main)] text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>พิจารณาอนุมัติ</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card-clean rounded-2xl p-12 text-center text-[var(--text-muted)] space-y-2">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">ไม่มีรายการคำขอลางานที่ต้องดำเนินการในขณะนี้</p>
          <p className="text-xs text-slate-500">ระบบจะส่งการแจ้งเตือน 1:1 ผ่าน LINE เมื่อมีคำขอใหม่ส่งถึงคุณค่ะ</p>
        </div>
      )}

      {/* Modal Confirm Approval / Reject */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] shadow-2xl space-y-5">
            
            <div className="flex justify-between items-center pb-3 border-b border-[var(--card-border)]">
              <h3 className="text-base font-bold text-[var(--text-main)]">พิจารณาอนุมัติคำขอลางาน ({selectedRequest.id})</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                <p className="text-[var(--text-muted)]">ผู้ขอลา: <span className="text-[var(--text-main)] font-semibold">{selectedRequest.user_id}</span></p>
                <p className="text-[var(--text-muted)]">ประเภท: <span className="text-emerald-400 font-semibold">{selectedRequest.leave_type} ({selectedRequest.leave_duration} วัน)</span></p>
                <p className="text-[var(--text-muted)]">เหตุผล: <span className="text-[var(--text-main)]">{selectedRequest.description}</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">หมายเหตุ / ความเห็นผู้อนุมัติ (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="ระบุข้อความหรือหมายเหตุเพิ่มเติม..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-sm bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] focus:outline-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--card-border)]">
              <button
                onClick={() => handleAction('Rejected')}
                className="py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>ปฏิเสธคำขอ</span>
              </button>

              <button
                onClick={() => handleAction('Approved')}
                className="py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[var(--text-main)] text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center space-x-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันอนุมัติ</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
