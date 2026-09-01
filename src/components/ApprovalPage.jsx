import React, { useState, useRef } from 'react';
import { CheckCircle2, XCircle, Clock, FileText, User, MessageSquare, AlertCircle, Sparkles, Edit2, RefreshCcw, Search, X } from 'lucide-react';
import { notifyLeaveApprover, sendLinePushToUser } from '../lib/lineNotify';
import { sendEmailNotification } from '../services/emailService';
import AdminEditLeaveModal from './admin/AdminEditLeaveModal';
import LeaveTypeBadge from './ui/LeaveTypeBadge';
import { useModal } from '../contexts/ModalContext';

export default function ApprovalPage({ currentUser, requests, users, agencies = [], departments = [], onApproveStep, onRejectStep, onAdminEditRequest, holidays = [], onRefresh, leaveTypes = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('pending'); // pending | completed
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successType, setSuccessType] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');
  const [showAdminSuccessPopup, setShowAdminSuccessPopup] = useState(false);
  
  const [adminEditRequest, setAdminEditRequest] = useState(null);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { showAlert } = useModal();

  const [currentPageCompleted, setCurrentPageCompleted] = useState(1);
  const itemsPerPage = 24;
  const paginationRef = useRef(null);

  const handleRefresh = async () => {
    if (isRefreshing || !onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAdminAction = async (request, actionType, updates) => {
    setIsSubmittingAdmin(true);
    try {
      const msg = await onAdminEditRequest(request, actionType, updates);
      setAdminEditRequest(null);
      setAdminSuccessMsg(msg);
      setShowAdminSuccessPopup(true);
    } catch (err) {
      console.error(err);
      await showAlert("เกิดข้อผิดพลาดในการดำเนินการ: " + err.message);
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Filter Function
  const filterRequest = (r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    const requester = users.find(u => u.id === r.user_id);
    const fullname = (requester?.fullname || '').toLowerCase();
    const reqId = (r.id || '').toLowerCase();
    const empId = (requester?.employee_id || requester?.id || '').toLowerCase();
    const deptName = (departments?.find(d => d.id === requester?.department_id)?.name || requester?.department_id || '').toLowerCase();
    const agencyName = (agencies?.find(a => a.id === requester?.agency_id)?.name || requester?.agency_id || '').toLowerCase();
    const leaveType = (r.leave_type || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();

    return (
      fullname.includes(term) ||
      reqId.includes(term) ||
      empId.includes(term) ||
      deptName.includes(term) ||
      agencyName.includes(term) ||
      leaveType.includes(term) ||
      desc.includes(term)
    );
  };

  // คำขอที่คอยการอนุมัติจาก currentUser
  const pendingForMe = requests.filter(r => {
    if (r.status !== 'Pending') return false;
    const currentStepObj = r.approvers.find(a => a.step_number === r.current_step);
    return currentStepObj && currentStepObj.approver_id === currentUser?.id && currentStepObj.status === 'Pending';
  });

  // คำขอที่อนุมัติไปแล้ว
  const completedByMe = requests.filter(r => {
    // ถ้าเป็น SuperAdmin ให้เห็นคำขอทั้งหมดที่ "Approved" หรือ "Rejected" แล้ว
    if (currentUser?.role === 'SuperAdmin') {
      return r.status === 'Approved' || r.status === 'Rejected';
    }
    return r.approvers.some(a => a.approver_id === currentUser?.id && a.status !== 'Pending');
  });

  const filteredPending = pendingForMe.filter(filterRequest);
  const filteredCompleted = completedByMe.filter(filterRequest);

  // Calculate pagination for completed tab
  const totalCompletedItems = filteredCompleted.length;
  const totalCompletedPages = Math.ceil(totalCompletedItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPageCompleted, totalCompletedPages);

  const currentCompletedList = filteredCompleted.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const displayList = activeSubTab === 'pending' ? filteredPending : currentCompletedList;

  const handleAction = async (action) => {
    if (!selectedRequest || isSubmittingAction) return;
    setIsSubmittingAction(true);
    
    try {
      const currentStepNum = selectedRequest.current_step;
    const isFinalStep = currentStepNum >= selectedRequest.approvers.length;

    if (action === 'Approved') {
      await onApproveStep(selectedRequest.id, currentStepNum, comment);
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
                  <p><a href="https://smetaltech26.github.io/leave-management-system/" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">เข้าสู่ระบบ</a></p>
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
                      <li style="margin-bottom: 8px;"><strong>วันที่เริ่ม:</strong> ${selectedRequest.date_start.split('-').reverse().join('-')} <strong>ถึง</strong> ${selectedRequest.date_end.split('-').reverse().join('-')}</li>
                      <li style="margin-bottom: 8px;"><strong>จำนวนวัน:</strong> ${selectedRequest.leave_duration} วัน ${selectedRequest.leave_period === 'Morning' ? '(เช้า)' : selectedRequest.leave_period === 'Afternoon' ? '(บ่าย)' : ''}</li>
                  </ul>
                </div>
                <p><a href="https://smetaltech26.github.io/leave-management-system/" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">ตรวจสอบประวัติการลาของคุณ</a></p>
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
      await onRejectStep(selectedRequest.id, currentStepNum, comment);

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
              <p><a href="https://smetaltech26.github.io/leave-management-system/" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">เข้าสู่ระบบ</a></p>
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

    setSuccessType(action === 'Approved' ? 'approved' : 'rejected');
    setShowSuccessPopup(true);
    } catch (error) {
      console.error("Action error:", error);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSuccessOk = () => {
    setShowSuccessPopup(false);
    setSelectedRequest(null);
    setComment('');
  };

  return (
    <div className="space-y-6">
      
      {/* Title Banner & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center space-x-2 whitespace-nowrap">
              <span>การอนุมัติคำขอลางาน</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">รายการคำขอลางานที่รอให้คุณตรวจสอบและอนุมัติตามลำดับขั้นตอน</p>
          </div>

          {/* Actions & Sub Tabs */}
          <div className="flex items-center space-x-2 sm:space-x-3 self-start sm:self-auto">
            {/* Reload Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-800 dark:hover:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-sm space-x-1.5"
              title="โหลดข้อมูลล่าสุด"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              <span>รีโหลด</span>
            </button>

            {/* Sub Tabs */}
            <div className="flex p-1 bg-[var(--card-bg)]/80 rounded-2xl border border-[var(--card-border)]">
              <button
                onClick={() => {
                  setActiveSubTab('pending');
                  setCurrentPageCompleted(1);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 ${
                  activeSubTab === 'pending'
                    ? 'bg-blue-500 dark:bg-blue-900/30 text-white dark:text-blue-400 shadow-lg shadow-blue-500/25 dark:shadow-none'
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
                onClick={() => {
                  setActiveSubTab('completed');
                  setCurrentPageCompleted(1);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeSubTab === 'completed'
                    ? 'bg-blue-500 dark:bg-blue-900/30 text-white dark:text-blue-400 shadow-lg shadow-blue-500/25 dark:shadow-none'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>ดำเนินการแล้ว</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-1/2 lg:w-5/12 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ-นามสกุล, เลขที่คำขอ, แผนก หรือฝ่าย..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPageCompleted(1);
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--card-border)] rounded-2xl text-xs sm:text-sm text-[var(--text-main)] focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPageCompleted(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
                title="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setCurrentPageCompleted(1)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>ค้นหา</span>
          </button>
        </div>
      </div>

      {/* Request Cards List */}
      {displayList.length > 0 ? (
        <div className="space-y-6">
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
                      className="w-24 h-24 rounded-3xl object-cover ring-2 ring-blue-500/30 shadow-md"
                    />
                    <div>
                      <div className="font-semibold text-sm text-[var(--text-main)]">{requester?.fullname || req.user_id}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {agencies?.find(a => a.id === requester?.agency_id)?.name || requester?.agency_id || 'SMT'} • {departments?.find(d => d.id === requester?.department_id)?.name || requester?.department_id || 'ทั่วไป'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <div className="flex items-center space-x-2">
                      <LeaveTypeBadge type={req.leave_type} />
                      <span className="whitespace-nowrap shrink-0 px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {req.leave_duration} วัน {req.leave_period === 'Morning' ? '(เช้า)' : req.leave_period === 'Afternoon' ? '(บ่าย)' : ''}
                      </span>
                    </div>
                    <span className={`whitespace-nowrap px-2.5 py-1 text-xs font-semibold rounded-lg border shrink-0 ${
                      activeSubTab === 'completed'
                        ? req.status === 'Rejected'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {req.id} {activeSubTab === 'completed' ? (req.status === 'Rejected' ? (req.reject_reason?.startsWith('ยกเลิกโดย') ? '(ยกเลิก)' : '(ไม่อนุมัติ)') : '(อนุมัติแล้ว)') : `(Step ${req.current_step}/${req.total_steps})`}
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
                      const hasComment = step.comment && typeof step.comment === 'string' && step.comment.trim() !== '';

                      return (
                        <div
                          key={step.step_id || step.id || `step-${step.step_number}`}
                          className={`px-3 py-2 rounded-xl border text-xs flex flex-col justify-center min-w-[130px] transition-all shadow-sm ${
                            step.status === 'Approved'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                              : step.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--card-border)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold">{approverName}</span>
                            <span className={`font-semibold text-[10px] shrink-0 px-1.5 py-0.5 rounded ${
                              step.status === 'Approved'
                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                                : step.status === 'Rejected'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                              ({step.status})
                            </span>
                          </div>
                          
                          {hasComment && (
                            <div className="mt-1 pt-1 border-t border-current/15 text-[11px] font-normal flex items-start gap-1">
                              <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 opacity-70" />
                              <span className="break-words font-medium italic">"{step.comment}"</span>
                            </div>
                          )}
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
                {activeSubTab === 'completed' && currentUser?.role === 'SuperAdmin' && req.status === 'Approved' && (
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

          {/* Pagination UI for Completed Tab */}
          {activeSubTab === 'completed' && totalCompletedItems > 0 && (
            <div ref={paginationRef} className="flex flex-col items-center justify-center space-y-4 pt-4 pb-32 sm:pb-12">
              <div className="text-[14px] font-medium text-slate-600 dark:text-slate-400">
                แสดง {(safeCurrentPage - 1) * itemsPerPage + 1} ถึง {Math.min(safeCurrentPage * itemsPerPage, totalCompletedItems)} จากทั้งหมด {totalCompletedItems} รายการ
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setCurrentPageCompleted(p => Math.max(1, p - 1));
                    setTimeout(() => paginationRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }), 250);
                  }}
                  disabled={safeCurrentPage === 1}
                  className="px-5 py-2.5 bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--card-border)] rounded-xl text-slate-500 dark:text-slate-400 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  ย้อนกลับ
                </button>
                <div className="font-extrabold text-[var(--text-main)] text-[15px]">
                  หน้า {safeCurrentPage} / {totalCompletedPages}
                </div>
                <button
                  onClick={() => {
                    setCurrentPageCompleted(p => Math.min(totalCompletedPages, p + 1));
                    setTimeout(() => paginationRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }), 250);
                  }}
                  disabled={safeCurrentPage === totalCompletedPages}
                  className="px-5 py-2.5 bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--card-border)] rounded-xl text-blue-600 dark:text-blue-400 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card-clean rounded-2xl p-12 text-center text-[var(--text-muted)] space-y-3">
          {searchTerm ? (
            <>
              <Search className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-[var(--text-main)]">ไม่พบคำขอลางานที่ตรงกับคำค้นหา "{searchTerm}"</p>
              <p className="text-xs text-[var(--text-muted)]">ลองค้นหาด้วยชื่อ, นามสกุล, เลขที่คำขอ หรือชื่อแผนกอื่นดูนะคะ</p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 mt-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all inline-block shadow-sm"
              >
                ล้างการค้นหาทั้งหมด
              </button>
            </>
          ) : (
            <>
              <Clock className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[var(--text-muted)]">ไม่มีรายการคำขอลางานที่ต้องดำเนินการในขณะนี้</p>
            </>
          )}
        </div>
      )}

      {/* Modal Confirm Approval / Reject */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative flex flex-col overflow-hidden max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0">
            
            {/* Success Popup Overlay */}
            {showSuccessPopup && (
              <div className="absolute inset-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${successType === 'approved' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/20'}`}>
                    {successType === 'approved' ? (
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    ) : (
                      <XCircle className="w-10 h-10 text-rose-500" />
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
                    {successType === 'approved' ? 'อนุมัติเรียบร้อย' : 'ปฏิเสธคำขอเรียบร้อย'}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    {successType === 'approved' 
                      ? 'คำขอลางานได้รับการอนุมัติและแจ้งเตือนผู้เกี่ยวข้องแล้ว' 
                      : 'คำขอลางานถูกปฏิเสธและแจ้งเตือนผู้ขอลาแล้ว'}
                  </p>
                  <button
                    onClick={handleSuccessOk}
                    className={`w-full py-3.5 text-white font-extrabold rounded-2xl transition-all shadow-lg active:scale-95 ${
                      successType === 'approved' 
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' 
                        : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                    }`}
                  >
                    ตกลง (OK)
                  </button>
                </div>
              </div>
            )}
            
            {/* Header (Fixed) */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
              <h3 className="text-base font-bold text-[var(--text-main)]">พิจารณาอนุมัติคำขอลางาน ({selectedRequest.id})</h3>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-4 text-xs flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start space-x-4 shadow-sm">
                <img 
                  src={users.find(u => u.id === selectedRequest.user_id)?.avatar_url || `https://ui-avatars.com/api/?name=${selectedRequest.user_id}&background=random`} 
                  alt="Requester" 
                  className="w-20 h-20 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover shadow-md shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-[var(--text-main)] truncate">
                    {users.find(u => u.id === selectedRequest.user_id)?.fullname || selectedRequest.user_id}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 mb-1">
                    {agencies?.find(a => a.id === users.find(u => u.id === selectedRequest.user_id)?.agency_id)?.name || users.find(u => u.id === selectedRequest.user_id)?.agency_id || 'SMT'} • {departments?.find(d => d.id === users.find(u => u.id === selectedRequest.user_id)?.department_id)?.name || users.find(u => u.id === selectedRequest.user_id)?.department_id || 'ทั่วไป'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-muted)] text-xs shrink-0">ประเภท:</span>
                      <LeaveTypeBadge type={selectedRequest.leave_type} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap mt-1 sm:mt-0">
                      ({selectedRequest.leave_duration} วัน{selectedRequest.leave_period === 'Morning' ? ' - เช้า' : selectedRequest.leave_period === 'Afternoon' ? ' - บ่าย' : ''})
                    </span>
                  </div>
                  <div className="text-[var(--text-muted)] mt-1">
                    ช่วงเวลาที่ลา: <span className="font-medium text-[var(--text-main)]">{selectedRequest.date_start ? selectedRequest.date_start.split('-').reverse().join('-') : ''} ถึง {selectedRequest.date_end ? selectedRequest.date_end.split('-').reverse().join('-') : ''}</span>
                  </div>
                  <div className="text-[var(--text-muted)] mt-1">
                    เหตุผล: <span className="text-[var(--text-main)] font-medium">{selectedRequest.description}</span>
                  </div>
                </div>
              </div>

              {/* Approval Chain with comments */}
              {selectedRequest.approvers && selectedRequest.approvers.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] block">ลำดับการอนุมัติและความเห็น (Approval Chain):</span>
                  <div className="space-y-1.5">
                    {[...selectedRequest.approvers].sort((a, b) => a.step_number - b.step_number).map((st) => {
                      const apUser = users.find(u => u.id === st.approver_id);
                      const apName = apUser ? apUser.fullname : 'ผู้อนุมัติ';
                      const isApproved = st.status === 'Approved';
                      const isRejected = st.status === 'Rejected';
                      const hasStepComment = st.comment && typeof st.comment === 'string' && st.comment.trim() !== '';

                      return (
                        <div key={st.step_id || st.id || `m-step-${st.step_number}`} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px]">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-[var(--text-main)]">ขั้นที่ {st.step_number}: {apName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              isApproved ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                              isRejected ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                              'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {st.status}
                            </span>
                          </div>
                          {hasStepComment && (
                            <div className="mt-1 text-slate-600 dark:text-slate-300 italic flex items-start gap-1 font-normal">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <span className="break-words">"{st.comment}"</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-1">
                <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5 flex items-center">
                  หมายเหตุ / ความเห็นผู้อนุมัติ <span className="text-rose-500 ml-1 font-bold">* (จำเป็นต้องระบุ)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="ระบุข้อความหรือหมายเหตุเพิ่มเติม ก่อนกดยืนยัน..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full glass-input-clean rounded-2xl p-3.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all resize-none"
                  required
                />
              </div>
            </div>

            {/* Buttons (Fixed Footer) */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3 bg-white dark:bg-slate-900 shrink-0">
              <button
                onClick={() => handleAction('Rejected')}
                disabled={!comment.trim() || isSubmittingAction}
                className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all ${
                  !comment.trim() || isSubmittingAction
                  ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' 
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>{isSubmittingAction ? 'กำลังดำเนินการ...' : 'ปฏิเสธคำขอ'}</span>
              </button>

              <button
                onClick={() => handleAction('Approved')}
                disabled={!comment.trim() || isSubmittingAction}
                className={`py-2.5 px-5 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-lg ${
                  !comment.trim() || isSubmittingAction
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 shadow-none cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-400 hover:to-sky-500 shadow-blue-500/25'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingAction ? 'กำลังดำเนินการ...' : 'ยืนยันอนุมัติ'}</span>
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
        leaveTypes={leaveTypes}
      />

      {/* Admin Success Popup Overlay */}
      {showAdminSuccessPopup && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[var(--card-bg)] w-full max-w-sm rounded-[2rem] shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-[var(--card-border)]">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
              ดำเนินการสำเร็จ
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              {adminSuccessMsg}
            </p>
            <button
              onClick={() => setShowAdminSuccessPopup(false)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
            >
              ตกลง (OK)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
