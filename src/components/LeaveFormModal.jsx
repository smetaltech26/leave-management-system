import React, { useState, useEffect } from 'react';
import { X, Calendar, Upload, FileText, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { notifyLeaveApprover } from '../lib/lineNotify';
import { sendEmailNotification } from '../services/emailService';

export default function LeaveFormModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  users, 
  userPolicies, 
  requests, 
  editingRequest, 
  holidays = [], 
  onSubmitRequest, 
  onEditRequest,
  agencies,
  departments,
  leaveTypes = []
}) {
  if (!isOpen) return null;

  const [leaveType, setLeaveType] = useState(leaveTypes[0]?.name || 'ลาพักร้อน');
  const [description, setDescription] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [dateStart, setDateStart] = useState(new Date().toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);
  const [leavePeriod, setLeavePeriod] = useState('Full');
  const [leaveDuration, setLeaveDuration] = useState(1);

  useEffect(() => {
    if (isOpen) {
      if (editingRequest) {
        setLeaveType(editingRequest.leave_type || 'ลาพักร้อน');
        setDescription(editingRequest.description || '');
        setDateStart(editingRequest.date_start || new Date().toISOString().split('T')[0]);
        setDateEnd(editingRequest.date_end || new Date().toISOString().split('T')[0]);
        setLeavePeriod(editingRequest.leave_period || 'Full');
        
        const attached = editingRequest.attachments?.[0]?.file_url || null;
        const attachedName = editingRequest.attachments?.[0]?.file_name || '';
        const isPdfFile = attachedName.toLowerCase().endsWith('.pdf') || attached?.toLowerCase().includes('.pdf');
        setIsPdf(isPdfFile);
        setFilePreview(attached);
        setFile(null);
      } else {
        setLeaveType('ลาพักร้อน');
        setDescription('');
        setDateStart(new Date().toISOString().split('T')[0]);
        setDateEnd(new Date().toISOString().split('T')[0]);
        setLeavePeriod('Full');
        setFile(null);
        setFilePreview(null);
        setIsPdf(false);
      }
    }
  }, [isOpen, editingRequest]);

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
      // ไม่นับวันอาทิตย์
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
  const [selectedApprover1, setSelectedApprover1] = useState('');
  const [selectedApprover2, setSelectedApprover2] = useState('');
  const [selectedApprover3, setSelectedApprover3] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingRequest) {
        setSelectedApprover1(editingRequest.approvers?.[0]?.approver_id || '');
        setSelectedApprover2(editingRequest.approvers?.[1]?.approver_id || '');
        setSelectedApprover3(editingRequest.approvers?.[2]?.approver_id || '');
      } else {
        setSelectedApprover1('');
        setSelectedApprover2('');
        setSelectedApprover3('');
      }
    }
  }, [isOpen, editingRequest, currentUser]);

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showApproverModal, setShowApproverModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // หาโควตาจาก userPolicies หรือใช้ค่าเริ่มต้น
  const currentPolicy = userPolicies.find(p => p.user_id === currentUser?.id && p.leave_type === leaveType);
  const defaultMaxDays = leaveType === 'ลาคลอด' ? 120 : 30;
  const maxDays = currentPolicy ? currentPolicy.max_days : defaultMaxDays; // ดีฟอลต์ให้ 120 หรือ 30 วันถ้ายังไม่มีในระบบ

  // คำนวณวันลาที่ใช้ไปสดๆ จากคำขอที่มีอยู่แล้ว
  const dynamicUsedDays = requests
    .filter(r => r.user_id === currentUser?.id && r.leave_type === leaveType && r.status !== 'Rejected' && r.id !== (editingRequest?.id || ''))
    .reduce((sum, r) => sum + Number(r.leave_duration), 0);

  const remainingDays = Math.max(0, maxDays - dynamicUsedDays);

  // Smart Canvas Compression: บีบอัดรูปถ่ายเอกสาร/ใบรับรองแพทย์ให้อ่านง่าย คมชัด และไฟล์เบา (~200-400 KB)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      // ถ้าไม่ใช่รูปภาพ หรือขนาดเล็กกว่า 350 KB อยู่แล้ว ไม่ต้องบีบอัด
      if (!file.type.startsWith('image/') || file.size < 350 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ file, preview: reader.result });
        };
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // เพดานความละเอียดสูงสุด 1800px (คมกริบสำหรับอ่านตัวหนังสือ/ใบรับรองแพทย์)
          const MAX_DIMENSION = 1800;
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // แปลงเป็น JPEG ความคมชัด 85%
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                const compressedFile = new File([blob], newFileName, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve({ file: compressedFile, preview: dataUrl });
              } else {
                resolve({ file, preview: dataUrl });
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const uploaded = e.target.files[0];
    if (uploaded) {
      const isPdfFile = uploaded.type === 'application/pdf' || uploaded.name?.toLowerCase().endsWith('.pdf');
      setIsPdf(isPdfFile);

      if (isPdfFile) {
        setFile(uploaded);
        setFilePreview(null);
      } else {
        const { file: optimizedFile, preview } = await compressImage(uploaded);
        setFile(optimizedFile);
        setFilePreview(preview);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dates
    if (new Date(dateEnd) < new Date(dateStart)) {
      setAlertMessage('ไม่สามารถส่งคำขอได้: วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น');
      return;
    }

    // Validate Quota
    if (leaveDuration > remainingDays) {
      setAlertMessage(`ไม่สามารถส่งคำขอได้: จำนวนวันลา (${leaveDuration} วัน) เกินสิทธิ์โควตาคงเหลือ (${remainingDays} วัน)`);
      return;
    }

    if (!selectedApprover1 || !selectedApprover2 || !selectedApprover3) {
      setAlertMessage('กรุณาเลือกผู้อนุมัติให้ครบทั้ง 3 ท่าน (หัวหน้างาน, ผู้จัดการ และ HR)');
      return;
    }

    setIsSubmitting(true);

    let newReqId = 'LEV-0001';
    if (requests && requests.length > 0) {
      const maxId = requests.reduce((max, r) => {
        if (!r.id || !r.id.startsWith('LEV-')) return max;
        const numStr = r.id.replace('LEV-', '');
        const num = parseInt(numStr, 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      newReqId = `LEV-${String(maxId + 1).padStart(4, '0')}`;
    }
    const reqId = editingRequest ? editingRequest.id : newReqId;
    
    const approvers = [];
    if (selectedApprover1) {
      const u1 = users.find(u => u.id === selectedApprover1);
      approvers.push({
        step_id: `${reqId}-STEP1`,
        step_number: 1,
        approver_id: selectedApprover1,
        approver_name: u1?.fullname || 'ผู้อนุมัติ Step 1',
        status: 'Pending',
        comment: ''
      });
    }
    if (selectedApprover2) {
      const u2 = users.find(u => u.id === selectedApprover2);
      approvers.push({
        step_id: `${reqId}-STEP2`,
        step_number: 2,
        approver_id: selectedApprover2,
        approver_name: u2?.fullname || 'ผู้อนุมัติ Step 2',
        status: 'Pending',
        comment: ''
      });
    }
    if (selectedApprover3) {
      const u3 = users.find(u => u.id === selectedApprover3);
      approvers.push({
        step_id: `${reqId}-STEP3`,
        step_number: 3,
        approver_id: selectedApprover3,
        approver_name: u3?.fullname || 'ผู้อนุมัติ Step 3',
        status: 'Pending',
        comment: ''
      });
    }

    // Keep the file object to be uploaded by App.jsx
    const attachments = file ? [
      { 
        id: 'FILE-' + Math.floor(1000 + Math.random() * 9000), 
        file_name: file.name || 'เอกสารแนบ', 
        file_url: filePreview, // Temporary preview URL
        raw_file: file // <--- Pass the raw file object
      }
    ] : [];

    const newRequest = {
      id: reqId,
      user_id: currentUser?.id,
      leave_type: leaveType,
      description,
      date_start: dateStart,
      date_end: dateEnd,
      leave_duration: leaveDuration, leave_period: leavePeriod,
      status: editingRequest ? editingRequest.status : 'Pending',
      current_step: editingRequest ? editingRequest.current_step : 1,
      total_steps: approvers.length,
      created_at: editingRequest ? editingRequest.created_at : new Date().toISOString(),
      approvers,
      attachments
    };

    try {
      if (editingRequest) {
        await onEditRequest(newRequest);
      } else {
        await onSubmitRequest(newRequest);
      }

      if (selectedApprover1) {
        const firstApprover = users.find(u => u.id === selectedApprover1);
        if (firstApprover) {
          // Line Notification
          if (firstApprover.line_user_id) {
            const notifyResult = await notifyLeaveApprover({
              approverName: firstApprover.fullname,
              lineUserId: firstApprover.line_user_id,
              requesterName: currentUser?.fullname,
              leaveType,
              dateRange: `${dateStart} ถึง ${dateEnd}`,
              stepNum: 1
            });
            
            if (notifyResult && !notifyResult.success) {
              console.warn("Line Notification failed:", notifyResult.errorMsg);
            }
          } else {
            console.warn("ผู้อนุมัติขั้นที่ 1 ไม่มี Line User ID");
          }

          // Email Notification
          if (firstApprover.email && !editingRequest) {
            const periodText = leavePeriod === 'Morning' ? 'เช้า' : leavePeriod === 'Afternoon' ? 'บ่าย' : 'ทั้งวัน';
            const htmlBody = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                <h2 style="color: #059669;">แจ้งเตือนขออนุมัติการลา</h2>
                <p>เรียน คุณ${firstApprover.fullname},</p>
                <p>ระบบได้รับคำขออนุมัติการลา โปรดพิจารณาอนุมัติคำขอดังกล่าว โดยมีรายละเอียดดังนี้:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 8px;"><strong>รหัสคำขอ:</strong> ${newRequest.id}</li>
                    <li style="margin-bottom: 8px;"><strong>พนักงานผู้ขอลา:</strong> ${currentUser?.fullname}</li>
                    <li style="margin-bottom: 8px;"><strong>ประเภทการลา:</strong> ${leaveType}</li>
                    <li style="margin-bottom: 8px;"><strong>วันที่ลา:</strong> ${dateStart.split('-').reverse().join('-')} ถึง ${dateEnd.split('-').reverse().join('-')}</li>
                    <li style="margin-bottom: 8px;"><strong>ช่วงเวลา:</strong> ${periodText}</li>
                    <li style="margin-bottom: 8px;"><strong>จำนวนวัน:</strong> ${leaveDuration} วัน</li>
                    <li style="margin-bottom: 0;"><strong>เหตุผลการลา:</strong> ${description}</li>
                  </ul>
                </div>
                <p>กรุณาเข้าสู่ระบบเพื่อตรวจสอบและพิจารณาอนุมัติคำขอ:</p>
                <p><a href="https://smetaltech26.github.io/leave-management-system/" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">เข้าสู่ระบบ</a></p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                <p style="font-size: 12px; color: #64748b;"><i>นี่คืออีเมลอัตโนมัติจากระบบ Leave Management System กรุณาอย่าตอบกลับ</i></p>
              </div>
            `;
            sendEmailNotification({
              to: firstApprover.email,
              subject: `📢 แจ้งเตือน: ขออนุมัติการลาจาก ${currentUser?.fullname} (รหัส: ${newRequest.id})`,
              body: htmlBody
            });
          }
        }
      }
      
      setIsSubmitting(false);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Form submit error:", error);
      setIsSubmitting(false);
      // The error alert is already handled in App.jsx
    }
  };

  const handleSuccessOk = () => {
    setShowSuccessPopup(false);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleApprover = (userId) => {
    if (selectedApprover1 === userId) setSelectedApprover1('');
    else if (selectedApprover2 === userId) setSelectedApprover2('');
    else if (selectedApprover3 === userId) setSelectedApprover3('');
    else if (!selectedApprover1) setSelectedApprover1(userId);
    else if (!selectedApprover2) setSelectedApprover2(userId);
    else if (!selectedApprover3) setSelectedApprover3(userId);
  };

  const isApproverSelected = (userId) => {
    return selectedApprover1 === userId || selectedApprover2 === userId || selectedApprover3 === userId;
  };
  
  const selectedApproversCount = [selectedApprover1, selectedApprover2, selectedApprover3].filter(Boolean).length;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-50 dark:bg-slate-900 w-[90vw] md:w-full md:max-w-2xl max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Success Popup Overlay */}
        {showSuccessPopup && (
          <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
                ส่งคำขอลาเรียบร้อยแล้ว
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                คำขอของคุณถูกส่งไปยังผู้อนุมัติตามลำดับขั้นตอนเรียบร้อยแล้ว
              </p>
              <button
                onClick={handleSuccessOk}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
              >
                ตกลง (OK)
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[var(--text-main)] dark:text-[var(--text-main)]">{editingRequest ? 'แก้ไขคำขอลางาน' : 'ยื่นคำขอลางาน'}</h3>
              <p className="text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)]">{editingRequest ? 'แก้ไขรายละเอียดคำขอเดิมที่ยังไม่มีผู้อนุมัติ' : 'กรอกรายละเอียดเพื่อส่งอนุมัติไปยังหัวหน้างาน'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900">
          <form id="leave-form" onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* Leave Type Select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[var(--text-muted)] mb-1.5">ประเภทการลา</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full glass-input-clean rounded-2xl px-3.5 py-3 text-sm focus:outline-none"
              >
                {leaveTypes.length > 0 ? (
                  leaveTypes.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))
                ) : (
                  <>
                    <option value="ลาพักร้อน">ลาพักร้อน (Annual Leave)</option>
                    <option value="ลาป่วย">ลาป่วย (Sick Leave)</option>
                    <option value="ลากิจได้รับค่าจ้าง">ลากิจได้รับค่าจ้าง (Personal Leave)</option>
                    <option value="ลาคลอด">ลาคลอด (Maternity Leave)</option>
                    <option value="ลากิจไม่ได้รับค่าจ้าง">ลากิจไม่ได้รับค่าจ้าง (Leave Without Pay)</option>
                    <option value="ลาอื่นๆ">ลาอื่นๆ (Other)</option>
                  </>
                )}
              </select>
            </div>

            {/* Quota Badge */}
            <div className="flex items-center p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs">
                <span className="text-[var(--text-muted)] dark:text-[var(--text-muted)]">วันลาคงเหลือประเภทนี้: </span>
                <span className="text-blue-700 dark:text-blue-400 font-extrabold text-sm ml-1">{remainingDays} วัน</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-[var(--text-muted)] mb-1.5">เหตุผลการลา</label>
            <textarea
              required
              rows={2}
              placeholder="ระบุเหตุผลการลา..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input-clean rounded-2xl p-3 text-sm focus:outline-none"
            />
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[var(--text-muted)] mb-1.5">วันที่เริ่มลา</label>
              <input
                type="date"
                required
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full glass-input-clean rounded-2xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[var(--text-muted)] mb-1.5">วันที่สิ้นสุด</label>
              <input
                type="date"
                required
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full glass-input-clean rounded-2xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[var(--text-muted)] mb-1.5">จำนวน (วัน)</label>
              <div className="w-full glass-input-clean rounded-2xl px-3 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 flex items-center justify-between shadow-inner">
                <span className="text-lg">{leaveDuration}</span>
                <span className="text-xs font-normal text-blue-500/70">วัน</span>
              </div>
            </div>
          </div>

          {/* Leave Period Toggle (Only for single day leave) */}
          {dateStart === dateEnd && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[var(--text-muted)] mb-1.5">ช่วงเวลาลา (เลือกครึ่งวันเฉพาะการลา 1 วัน)</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-[var(--card-border)] shadow-inner">
                <button
                  type="button"
                  onClick={() => setLeavePeriod('Full')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${leavePeriod === 'Full' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  เต็มวัน
                </button>
                <button
                  type="button"
                  onClick={() => setLeavePeriod('Morning')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${leavePeriod === 'Morning' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  ครึ่งเช้า
                </button>
                <button
                  type="button"
                  onClick={() => setLeavePeriod('Afternoon')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${leavePeriod === 'Afternoon' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  ครึ่งบ่าย
                </button>
              </div>
            </div>
          )}

          {/* Approvers Selection */}
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-[var(--card-bg)]/60 border border-slate-200 dark:border-[var(--card-border)] space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-[var(--text-muted)] mb-2">ผู้อนุมัติ</label>
            
            <button
              type="button"
              onClick={() => setShowApproverModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border dark:border-indigo-500/30 dark:hover:bg-indigo-500/30 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors mb-2 flex items-center space-x-2 shadow-sm dark:shadow-none"
            >
              <UserCheck className="w-4 h-4" />
              <span>เลือกผู้อนุมัติ</span>
            </button>

            {/* สรุปผู้อนุมัติที่เลือกแล้ว */}
            <div className="flex flex-wrap gap-2">
              {[selectedApprover1, selectedApprover2, selectedApprover3].filter(Boolean).map((id, index) => {
                const u = users.find(x => x.id === id);
                if (!u) return null;
                const roleTitle = u.role === 'SuperUser' ? 'หัวหน้างาน' : u.role === 'Admin' ? 'ผู้จัดการ' : u.role === 'SuperAdmin' ? 'HR' : u.role;
                return (
                  <div key={index} className="flex items-center space-x-3 bg-slate-50 dark:bg-[var(--card-bg)] border border-slate-200 dark:border-slate-700 p-3 rounded-2xl shadow-sm">
                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullname)}`} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{u.fullname}</div>
                      <div className="text-[11px] font-semibold text-slate-500">Step {index + 1} ({roleTitle})</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attachment File */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-[var(--text-muted)] mb-1.5">แนบไฟล์หลักฐาน / ใบรับรองแพทย์ (ถ้ามี)</label>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-[var(--card-bg)] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-[var(--text-muted)] text-xs font-semibold border border-slate-200 dark:border-[var(--card-border)] flex items-center space-x-2 transition-all">
                <Upload className="w-4 h-4 text-blue-500" />
                <span>อัปโหลดรูปภาพ / เอกสาร</span>
                <input type="file" accept="image/*,.pdf,application/pdf" onChange={handleFileChange} className="hidden" />
              </label>
              {file && <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate max-w-xs">{file.name}</span>}
            </div>

            {/* Distinct Preview for PDF & Images */}
            {(isPdf && file) ? (
              <div className="mt-3 flex items-center justify-between p-3.5 bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl shadow-sm animate-in fade-in">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</div>
                    <div className="text-[11px] text-rose-500 font-semibold mt-0.5">
                      เอกสาร PDF {file.size ? `(${(file.size / (1024 * 1024)).toFixed(2)} MB)` : ''}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setFilePreview(null); setIsPdf(false); }}
                  className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-full text-rose-500 transition-colors"
                  title="ลบไฟล์แนบ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (isPdf && filePreview) ? (
              <div className="mt-3 flex items-center justify-between p-3.5 bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl shadow-sm animate-in fade-in">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">เอกสารแนบเดิม (PDF)</div>
                    <div className="text-[11px] text-rose-500 font-semibold mt-0.5">แนบอยู่ในระบบเรียบร้อย</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setFilePreview(null); setIsPdf(false); }}
                  className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-full text-rose-500 transition-colors"
                  title="ลบไฟล์แนบ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : filePreview ? (
              <div className="mt-3 relative w-36 h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-[var(--card-border)] shadow-md group">
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold bg-slate-900/80 px-2 py-1 rounded-md">รูปภาพแนบ</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setFilePreview(null); setIsPdf(false); }}
                  className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-rose-600 p-1.5 rounded-full text-white transition-colors shadow-sm"
                  title="ลบรูปภาพ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          </form>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white dark:bg-transparent dark:text-rose-500 dark:border dark:border-rose-500/50 dark:hover:bg-rose-500/10 transition-colors"
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            form="leave-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/30 dark:shadow-none dark:bg-emerald-600/80 dark:hover:bg-emerald-600 flex items-center space-x-2"
          >
            {isSubmitting ? <span>กำลังส่งข้อมูล...</span> : <span>ส่งคำขออนุมัติ</span>}
          </button>
        </div>

      </div>
    </div>

    {/* Custom Alert Modal */}
    {alertMessage && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 md:p-8 text-center transform scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">แจ้งเตือน</h3>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">{alertMessage}</p>
          <button
            type="button"
            onClick={() => setAlertMessage('')}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-slate-800/20 active:scale-95"
          >
            ตกลง, เข้าใจแล้ว
          </button>
        </div>
      </div>
    )}

    {/* Approver Selection Modal (ซ้อนอีกชั้น) */}
    {showApproverModal && (
      <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-3xl max-h-[calc(100svh-2rem)] md:max-h-[85vh] min-h-0 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
            <h3 className="text-lg font-extrabold text-[var(--text-main)] dark:text-[var(--text-main)]">เลือกผู้อนุมัติ (เลือก 3 คน)</h3>
            <button onClick={() => setShowApproverModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Body */}
          <div className="p-6 flex-1 min-h-0 overflow-y-auto space-y-8">
            
            {/* หัวหน้า (SuperUser) */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">หัวหน้างาน (SuperUser)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {users.filter(u => u.role === 'SuperUser').map(u => (
                  <div 
                    key={u.id}
                    onClick={() => toggleApprover(u.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${isApproverSelected(u.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--card-bg)] hover:border-emerald-300'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullname)}`} className="w-14 h-14 rounded-full object-cover" />
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{u.fullname}</div>
                        <div className="text-[11px] text-slate-500">{agencies?.find(a => a.id === u.agency_id)?.name || u.agency_id || 'SMT'} | {departments?.find(d => d.id === u.department_id)?.name || u.department_id || 'ทั่วไป'}</div>
                      </div>
                    </div>
                    {isApproverSelected(u.id) && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                ))}
              </div>
            </div>

            {/* ผู้จัดการ (Admin) */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">ผู้จัดการ (Admin)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {users.filter(u => u.role === 'Admin').map(u => (
                  <div 
                    key={u.id}
                    onClick={() => toggleApprover(u.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${isApproverSelected(u.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--card-bg)] hover:border-emerald-300'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullname)}`} className="w-14 h-14 rounded-full object-cover" />
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{u.fullname}</div>
                        <div className="text-[11px] text-slate-500">{agencies?.find(a => a.id === u.agency_id)?.name || u.agency_id || 'SMT'} | {departments?.find(d => d.id === u.department_id)?.name || u.department_id || 'ทั่วไป'}</div>
                      </div>
                    </div>
                    {isApproverSelected(u.id) && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                ))}
              </div>
            </div>

            {/* HR (SuperAdmin) */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">HR (SuperAdmin)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {users.filter(u => u.role === 'SuperAdmin').map(u => (
                  <div 
                    key={u.id}
                    onClick={() => toggleApprover(u.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${isApproverSelected(u.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--card-bg)] hover:border-emerald-300'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullname)}`} className="w-14 h-14 rounded-full object-cover" />
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{u.fullname}</div>
                        <div className="text-[11px] text-slate-500">{agencies?.find(a => a.id === u.agency_id)?.name || u.agency_id || 'SMT'} | {departments?.find(d => d.id === u.department_id)?.name || u.department_id || 'ทั่วไป'}</div>
                      </div>
                    </div>
                    {isApproverSelected(u.id) && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                ))}
              </div>
            </div>
            
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
            <span className={`text-sm font-bold ${selectedApproversCount === 3 ? 'text-emerald-500' : 'text-amber-500'}`}>
              เลือกแล้ว {selectedApproversCount}/3
            </span>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowApproverModal(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white dark:bg-transparent dark:text-rose-500 dark:border dark:border-rose-500/50 dark:hover:bg-rose-500/10 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={selectedApproversCount !== 3}
                onClick={() => setShowApproverModal(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/30 dark:shadow-none dark:bg-emerald-600/80 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
