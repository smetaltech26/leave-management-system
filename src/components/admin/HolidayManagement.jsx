import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Plus, Trash2, Edit2, X, Save, Search } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

export default function HolidayManagement({ holidays, setHolidays }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showConfirm } = useModal();

  const [formData, setFormData] = useState({
    id: '',
    date: '',
    title: ''
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  const handleOpenModal = (holiday = null) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData(holiday);
    } else {
      setEditingHoliday(null);
      setFormData({
        id: Date.now().toString(),
        date: '',
        title: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHoliday(null);
  };

  const handleSaveHoliday = (e) => {
    e.preventDefault();
    if (editingHoliday) {
      setHolidays(prev => prev.map(h => h.id === editingHoliday.id ? formData : h));
    } else {
      setHolidays(prev => [...prev, formData].sort((a, b) => new Date(a.date) - new Date(b.date)));
    }
    handleCloseModal();
  };

  const handleDeleteHoliday = async (id) => {
    if (await showConfirm('ต้องการลบวันหยุดนี้ใช่หรือไม่?')) {
      setHolidays(prev => prev.filter(h => h.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-rose-500" />
            ตั้งค่าวันหยุดบริษัท
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">เพิ่มหรือแก้ไขวันหยุดพิเศษที่จะแสดงในปฏิทิน</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-rose-500/30 transition-all transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          เพิ่มวันหยุดใหม่
        </button>
      </div>

      <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--card-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-[var(--text-muted)] border-b border-slate-200 dark:border-[var(--card-border)]">
              <th className="p-4 font-bold whitespace-nowrap">วันที่</th>
              <th className="p-4 font-bold">ชื่อวันหยุด / เทศกาล</th>
              <th className="p-4 font-bold text-center w-32 whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[var(--card-border)] text-sm">
            {holidays.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-[var(--text-muted)]">ไม่มีวันหยุดในระบบ</td>
              </tr>
            ) : (
              holidays.map(holiday => (
                <tr key={holiday.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 font-medium text-rose-500 whitespace-nowrap">{formatDate(holiday.date)}</td>
                  <td className="p-4 text-[var(--text-main)]">{holiday.title}</td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleOpenModal(holiday)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteHoliday(holiday.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
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
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-[var(--text-main)]">
                {editingHoliday ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุดใหม่'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">วันที่ <span className="text-rose-500">*</span></label>
                <input 
                  type="date" 
                  required
                  value={formData.date} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">ชื่อวันหยุด / เทศกาล <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none" 
                  placeholder="เช่น วันขึ้นปีใหม่, วันสงกรานต์"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 transition-colors">
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
