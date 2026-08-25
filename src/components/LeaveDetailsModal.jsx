import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Clock, XCircle, FileText, User, Calendar, Activity, Paperclip, ExternalLink, Eye, Image as ImageIcon, ZoomIn, ZoomOut, RotateCw, RotateCcw } from 'lucide-react';
import LeaveTypeBadge, { getLeaveTypeMeta } from './ui/LeaveTypeBadge';
import { supabase } from '../lib/supabase';

export default function LeaveDetailsModal({ 
  isOpen, 
  onClose, 
  request, 
  user, 
  allPolicies = [], 
  users = [], 
  agencies = [], 
  departments = [], 
  leaveTypes = [] 
}) {
  const [approvalSteps, setApprovalSteps] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (lightboxImage) {
      setZoomScale(1);
      setRotation(0);
      setPanPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [lightboxImage]);

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(Number((prev + 0.5).toFixed(1)), 4));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomScale(prev => Math.min(Number((prev + 0.25).toFixed(2)), 4));
    } else {
      setZoomScale(prev => {
        const next = Math.max(Number((prev - 0.25).toFixed(2)), 1);
        if (next === 1) setPanPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDown = (e) => {
    if (zoomScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomScale > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoomScale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panPosition.x, y: e.touches[0].clientY - panPosition.y });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && zoomScale > 1 && e.touches.length === 1) {
      setPanPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isOpen && request) {
      // ดึงข้อมูลขั้นตอนการอนุมัติจาก request object โดยตรง (รองรับข้อมูลที่เพิ่งสร้างใหม่)
      if (request.approvers && Array.isArray(request.approvers) && request.approvers.length > 0) {
        // Map ข้อมูลให้อยู่ในโครงสร้างเดียวกับที่ UI ต้องการ
        const mappedSteps = request.approvers.map(a => ({
          ...a,
          approver: {
            fullname: a.approver_name || a.approver_id,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(a.approver_name || a.approver_id || 'Approver')}&background=random`
          }
        })).sort((a, b) => (Number(a.step_number) || 0) - (Number(b.step_number) || 0));
        setApprovalSteps(mappedSteps);
      } else {
        setApprovalSteps([]);
      }
      
      const fetchAttachments = async () => {
        const { data, error } = await supabase
          .from('attachments')
          .select('*')
          .eq('request_id', request.id);
        
        if (!error && data) {
          setAttachments(data);
        } else {
          setAttachments([]);
        }
      };
      
      fetchAttachments();
    } else {
      setAttachments([]);
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const targetUser = user || (users || []).find(u => u && u.id === request.user_id);

  const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return dateStr || '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year ? year.slice(-2) : ''}`;
  };

  // Calculate Policy Usage (if policies are provided)
  const policy = (allPolicies || []).find(p => p && p.leave_type === request.leave_type && (p.user_id === request.user_id || p.user_id === targetUser?.id));
  const quota = policy ? Number(policy.max_days) || 0 : 0;
  const used = policy ? Number(policy.used_days) || 0 : 0;
  const remaining = policy ? Number(policy.remaining_days) || 0 : 0;
  const percentage = quota > 0 ? Math.round((used / quota) * 100) : 0;

  const meta = getLeaveTypeMeta(request.leave_type);
  const Icon = meta.icon;

  const formatCreatedAt = () => {
    if (!request.created_at) return 'ไม่ระบุ';
    try {
      const d = new Date(request.created_at);
      if (isNaN(d.getTime())) return String(request.created_at);
      return d.toLocaleString('th-TH');
    } catch (e) {
      return String(request.created_at);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] shadow-2xl w-[90vw] md:w-full md:max-w-2xl max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 relative" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${meta.iconBg}`}>
              <Icon className={`w-5 h-5 ${meta.iconColor}`} />
            </div>
            <div className="min-w-0 pr-2">
              <h2 className="text-sm md:text-base lg:text-lg font-bold text-[var(--text-main)] leading-tight">รายละเอียดคำขอ {request.id}</h2>
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium truncate mt-0.5">ยื่นเมื่อ: {formatCreatedAt()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-6 bg-slate-50 dark:bg-slate-900">
          
          <div className="rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm flex flex-col overflow-hidden min-w-0">
            
            {/* Top row: 2 columns */}
            <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-800">
              
              {/* Left col: User Info */}
              <div className="p-4 sm:p-6 flex flex-col items-start relative">
                <img 
                  src={targetUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser?.fullname || request.user_id || 'User')}&background=random`}
                  alt="Profile" 
                  className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full border-2 border-slate-100 dark:border-slate-800 shadow-sm mb-3 sm:mb-4 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser?.fullname || request.user_id || 'User')}&background=random`;
                  }}
                />
                <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-[var(--text-main)] truncate max-w-full">{targetUser?.fullname || request.user_id}</h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-[var(--text-muted)] truncate max-w-full">{agencies?.find(a => a?.id === targetUser?.agency_id)?.name || targetUser?.agency_id || 'ไม่ระบุสังกัด'} | {departments?.find(d => d?.id === targetUser?.department_id)?.name || targetUser?.department_id || 'ไม่ระบุฝ่าย'}</p>
                
                {/* Status Badge */}
                <div className="mt-3">
                  {request.status === 'Approved' ? (
                    <span className="px-3 py-1 rounded-full text-[11px] md:text-sm font-bold bg-blue-50 text-blue-600 border border-blue-100 flex items-center shadow-sm w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" /> อนุมัติแล้ว
                    </span>
                  ) : request.status === 'Rejected' ? (
                    <span className="px-3 py-1 rounded-full text-[11px] md:text-sm font-bold bg-rose-50 text-rose-600 border border-rose-100 flex items-center shadow-sm w-fit">
                      <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" /> {request.reject_reason?.startsWith('ยกเลิกโดย') ? 'ยกเลิก' : 'ไม่อนุมัติ'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] md:text-sm font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center shadow-sm w-fit">
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" /> รออนุมัติ
                    </span>
                  )}
                </div>
              </div>

              {/* Right col: Leave Details */}
              <div className="p-4 sm:p-6 flex flex-col justify-center border-l border-slate-100 dark:border-slate-800">
                <div className="text-xs md:text-sm font-bold text-[var(--text-muted)] mb-1.5">ประเภทการลา</div>
                <div className="mb-5">
                  <LeaveTypeBadge type={request.leave_type} size="md" className="md:scale-110 origin-left" />
                </div>
                
                <div className="text-xs md:text-sm font-bold text-[var(--text-muted)] mb-1">ช่วงเวลาที่ลา</div>
                <div className="font-bold text-[var(--text-main)] text-sm md:text-base">
                  {request.date_start === request.date_end 
                    ? formatDate(request.date_start) 
                    : `${formatDate(request.date_start)} ถึง ${formatDate(request.date_end)}`}
                </div>
                <div className="text-xs md:text-sm text-[var(--text-muted)] mt-1 font-medium">
                  จำนวน {request.leave_duration} วัน {request.leave_period === 'Morning' ? '(เช้า)' : request.leave_period === 'Afternoon' ? '(บ่าย)' : ''}
                </div>
              </div>
            </div>

            {/* Bottom row: Quota */}
            <div className="p-6">
              {policy ? (
                <>
                  <div className="flex justify-between items-end mb-3">
                    <div className="text-sm md:text-base font-bold text-[var(--text-main)]">โควตาวันลาคงเหลือ</div>
                    <div className={`text-3xl md:text-4xl font-black ${meta.iconColor}`}>{remaining} <span className="text-sm md:text-base font-bold text-[var(--text-main)]">วัน</span></div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 md:h-4 mb-3 overflow-hidden shadow-inner">
                    <div className={`h-3 md:h-4 rounded-full bg-gradient-to-r ${meta.bar} transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                  </div>
                  <div className="text-xs md:text-sm text-[var(--text-muted)] font-medium text-right">ใช้ไปแล้ว {used}/{quota} วัน ({percentage}%)</div>
                </>
              ) : (
                <div className="text-center text-[var(--text-muted)] text-sm font-medium opacity-60 py-2">ไม่มีข้อมูลโควตา</div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-[var(--card-border)] shadow-sm">
            <div className="text-xs md:text-sm font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">เหตุผลการลา / รายละเอียด</div>
            <p className="text-sm md:text-base text-[var(--text-main)] font-medium leading-relaxed">{request.description || '-'}</p>
          </div>

          {request.reject_reason && (
            <div className={`p-4 rounded-2xl border shadow-sm ${request.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50'}`}>
              <div className={`text-xs font-bold mb-1 uppercase tracking-wider ${request.status === 'Rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>เหตุผล</div>
              <p className={`text-sm font-medium leading-relaxed ${request.status === 'Rejected' ? 'text-rose-700 dark:text-rose-300' : 'text-blue-700 dark:text-blue-300'}`}>{request.reject_reason}</p>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-[var(--card-border)] shadow-sm">
              <div className="text-xs md:text-sm font-bold text-[var(--text-muted)] mb-3 uppercase tracking-wider flex items-center">
                <Paperclip className="w-4 h-4 mr-1.5" /> เอกสารแนบ ({attachments.length})
              </div>
              <div className="flex flex-col gap-3">
                {attachments.map((file, idx) => {
                  const url = file.file_url?.toLowerCase() || '';
                  const name = file.file_name?.toLowerCase() || '';
                  const isImg = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp') || name.endsWith('.gif') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp') || url.startsWith('data:image/');

                  if (isImg) {
                    return (
                      <div key={file.id || idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 rounded-md shrink-0">รูปภาพ</span>
                            <span className="text-xs font-bold text-[var(--text-main)] truncate">{file.file_name || 'รูปภาพประกอบการลา'}</span>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setLightboxImage({ url: file.file_url, name: file.file_name || 'รูปภาพประกอบการลา' })}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg flex items-center space-x-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดูรูปขยาย</span>
                            </button>
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              title="เปิดในแท็บใหม่"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url: file.file_url, name: file.file_name || 'รูปภาพประกอบการลา' })}
                          className="w-full block relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-60 group cursor-zoom-in shadow-inner bg-slate-100 dark:bg-slate-900 focus:outline-none"
                        >
                          <img
                            src={file.file_url}
                            alt={file.file_name || 'เอกสารแนบ'}
                            className="w-full h-auto max-h-60 object-contain mx-auto group-hover:scale-[1.02] transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 text-white text-xs font-bold">
                            <Eye className="w-4 h-4" />
                            <span>คลิกเพื่อดูรูปภาพขนาดใหญ่ (ในแอป)</span>
                          </div>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <a
                      key={file.id || idx}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 bg-rose-50/70 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl border border-rose-200 dark:border-rose-500/30 transition-all group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-rose-600 transition-colors">
                            {file.file_name || 'เอกสารประกอบการลา (PDF)'}
                          </div>
                          <div className="text-[11px] text-rose-500 font-semibold mt-0.5 flex items-center space-x-1">
                            <span>เอกสาร PDF</span>
                            <span>•</span>
                            <span>คลิกเพื่อเปิดดูไฟล์</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-1 shadow-sm shrink-0">
                        <span>เปิดดู</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </a>
                  );
                })}
              </div>
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
                              try {
                                const d = new Date(step.action_date);
                                if (isNaN(d.getTime())) return String(step.action_date);
                                let dtStr = d.toLocaleString('en-GB').replace(',', '');
                                if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) {
                                  return d.toLocaleDateString('en-GB');
                                }
                                return dtStr;
                              } catch (e) {
                                return String(step.action_date);
                              }
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

      {/* In-App Image Lightbox Modal with Zoom & Pan */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          {/* Lightbox Header */}
          <div 
            className="w-full max-w-5xl flex items-center justify-between p-2 text-white shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center space-x-2 min-w-0">
              <span className="px-2.5 py-1 text-xs font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30 rounded-lg shrink-0">รูปภาพแนบ</span>
              <span className="text-sm font-semibold truncate text-slate-200">{lightboxImage.name || 'เอกสารประกอบการลา'}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <a
                href={lightboxImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-colors"
                title="เปิดไฟล์ในแท็บใหม่"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="py-1.5 px-3.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-lg active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>ปิดรูปภาพ</span>
              </button>
            </div>
          </div>

          {/* Lightbox Body (Interactive Zoom & Pan Viewport) */}
          <div 
            className={`relative max-w-5xl max-h-[72vh] sm:max-h-[76vh] w-full flex-1 flex items-center justify-center p-2 rounded-2xl bg-black/60 border border-white/10 shadow-2xl overflow-hidden select-none ${zoomScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            onClick={e => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name || 'เอกสารแนบ'}
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
              className="max-w-full max-h-[70vh] sm:max-h-[74vh] object-contain rounded-lg shadow-2xl select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Floating Bottom Zoom & Rotate Toolbar */}
          <div 
            className="mt-2 flex items-center space-x-2 bg-slate-900/90 border border-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-2xl shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomScale <= 1}
              className="p-2 text-white hover:bg-white/20 disabled:opacity-30 rounded-xl transition-all active:scale-95"
              title="ย่อรูปภาพ (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-lg transition-all active:scale-95"
              title="รีเซ็ตเป็น 100%"
            >
              {Math.round(zoomScale * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomScale >= 4}
              className="p-2 text-white hover:bg-white/20 disabled:opacity-30 rounded-xl transition-all active:scale-95"
              title="ขยายรูปภาพ (Zoom In)"
            >
              <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="w-[1px] h-4 bg-white/20 mx-1"></div>

            <button
              type="button"
              onClick={handleRotate}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-all active:scale-95"
              title="หมุนรูปภาพ 90 องศา"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/20 rounded-xl transition-all active:scale-95"
              title="รีเซ็ตการหมุนและขนาดเดิม"
            >
              <RotateCcw className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
