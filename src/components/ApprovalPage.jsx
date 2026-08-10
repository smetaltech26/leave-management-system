import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, FileText, User, MessageSquare, AlertCircle, Sparkles, Edit2 } from 'lucide-react';
import { notifyLeaveApprover, sendLinePushToUser } from '../lib/lineNotify';
import { sendEmailNotification } from '../services/emailService';
import AdminEditLeaveModal from './admin/AdminEditLeaveModal';

export default function ApprovalPage({ currentUser, requests, users, agencies = [], departments = [], onApproveStep, onRejectStep, onAdminEditRequest, holidays = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('pending'); // pending | completed
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState('');
  
  const [adminEditRequest, setAdminEditRequest] = useState(null);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  const handleAdminAction = async (request, actionType, updates) => {
    setIsSubmittingAdmin(true);
    try {
      await onAdminEditRequest(request, actionType, updates);
      setAdminEditRequest(null);
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

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
      const requester = users.find(u => u.id === selectedRequest.user_id);

      // ถ้ายังไม่ใช่ Step สุดท้าย -> ยิง LINE Push 1:1 และ Email หาผู้อนุมัติ Step ถัดไป!
      if (!isFinalStep) {
        const nextStepNum = currentStepNum + 1;
        const nextStepObj = selectedRequest.approvers.find(a => a.step_number === nextStepNum);
        if (nextStepObj) {
          const nextApprover = users.find(u => u.id === nextStepObj.approver_id);
          if (nextApprover) {
            if (nextApprover.line_user_id) {
              await notifyLeaveApprover({
                approverName: nextApprover.fullname,
                lineUserId: nextApprover.line_user_id,
                requesterName: requester?.fullname || 'พนักงาน',
                leaveType: selectedRequest.leave_type,
                dateRange: `${selectedRequest.date_start} ถึง ${selectedRequest.date_end}`,
                stepNum: nextStepNum
              });
            }
            if (nextApprover.email) {
              const periodText = selectedRequest.leave_period === 'Morning' ? 'เช้า' : selectedRequest.leave_period === 'Afternoon' ? 'บ่าย' : 'ทั้งวัน';
              const htmlBody = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                  <h2 style="color: #059669;">แจ้งเตือนขออนุมัติการลา (ขั้นที่ ${nextStepNum})</h2>
                  <p>เรียน คุณ${nextApprover.fullname},</p>
                  <p>ระบบได้รับคำขออนุมัติการลา โปรดพิจารณาอนุมัติคำขอดังกล่าว โดยมีรายละเอียดดังนี้:</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                    <ul style="list-style: none; padding: 0; margin: 0;">
                      <li style="margin-bottom: 8px;"><strong>รหัสคำขอ:</strong> ${selectedRequest.id}</li>
                      <li style="margin-bottom: 8px;"><strong>พนักงานผู้ขอลา:</strong> ${requester?.fullname || 'พนักงาน'}</li>
                      <li style="margin-bottom: 8px;"><strong>ประเภทการลา:</strong> ${selectedRequest.leave_type}</li>
                      <li style="margin-bottom: 8px;"><strong>วันที่ลา:</strong> ${selectedRequest.date_start.split('-').reverse().join('-')} ถึง ${selectedRequest.date_end.split('-').reverse().join('-')}</li>
                      <li style="margin-bottom: 8px;"><strong>ช่วงเวลา:</strong> ${periodText}</li>
                      <li style="margin-bottom: 8px;"><strong>จำนวนวัน:</strong> ${selectedRequest.leave_duration} วัน</li>
                      <li style="margin-bottom: 0;"><strong>เหตุผลการลา:</strong> ${selectedRequest.description || '-'}</li>
                    </ul>
                  </div>
                  <p>กรุณาเข้าสู่ระบบเพื่อตรวจสอบและพิจารณาอนุมัติคำขอ:</p>
                  <p><a href="http://localhost:3000" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">เข้าสู่ระบบ</a></p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                  <p style="font-size: 12px; color: #64748b;"><i>นี่คืออีเมลอัตโนมัติจากระบบ Leave Management System กรุณาอย่าตอบกลับ</i></p>
                </div>
              `;
              sendEmailNotification({
                to: nextApprover.email,
                subject: `📢 แจ้งเตือน: ขออนุมัติการลาจาก ${requester?.fullname || 'พนักงาน'} (รหัส: ${selectedRequest.id})`,
                body: htmlBody
              });
            }
          }
        }
      } else {
        // Step สุดท้าย อนุมัติเสร็จสมบูรณ์ -> ยิง LINE Push 1:1 และ Email แจ้งเตือนผู้ขอลา!
        if (requester) {
          if (requester.line_user_id) {
            await sendLinePushToUser(
              requester.line_user_id,
              `🎉 ใบขอลาของคุณ (${selectedRequest.leave_type}) เลขที่ ${selectedRequest.id} ได้รับการอนุมัติเรียบร้อยแล้วค่ะ!`
            );
          }
          if (requester.email) {
            const htmlBody = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                <h2 style="color: #059669;">✅ อนุมัติการลา</h2>
                <p>เรียน คุณ${requester.fullname},</p>
                <p>คำขออนุมัติการลาของคุณได้รับการพิจารณา <strong>"อนุมัติ"</strong> ครบทุกขั้นตอนเรียบร้อยแล้ว โดยมีรายละเอียดดังนี้:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 8px;"><strong>รหัสคำขอ:</strong> ${selectedRequest.id}</li>
                    <li style="margin-bottom: 8px;"><strong>ประเภทการลา:</strong> ${selectedRequest.leave_type}</li>
                    <li style="margin-bottom: 8px;"><strong>วันที่ลา:</strong> ${selectedRequest.date_start.split('-').reverse().join('-')} ถึง ${selectedRequest.date_end.split('-').reverse().join('-')}</li>
                    <li style="margin-bottom: 0;"><strong>จำนวนวัน:</strong> ${selectedRequest.leave_duration} วัน</li>
                  </ul>
                </div>
                <p><a href="http://localhost:3000" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">ตรวจสอบประวัติการลาของคุณ</a></p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                <p style="font-size: 12px; color: #64748b;"><i>นี่คืออีเมลอัตโนมัติจากระบบ Leave Management System กรุณาอย่าตอบกลับ</i></p>
              </div>
            `;
            sendEmailNotification({
              to: requester.email,
              subject: `✅ อนุมัติ: คำขอลาของคุณได้รับการอนุมัติเรียบร้อยแล้ว (รหัส: ${selectedRequest.id})`,
              body: htmlBody
            });
          }
        }
      }
    } else if (action === 'Rejected') {
      onRejectStep(selectedRequest.id, currentStepNum, comment);

      // ปฏิเสธ -> ยิง LINE Push 1:1 และ Email แจ้งเตือนผู้ขอลา!
      const requester = users.find(u => u.id === selectedRequest.user_id);
      if (requester) {
        if (requester.line_user_id) {
          await sendLinePushToUser(
            requester.line_user_id,
            `❌ ใบขอลาของคุณ (${selectedRequest.leave_type}) เลขที่ ${selectedRequest.id} ถูกปฏิเสธการอนุมัติ (เหตุผล: ${comment || 'ไม่ระบุ'})`
          );
        }
        if (requester.email) {
          const htmlBody = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
              <h2 style="color: #ef4444;">❌ ไม่อนุมัติการลา</h2>
              <p>เรียน คุณ${requester.fullname},</p>
              <p>คำขออนุมัติการลาของคุณ <strong>"ไม่ได้รับการอนุมัติ"</strong> โดยมีรายละเอียดดังนี้:</p>
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                <ul style="list-style: none; padding: 0; margin: 0; color: #991b1b;">
                  <li style="margin-bottom: 8px;"><strong>รหัสคำขอ:</strong> ${selectedRequest.id}</li>
                  <li style="margin-bottom: 8px;"><strong>ประเภทการลา:</strong> ${selectedRequest.leave_type}</li>
                  <li style="margin-bottom: 8px;"><strong>วันที่ลา:</strong> ${selectedRequest.date_start.split('-').reverse().join('-')} ถึง ${selectedRequest.date_end.split('-').reverse().join('-')}</li>
                  <li style="margin-bottom: 8px;"><strong>ผู้ปฏิเสธคำขอ:</strong> ${currentUser?.fullname}</li>
                  <li style="margin-bottom: 0;"><strong>เหตุผลที่ไม่อนุมัติ:</strong> ${comment || 'ไม่ระบุ'}</li>
                </ul>
              </div>
              <p>หากมีข้อสงสัย กรุณาติดต่อหัวหน้างานหรือฝ่ายบุคคลค่ะ</p>
              <p><a href="http://localhost:3000" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">เข้าสู่ระบบ</a></p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
              <p style="font-size: 12px; color: #64748b;"><i>นี่คืออีเมลอัตโนมัติจากระบบ Leave Management System กรุณาอย่าตอบกลับ</i></p>
            </div>
          `;
          sendEmailNotification({
            to: requester.email,
            subject: `❌ แจ้งผล: คำขอลาของคุณไม่ได้รับการอนุมัติ (รหัส: ${selectedRequest.id})`,
            body: htmlBody
          });
        }
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
            <span className="px-2.5 py-0.5 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-normal">
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
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
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
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>ดำเนินการแล้ว</span>
          </button>
        </div>
      </div>

      {/* Request Cards List */}
      {displayList.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-500/30"
                    />
                    <div>
                      <div className="font-semibold text-sm text-[var(--text-main)]">{requester?.fullname || req.user_id}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {agencies?.find(a => a.id === requester?.agency_id)?.name || requester?.agency_id || 'SMT'} • {departments?.find(d => d.id === requester?.department_id)?.name || requester?.department_id || 'ทั่วไป'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {req.leave_type} ({req.leave_duration} วัน)
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                      activeSubTab === 'completed'
                        ? req.status === 'Rejected'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {req.id} {activeSubTab === 'completed' ? (req.status === 'Rejected' ? '(ไม่อนุมัติ)' : '(อนุมัติแล้ว)') : `(Step ${req.current_step}/${req.total_steps})`}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)]">เหตุผลการลา:</span>
                    <p className="font-medium text-[var(--text-main)] mt-0.5">{req.description}</p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">ช่วงเวลาลางาน:</span>
                    <p className="font-medium text-[var(--text-main)] mt-0.5">{req.date_start ? req.date_start.split('-').reverse().join('-') : ''} ถึง {req.date_end ? req.date_end.split('-').reverse().join('-') : ''}</p>
                  </div>
                </div>

                {/* Approvers Step Timeline */}
                <div className="pt-3 border-t border-[var(--card-border)]/80">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] block mb-2">ขั้นตอนการอนุมัติ (Approval Chain):</span>
                  <div className="flex flex-wrap gap-2">
                    {[...req.approvers].sort((a, b) => a.step_number - b.step_number).map((step) => {
                      const approverUser = users.find(u => u.id === step.approver_id);
                      const approverName = approverUser ? approverUser.fullname : 'ผู้อนุมัติ';
                      return (
                        <div
                          key={step.step_id}
                          className={`px-3 py-1.5 rounded-xl border text-xs flex items-center space-x-2 ${
                            step.status === 'Approved'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : step.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--card-border)]'
                          }`}
                        >
                          <span className="font-bold">{approverName}</span>
                          <span className="font-semibold text-[10px]">({step.status})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons for Pending */}
                {activeSubTab === 'pending' && (
                  <div className="pt-3 border-t border-[var(--card-border)] flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="py-2 px-5 bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-400 hover:to-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>พิจารณาอนุมัติ</span>
                    </button>
                  </div>
                )}
                
                {/* Action Buttons for Completed (SuperAdmin Only) */}
                {activeSubTab === 'completed' && currentUser?.role === 'SuperAdmin' && (
                  <div className="pt-3 border-t border-[var(--card-border)] flex justify-end space-x-3">
                    <button
                      onClick={() => setAdminEditRequest(req)}
                      className="py-1.5 px-4 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>แก้ไขปรับปรุง</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card-clean rounded-2xl p-12 text-center text-[var(--text-muted)] space-y-2">
          <Clock className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">ไม่มีรายการคำขอลางานที่ต้องดำเนินการในขณะนี้</p>
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

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-start space-x-4">
                <img 
                  src={users.find(u => u.id === selectedRequest.user_id)?.avatar_url || `https://ui-avatars.com/api/?name=${selectedRequest.user_id}&background=random`} 
                  alt="Requester" 
                  className="w-16 h-16 rounded-full border border-[var(--card-border)] object-cover"
                />
                <div>
                  <div className="font-bold text-sm text-[var(--text-main)]">
                    {users.find(u => u.id === selectedRequest.user_id)?.fullname || selectedRequest.user_id}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 mb-1">
                    {agencies?.find(a => a.id === users.find(u => u.id === selectedRequest.user_id)?.agency_id)?.name || users.find(u => u.id === selectedRequest.user_id)?.agency_id || 'SMT'} • {departments?.find(d => d.id === users.find(u => u.id === selectedRequest.user_id)?.department_id)?.name || users.find(u => u.id === selectedRequest.user_id)?.department_id || 'ทั่วไป'}
                  </div>
                  <div className="text-[var(--text-muted)] mt-1">
                    ประเภท: <span className="text-blue-500 font-semibold">{selectedRequest.leave_type} ({selectedRequest.leave_duration} วัน)</span>
                  </div>
                  <div className="text-[var(--text-muted)] mt-0.5">
                    ช่วงเวลาที่ลา: <span className="font-medium text-[var(--text-main)]">{selectedRequest.date_start ? selectedRequest.date_start.split('-').reverse().join('-') : ''} ถึง {selectedRequest.date_end ? selectedRequest.date_end.split('-').reverse().join('-') : ''}</span>
                  </div>
                  <div className="text-[var(--text-muted)] mt-0.5">
                    เหตุผล: <span className="text-[var(--text-main)]">{selectedRequest.description}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 flex items-center">
                  หมายเหตุ / ความเห็นผู้อนุมัติ <span className="text-rose-500 ml-1">* (จำเป็นต้องระบุ)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุข้อความหรือหมายเหตุเพิ่มเติม ก่อนกดยืนยัน..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-sm bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--card-border)]">
              <button
                onClick={() => handleAction('Rejected')}
                disabled={!comment.trim()}
                className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all ${
                  !comment.trim() 
                  ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' 
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>ปฏิเสธคำขอ</span>
              </button>

              <button
                onClick={() => handleAction('Approved')}
                disabled={!comment.trim()}
                className={`py-2.5 px-5 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-lg ${
                  !comment.trim()
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 shadow-none cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-400 hover:to-sky-500 shadow-blue-500/25'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันอนุมัติ</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      <AdminEditLeaveModal 
        isOpen={!!adminEditRequest}
        onClose={() => setAdminEditRequest(null)}
        request={adminEditRequest}
        holidays={holidays}
        onAdminAction={handleAdminAction}
        isSubmitting={isSubmittingAdmin}
        users={users}
        agencies={agencies}
        departments={departments}
      />
    </div>
  );
}
