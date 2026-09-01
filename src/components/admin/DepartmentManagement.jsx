import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Plus, Edit2, Trash2, X, Save, Search, Layers } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

export default function DepartmentManagement({ departments = [], setDepartments }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { showConfirm } = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '',
    name: ''
  });

  const filteredData = departments.filter(d => 
    d.id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        id: dept.id,
        name: dept.name
      });
    } else {
      setEditingDept(null);
      setFormData({
        id: `DPM-${String(departments.length + 1).padStart(3, '0')}`,
        name: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingDept) {
      setDepartments(prev => prev.map(d => d.id === editingDept.id ? formData : d));
    } else {
      setDepartments(prev => [...prev, formData]);
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    if (await showConfirm('คุณต้องการลบฝ่ายนี้ออกจากระบบหรือไม่?')) {
      setDepartments(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-500" />
            จัดการฝ่าย (Departments)
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">เพิ่ม แก้ไข ลบ โครงสร้างฝ่ายภายในองค์กร</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาข้อมูล..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-300 dark:border dark:border-emerald-500/40 text-white px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            เพิ่มข้อมูล
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--card-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-[var(--text-muted)] border-b border-slate-200 dark:border-[var(--card-border)]">
              <th className="p-4 font-bold w-1/4 whitespace-nowrap">รหัส</th>
              <th className="p-4 font-bold w-1/2 text-center">ฝ่าย</th>
              <th className="p-4 font-bold text-center whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[var(--card-border)] text-sm">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-[var(--text-muted)]">ไม่พบข้อมูลฝ่าย</td>
              </tr>
            ) : (
              filteredData.map((dept, index) => (
                <tr key={dept.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">{dept.id}</td>
                  <td className="p-4 font-medium text-[var(--text-main)] text-center">{dept.name}</td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleOpenModal(dept)} className="p-2 text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(dept.id)} className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
        {/* Pagination mock */}
        <div className="p-4 border-t border-slate-100 dark:border-[var(--card-border)] flex flex-col items-center justify-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">แสดง 1 ถึง {filteredData.length} จาก {filteredData.length} แถว</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg opacity-50 cursor-not-allowed">«</button>
            <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg opacity-50 cursor-not-allowed">‹</button>
            <button className="px-3 py-1 bg-emerald-500 text-white rounded-lg font-bold shadow-sm">1</button>
            <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg opacity-50 cursor-not-allowed">›</button>
            <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg opacity-50 cursor-not-allowed">»</button>
          </div>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[var(--bg-main)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-[var(--card-border)]">
            <div className="p-5 border-b border-slate-100 dark:border-[var(--card-border)] flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-[var(--text-main)]">
                {editingDept ? 'แก้ไขฝ่าย' : 'เพิ่มฝ่ายใหม่'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">รหัสฝ่าย</label>
                <input 
                  type="text" 
                  value={formData.id} 
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-[var(--card-border)] rounded-xl text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">ชื่อฝ่าย <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" 
                  placeholder="เช่น ฝ่ายผลิต MA"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-300 dark:border dark:border-emerald-500/40 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
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
