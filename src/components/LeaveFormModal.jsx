import React, { useState } from 'react';
import { X, Calendar, Upload, FileText, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { notifyLeaveApprover } from '../lib/lineNotify';

export default function LeaveFormModal({ isOpen, onClose, currentUser, users, userPolicies, onSubmitRequest }) {
  if (!isOpen) return null;

  const [leaveType, setLeaveType] = useState('Annual');
  const [description, setDescription] = useState('');
  const [dateStart, setDateStart] = useState(new Date().toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);
  const [leaveDuration, setLeaveDuration] = useState(1);
  const [selectedApprover1, setSelectedApprover1] = useState(currentUser?.approver_step1_id || 'USER-006');
  const [selectedApprover2, setSelectedApprover2] = useState(currentUser?.approver_step2_id || '');
  const [selectedApprover3, setSelectedApprover3] = useState(currentUser?.approver_step3_id || '');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // เช็ควันลาคงเหลือประเภทที่เลือก
  const currentPolicy = userPolicies.find(p => p.user_id === currentUser?.id && p.leave_type === leaveType);
  const remainingDays = currentPolicy ? currentPolicy.remaining_days : 0;

  const handleFileChange = (e) => {
    const uploaded = e.target.files[0];
    if (uploaded) {
      setFile(uploaded);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(uploaded);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // สร้าง ID ใหม่ e.g. LEV-0002
    const reqId = 'LEV-' + Math.floor(1000 + Math.random() * 9000);
    
    // ผู้อนุมัติที่เลือก
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

    const attachments = filePreview ? [
      { id: 'FILE-' + Math.floor(1000 + Math.random() * 9000), file_name: file?.name || 'เอกสารแนบ.jpg', file_url: filePreview }
    ] : [];

    const newRequest = {
      id: reqId,
      user_id: currentUser?.id,
      leave_type: leaveType,
      description,
      date_start: dateStart,
      date_end: dateEnd,
      leave_duration: parseFloat(leaveDuration),
      status: 'Pending',
      current_step: 1,
      total_steps: approvers.length,
      created_at: new Date().toISOString(),
      approvers,
      attachments
    };

    // บันทึก request
    onSubmitRequest(newRequest);

    // 🔔 ยิง LINE Push Notification 1:1 หาผู้อนุมัติ Step 1 ทันทีตาม logic รหัส.gs
    if (selectedApprover1) {
      const firstApprover = users.find(u => u.id === selectedApprover1);
      if (firstApprover && firstApprover.line_user_id) {
        await notifyLeaveApprover({
          approverName: firstApprover.fullname,
          lineUserId: firstApprover.line_user_id,
          requesterName: currentUser?.fullname,
          leaveType,
          dateRange: `${dateStart} ถึง ${dateEnd}`,
          stepNum: 1
        });
      }
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl glass-card rounded-3xl p-6 md:p-8 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ยื่นคำขอลางานใหม่</h3>
              <p className="text-xs text-slate-400">กรอกรายละเอียดเพื่อส่งอนุมัติไปยังหัวหน้างาน</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Leave Type Select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">ประเภทการลา</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm bg-slate-900 border-slate-700 text-white focus:outline-none"
              >
                <option value="Annual">ลาพักร้อน (Annual Leave)</option>
                <option value="Sick">ลาป่วย (Sick Leave)</option>
                <option value="Personal">ลากิจได้รับค่าจ้าง (Personal Leave)</option>
                <option value="Maternity">ลาคลอด (Maternity Leave)</option>
                <option value="Other">อื่นๆ (Other)</option>
              </select>
            </div>

            {/* Quota Badge */}
            <div className="flex items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs">
                <span className="text-slate-400">วันลาคงเหลือประเภทนี้: </span>
                <span className="text-emerald-400 font-bold text-sm ml-1">{remainingDays} วัน</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">เหตุผลการลา</label>
            <textarea
              required
              rows={2}
              placeholder="ระบุเหตุผลการลา..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-xl p-3 text-sm bg-slate-900 border-slate-700 text-white focus:outline-none"
            />
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">วันที่เริ่มลา</label>
              <input
                type="date"
                required
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-sm bg-slate-900 border-slate-700 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">วันที่สิ้นสุด</label>
              <input
                type="date"
                required
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-sm bg-slate-900 border-slate-700 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">จำนวน (วัน)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={leaveDuration}
                onChange={(e) => setLeaveDuration(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-sm bg-slate-900 border-slate-700 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Approvers Step 1 - 3 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>ลำดับผู้อนุมัติ (Multi-step Approvers)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ผู้อนุมัติคนที่ 1 (จำเป็น)</label>
                <select
                  required
                  value={selectedApprover1}
                  onChange={(e) => setSelectedApprover1(e.target.value)}
                  className="w-full glass-input text-xs rounded-xl p-2 bg-slate-950 border-slate-800 text-slate-200"
                >
                  <option value="">-- เลือกผู้อนุมัติ --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullname} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ผู้อนุมัติคนที่ 2 (ถ้ามี)</label>
                <select
                  value={selectedApprover2}
                  onChange={(e) => setSelectedApprover2(e.target.value)}
                  className="w-full glass-input text-xs rounded-xl p-2 bg-slate-950 border-slate-800 text-slate-200"
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullname} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ผู้อนุมัติคนที่ 3 (ถ้ามี)</label>
                <select
                  value={selectedApprover3}
                  onChange={(e) => setSelectedApprover3(e.target.value)}
                  className="w-full glass-input text-xs rounded-xl p-2 bg-slate-950 border-slate-800 text-slate-200"
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullname} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Attachment File */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">แนบไฟล์หลักฐาน / ใบรับรองแพทย์ (ถ้ามี)</label>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-2 transition-all">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>อัปโหลดรูปภาพ / เอกสาร</span>
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
              </label>
              {file && <span className="text-xs text-emerald-400 truncate max-w-xs">{file.name}</span>}
            </div>

            {filePreview && (
              <div className="mt-3 relative w-32 h-32 rounded-xl overflow-hidden border border-slate-700">
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setFilePreview(null); }}
                  className="absolute top-1 right-1 bg-slate-950/80 p-1 rounded-full text-rose-400 hover:text-rose-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-all"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งคำขออนุมัติ'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
