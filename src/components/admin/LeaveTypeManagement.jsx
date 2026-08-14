import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Plus, Edit2, Trash2, X, Save, Search, Palette } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import * as api from '../../services/supabaseApi';

export default function LeaveTypeManagement({ leaveTypes, setLeaveTypes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { showConfirm, showAlert } = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    color: 'text-blue-500',
    bg: 'bg-blue-500'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    { label: 'Blue', color: 'text-blue-500', bg: 'bg-blue-500' },
    { label: 'Rose', color: 'text-rose-500', bg: 'bg-rose-500' },
    { label: 'Purple', color: 'text-purple-500', bg: 'bg-purple-500' },
    { label: 'Amber', color: 'text-amber-500', bg: 'bg-amber-500' },
    { label: 'Emerald', color: 'text-emerald-500', bg: 'bg-emerald-500' },
    { label: 'Pink', color: 'text-pink-500', bg: 'bg-pink-500' },
    { label: 'Orange', color: 'text-orange-500', bg: 'bg-orange-500' },
    { label: 'Sky', color: 'text-sky-500', bg: 'bg-sky-500' },
    { label: 'Teal', color: 'text-teal-500', bg: 'bg-teal-500' },
    { label: 'Slate', color: 'text-slate-500', bg: 'bg-slate-500' }
  ];

  const handleOpenModal = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData(type);
    } else {
      setEditingType(null);
      setFormData({
        id: '',
        name: '',
        color: 'text-blue-500',
        bg: 'bg-blue-500'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingType) {
        await api.updateLeaveType(editingType.id, {
          name: formData.name,
          color: formData.color,
          bg: formData.bg
        });
        setLeaveTypes(prev => prev.map(t => t.id === editingType.id ? { ...t, ...formData } : t));
      } else {
        const newType = await api.createLeaveType({
          name: formData.name,
          color: formData.color,
          bg: formData.bg
        });
        setLeaveTypes(prev => [...prev, newType]);
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      await showAlert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (await showConfirm('คุณต้องการลบประเภทการลานี้ใช่หรือไม่? (หากลบอาจกระทบกับคำขอลาที่มีอยู่)')) {
      try {
        await api.deleteLeaveType(id);
        setLeaveTypes(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        console.error(err);
        await showAlert("ไม่สามารถลบได้ เนื่องจากอาจมีข้อมูลที่เชื่อมโยงอยู่");
      }
    }
  };

  const filteredTypes = leaveTypes.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <Tag className="w-6 h-6 text-pink-500" />
            ตั้งค่าประเภทการลา
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">จัดการประเภทการลาทั้งหมดในระบบ และกำหนดสีป้ายกำกับ</p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative flex-1 md:w-64 group">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="ค้นหาประเภทการลา..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all shadow-sm shadow-blue-500/20 whitespace-nowrap font-medium"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">เพิ่มประเภทใหม่</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTypes.map(type => (
          <div key={type.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow group flex flex-col justify-between h-full">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${type.bg} bg-opacity-20`}>
                <Palette className={`w-5 h-5 ${type.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[var(--text-main)] truncate text-base">{type.name}</h3>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${type.bg} ${type.color} bg-opacity-10 border border-current/20`}>
                    Preview Badge
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button onClick={() => handleOpenModal(type)} className="flex-1 flex justify-center items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg transition-colors font-medium">
                <Edit2 className="w-4 h-4" />
                แก้ไข
              </button>
              <button onClick={() => handleDelete(type.id)} className="flex-1 flex justify-center items-center gap-1.5 px-3 py-1.5 text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors font-medium">
                <Trash2 className="w-4 h-4" />
                ลบ
              </button>
            </div>
          </div>
        ))}
        {filteredTypes.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <Tag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-medium">ไม่พบประเภทการลา</p>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl flex flex-col overflow-hidden max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
              <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-500" />
                {editingType ? 'แก้ไขประเภทการลา' : 'เพิ่มประเภทการลาใหม่'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <form id="leaveTypeForm" onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">ชื่อประเภทการลา <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น ลาพักร้อน"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-3">เลือกสีป้ายกำกับ (Badge)</label>
                  <div className="grid grid-cols-5 gap-3">
                    {colors.map(c => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c.color, bg: c.bg })}
                        className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${c.bg} bg-opacity-20 border-2 ${
                          formData.bg === c.bg ? `border-current ${c.color} scale-110 shadow-sm` : 'border-transparent hover:scale-105'
                        }`}
                        title={c.label}
                      >
                        <div className={`w-4 h-4 rounded-full ${c.bg}`}></div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] font-medium">ตัวอย่างป้ายกำกับ</span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold tracking-wide uppercase ${formData.bg} ${formData.color} bg-opacity-10 border border-current/20`}>
                    {formData.name || 'ตัวอย่าง'}
                  </span>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 rounded-xl text-[var(--text-main)] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                form="leaveTypeForm"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    บันทึกข้อมูล
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
