import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, Plus, Trash2, Edit2, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import * as api from '../../services/supabaseApi';

export default function PolicyManagement({ userPolicies, setUserPolicies, users, agencies = [], departments = [], leaveTypes = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showConfirm, showAlert } = useModal();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  const paginationRef = useRef(null);
  const clickYRef = useRef(null);

  const groupedPolicies = userPolicies.reduce((acc, policy) => {
    if (!acc[policy.user_id]) {
      acc[policy.user_id] = { user_id: policy.user_id, policies: [] };
    }
    acc[policy.user_id].policies.push(policy);
    return acc;
  }, {});

  const sortedGroupedPolicies = Object.values(groupedPolicies).sort((a, b) => {
    const numA = parseInt(a.user_id?.replace('USER-', '')) || 0;
    const numB = parseInt(b.user_id?.replace('USER-', '')) || 0;
    if (numA !== numB) return numA - numB;
    return (a.user_id || '').localeCompare(b.user_id || '');
  });

  const totalPages = Math.ceil(sortedGroupedPolicies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentGroupedPolicies = sortedGroupedPolicies.slice(startIndex, startIndex + itemsPerPage);
  
  const handlePageChange = (newPage) => {
    if (paginationRef.current) {
      clickYRef.current = paginationRef.current.getBoundingClientRect().top;
    }
    setCurrentPage(newPage);
  };

  useLayoutEffect(() => {
    if (clickYRef.current !== null && paginationRef.current) {
      const newTop = paginationRef.current.getBoundingClientRect().top;
      const diff = newTop - clickYRef.current;
      window.scrollBy(0, diff);
      clickYRef.current = null;
    }
  }, [currentPage, currentGroupedPolicies]);

  const [formData, setFormData] = useState({
    id: '',
    user_id: '',
    leave_type: 'ลาป่วย',
    max_days: 30,
    used_days: 0,
    remaining_days: 30,
    year: new Date().getFullYear()
  });

  const handleOpenModal = (policy = null) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        ...policy,
        year: policy.year || new Date().getFullYear()
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        id: '',
        user_id: users && users.length > 0 ? users[0].id : '',
        leave_type: leaveTypes && leaveTypes.length > 0 ? leaveTypes[0].name : 'ลาพักร้อน',
        max_days: (leaveTypes && leaveTypes.length > 0 ? leaveTypes[0].name : 'ลาพักร้อน') === 'ลาคลอด' ? 120 : 30,
        used_days: 0,
        remaining_days: 30,
        year: new Date().getFullYear()
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPolicy(null);
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!formData.user_id || !formData.leave_type) {
      await showAlert("กรุณาระบุข้อมูลพนักงานและประเภทการลาให้ครบถ้วนค่ะ");
      return;
    }

    setIsSubmitting(true);
    try {
      const currentYear = new Date().getFullYear();
      const payload = {
        user_id: formData.user_id,
        leave_type: formData.leave_type,
        max_days: Number(formData.max_days) || 0,
        used_days: Number(formData.used_days) || 0,
        year: Number(formData.year) || currentYear
      };

      if (editingPolicy) {
        const updated = await api.updateUserPolicy(editingPolicy.id, payload);
        setUserPolicies(prev => prev.map(p => p.id === editingPolicy.id ? { 
          ...p, 
          ...updated, 
          remaining_days: (Number(updated.max_days) || 0) - (Number(updated.used_days) || 0) 
        } : p));
      } else {
        const created = await api.createUserPolicy(payload);
        setUserPolicies(prev => [...prev, { 
          ...created, 
          remaining_days: (Number(created.max_days) || 0) - (Number(created.used_days) || 0) 
        }]);
      }
      handleCloseModal();
    } catch (err) {
      console.error("Save Policy Error:", err);
      await showAlert("เกิดข้อผิดพลาดในการบันทึกโควตาวันลา: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePolicy = async (id) => {
    if (await showConfirm('ต้องการลบสิทธิ์โควตาวันลานี้ใช่หรือไม่?')) {
      try {
        await api.deleteUserPolicy(id);
        setUserPolicies(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error("Delete Policy Error:", err);
        await showAlert("เกิดข้อผิดพลาดในการลบโควตาวันลา: " + (err.message || err));
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-500" />
            ตั้งค่าสิทธิการลา (โควต้า)
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">กำหนดจำนวนวันลาสูงสุดต่อปีของพนักงานแต่ละคน</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-purple-500/30 transition-all transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          เพิ่มสิทธิ์ใหม่
        </button>
      </div>

      {/* Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" style={{ overflowAnchor: 'none' }}>
        {currentGroupedPolicies.map(group => {
          const userObj = users?.find(u => u.id === group.user_id);
          return (
            <div key={group.user_id} className="bg-white dark:bg-[var(--card-bg)] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--card-border)]">
              <div className="flex items-center gap-3 mb-4">
                <img src={userObj?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userObj?.fullname || 'User')}&background=random`} alt="Avatar" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--text-main)] truncate">{userObj ? userObj.fullname : 'Unknown User'}</p>
                  <p className="text-xs text-[var(--text-muted)] font-medium mb-1">
                    {group.user_id}
                    {userObj?.employee_id && <span> รหัสพนักงาน {userObj.employee_id}</span>}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    {agencies?.find(a => a.id === userObj?.agency_id)?.name || userObj?.agency_id || '-'} / {departments?.find(d => d.id === userObj?.department_id)?.name || userObj?.department_id || '-'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 mb-2">
                {group.policies.map(policy => (
                  <div key={policy.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[var(--text-main)]">{policy.leave_type}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        <span className="text-emerald-500 font-medium">เหลือ {policy.remaining_days}</span> / <span className="text-rose-500 font-medium">ใช้ {policy.used_days}</span> / รวม {policy.max_days}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenModal(policy)} className="p-2 text-blue-600 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/40 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeletePolicy(policy.id)} className="p-2 text-rose-600 bg-rose-100 dark:bg-rose-500/20 hover:bg-rose-200 dark:hover:bg-rose-500/40 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {currentGroupedPolicies.length > 0 && currentGroupedPolicies.length < itemsPerPage && (
          Array.from({ length: itemsPerPage - currentGroupedPolicies.length }).map((_, idx) => (
            <div key={`empty-${idx}`} className="hidden md:block opacity-0 pointer-events-none min-h-[400px]"></div>
          ))
        )}
        {currentGroupedPolicies.length === 0 && (
          <div className="p-8 text-center text-[var(--text-muted)] bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--card-border)]">ไม่มีการตั้งค่าโควตาในระบบ</div>
        )}
        
      </div>
      
      {/* Pagination */}
      {sortedGroupedPolicies.length > 0 && (
        <div ref={paginationRef} className="pt-4 pb-2 flex flex-col items-center justify-center gap-4 border-t border-slate-200 dark:border-slate-800 mt-6">
          <span className="text-sm text-[var(--text-muted)] text-center">
            แสดง {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedGroupedPolicies.length)} จาก {sortedGroupedPolicies.length} (พนักงาน)
          </span>
          <div className="flex items-center gap-2 justify-center">
            <button 
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-5 py-2.5 border border-slate-200 dark:border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] rounded-xl text-sm font-medium disabled:opacity-50 text-[var(--text-main)] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              ย้อนกลับ
            </button>
            <span className="text-sm font-bold text-[var(--text-main)]">{currentPage} / {totalPages}</span>
            <button 
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-5 py-2.5 border border-slate-200 dark:border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] rounded-xl text-sm font-medium disabled:opacity-50 text-[var(--text-main)] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0 flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-lg text-[var(--text-main)]">
                {editingPolicy ? 'แก้ไขโควตาวันลา' : 'เพิ่มโควตาใหม่'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="p-6 flex-1 min-h-0 overflow-y-auto space-y-4 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">พนักงาน (รายบุคคล) <span className="text-rose-500">*</span></label>
                <select 
                  required
                  value={formData.user_id} 
                  onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="" disabled>-- เลือกพนักงาน --</option>
                  {users?.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.id} - {u.fullname}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">ประเภทการลา <span className="text-rose-500">*</span></label>
                <select 
                  required
                  value={formData.leave_type} 
                  onChange={(e) => {
                    const newType = e.target.value;
                    const newMaxDays = newType === 'ลาคลอด' ? 120 : 30;
                    setFormData({...formData, leave_type: newType, max_days: newMaxDays});
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {leaveTypes.length > 0 ? (
                    leaveTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="ลาป่วย">ลาป่วย</option>
                      <option value="ลากิจได้รับค่าจ้าง">ลากิจได้รับค่าจ้าง</option>
                      <option value="ลากิจไม่ได้รับค่าจ้าง">ลากิจไม่ได้รับค่าจ้าง</option>
                      <option value="ลาพักร้อน">ลาพักร้อน</option>
                      <option value="ลาคลอด">ลาคลอด</option>
                      <option value="ลาบวช">ลาบวช</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">สิทธิ์ทั้งหมด (วัน) <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    max="365"
                    value={formData.max_days} 
                    onChange={(e) => setFormData({...formData, max_days: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">ใช้ไปแล้ว (วัน)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="365"
                    value={formData.used_days} 
                    onChange={(e) => setFormData({...formData, used_days: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 shrink-0">
                <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
