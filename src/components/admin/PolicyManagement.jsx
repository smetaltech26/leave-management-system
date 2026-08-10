import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, Plus, Trash2, Edit2, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PolicyManagement({ userPolicies, setUserPolicies, users, agencies = [], departments = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const sortedPolicies = [...userPolicies].sort((a, b) => {
    const numA = parseInt(a.user_id?.replace('USER-', '')) || 0;
    const numB = parseInt(b.user_id?.replace('USER-', '')) || 0;
    if (numA !== numB) return numA - numB;
    return (a.user_id || '').localeCompare(b.user_id || '');
  });

  const totalPages = Math.ceil(sortedPolicies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPolicies = sortedPolicies.slice(startIndex, startIndex + itemsPerPage);

  const [formData, setFormData] = useState({
    id: '',
    user_id: '',
    leave_type: 'ลาป่วย',
    max_days: 30,
    used_days: 0,
    remaining_days: 30,
    year: new Date().getFullYear() - 543
  });

  const handleOpenModal = (policy = null) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData(policy);
    } else {
      setEditingPolicy(null);
      setFormData({
        id: `POL-${Date.now()}`,
        user_id: users && users.length > 0 ? users[0].id : '',
        leave_type: 'ลาป่วย',
        max_days: 30,
        used_days: 0,
        remaining_days: 30,
        year: new Date().getFullYear() - 543
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPolicy(null);
  };

  const handleSavePolicy = (e) => {
    e.preventDefault();
    
    // คำนวณ remaining_days อัตโนมัติในกรณีแก้ไข
    const updatedForm = {
      ...formData,
      remaining_days: formData.max_days - formData.used_days
    };

    if (editingPolicy) {
      setUserPolicies(prev => prev.map(p => p.id === editingPolicy.id ? updatedForm : p));
    } else {
      setUserPolicies(prev => [...prev, updatedForm]);
    }
    handleCloseModal();
  };

  const handleDeletePolicy = (id) => {
    if (window.confirm('ต้องการลบสิทธิ์โควตาวันลานี้ใช่หรือไม่?')) {
      setUserPolicies(prev => prev.filter(p => p.id !== id));
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

      <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--card-border)] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-[var(--text-muted)] border-b border-slate-200 dark:border-[var(--card-border)]">
              <th className="p-4 font-bold whitespace-nowrap">รหัส</th>
              <th className="p-4 font-bold whitespace-nowrap">พนักงาน</th>
              <th className="p-4 font-bold whitespace-nowrap">หน่วยงาน / ฝ่าย</th>
              <th className="p-4 font-bold whitespace-nowrap">ประเภทการลา</th>
              <th className="p-4 font-bold text-center whitespace-nowrap">สิทธิ์รวม (วัน)</th>
              <th className="p-4 font-bold text-center whitespace-nowrap">ใช้ไป (วัน)</th>
              <th className="p-4 font-bold text-center whitespace-nowrap">คงเหลือ (วัน)</th>
              <th className="p-4 font-bold text-center w-32 whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[var(--card-border)] text-sm">
            {currentPolicies.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-[var(--text-muted)]">ไม่มีการตั้งค่าโควตาในระบบ</td>
              </tr>
            ) : (
              currentPolicies.map(policy => {
                const userObj = users?.find(u => u.id === policy.user_id);
                return (
                  <tr key={policy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-[var(--text-muted)] font-medium whitespace-nowrap">{policy.user_id}</td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img src={userObj?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userObj?.fullname || 'User')}&background=random`} alt="Avatar" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        <div>
                          <p className="font-bold text-[var(--text-main)]">{userObj ? userObj.fullname : 'Unknown User'}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{userObj?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[var(--text-muted)] whitespace-nowrap">
                      {agencies?.find(a => a.id === userObj?.agency_id)?.name || userObj?.agency_id || '-'} / {departments?.find(d => d.id === userObj?.department_id)?.name || userObj?.department_id || '-'}
                    </td>
                    <td className="p-4 font-medium text-[var(--text-main)] whitespace-nowrap">{policy.leave_type}</td>
                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-200">{policy.max_days}</td>
                    <td className="p-4 text-center font-bold text-rose-500">{policy.used_days}</td>
                    <td className="p-4 text-center font-bold text-emerald-500">{policy.remaining_days}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(policy)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeletePolicy(policy.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            {currentPolicies.length > 0 && currentPolicies.length < itemsPerPage && (
              Array.from({ length: itemsPerPage - currentPolicies.length }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="opacity-0 pointer-events-none border-b-0">
                  <td className="p-4"><div className="h-14"></div></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {sortedPolicies.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-[var(--card-border)] bg-slate-50/50 dark:bg-[var(--card-bg)] flex flex-col items-center justify-center gap-4">
            <span className="text-sm text-[var(--text-muted)]">
              แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, sortedPolicies.length)} จากทั้งหมด {sortedPolicies.length} รายการ
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 dark:border-[var(--card-border)] rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors text-[var(--text-main)]"
              >
                ย้อนกลับ
              </button>
              <span className="text-sm font-bold px-3 text-[var(--text-main)]">หน้า {currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 dark:border-[var(--card-border)] rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors text-[var(--text-main)]"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-[var(--text-main)]">
                {editingPolicy ? 'แก้ไขโควตาวันลา' : 'เพิ่มโควตาใหม่'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="p-6 space-y-4">
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
                  onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="ลาป่วย">ลาป่วย</option>
                  <option value="ลากิจได้รับค่าจ้าง">ลากิจได้รับค่าจ้าง</option>
                  <option value="ลากิจไม่ได้รับค่าจ้าง">ลากิจไม่ได้รับค่าจ้าง</option>
                  <option value="ลาพักร้อน">ลาพักร้อน</option>
                  <option value="ลาคลอด">ลาคลอด</option>
                  <option value="ลาบวช">ลาบวช</option>
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

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 transition-colors">
                  <Save className="w-4 h-4" />
                  บันทึกข้อมูล
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
