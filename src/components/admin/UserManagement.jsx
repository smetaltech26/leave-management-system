import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, User, MapPin, X, Save, Users, UserCheck, Hourglass, Eye, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import { useModal } from '../../contexts/ModalContext';

export default function UserManagement({ users, setUsers, pendingCount = 0, userPolicies = [], requests = [], agencies = [], departments = [], leaveTypes = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  const { showConfirm } = useModal();

  const desktopPaginationRef = useRef(null);
  const mobilePaginationRef = useRef(null);
  const activePaginationRef = useRef(null);
  const clickYRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  // ฟอร์มสำหรับพนักงานใหม่/แก้ไข
  const [formData, setFormData] = useState({
    id: '',
    fullname: '',
    email: '',
    password: '',
    agency: '',
    department: '',
    role: 'Employee',
    line_user_id: '',
    avatar_url: '',
  });

  const sortedUsers = [...users].sort((a, b) => {
    if (!a.id) return 1;
    if (!b.id) return -1;
    const numA = parseInt(a.id.replace('USER-', '')) || 0;
    const numB = parseInt(b.id.replace('USER-', '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.id.localeCompare(b.id);
  });

  const filteredUsers = sortedUsers.filter(u => 
    u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage, type) => {
    const ref = type === 'mobile' ? mobilePaginationRef : desktopPaginationRef;
    if (ref.current) {
      clickYRef.current = ref.current.getBoundingClientRect().top;
      activePaginationRef.current = ref;
    }
    setCurrentPage(newPage);
  };

  useLayoutEffect(() => {
    if (clickYRef.current !== null && activePaginationRef.current?.current) {
      const newTop = activePaginationRef.current.current.getBoundingClientRect().top;
      const diff = newTop - clickYRef.current;
      window.scrollBy(0, diff);
      clickYRef.current = null;
    }
  }, [currentPage, currentUsers]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        password: user.password_hash || '',
        agency: user.agency_id || '',
        department: user.department_id || '',
        role: user.role,
        line_user_id: user.line_user_id || '',
        avatar_url: user.avatar_url || '',
        employee_id: user.employee_id || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        id: `USER-${String(users.length + 1).padStart(3, '0')}`,
        fullname: '',
        email: '',
        password: '',
        agency: '',
        department: '',
        role: 'Employee',
        line_user_id: '',
        avatar_url: '',
        employee_id: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (editingUser) {
      // อัปเดตพนักงานเดิม
      const updatedUser = {
        ...editingUser,
        ...formData,
        password_hash: formData.password,
        agency_id: formData.agency,
        department_id: formData.department,
        employee_id: formData.employee_id
      };
      setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
    } else {
      // เพิ่มพนักงานใหม่
      const newUser = {
        ...formData,
        password_hash: formData.password,
        agency_id: formData.agency,
        department_id: formData.department,
        employee_id: formData.employee_id,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullname)}&background=random`,
      };
      setUsers(prev => [...prev, newUser]);
    }
    handleCloseModal();
  };

  const handleDeleteUser = async (id) => {
    if(await showConfirm('คุณต้องการลบพนักงานรหัสนี้ใช่หรือไม่?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const totalUsers = users.length;
  const normalUsers = users.filter(u => u.role === 'Employee' || u.role === 'User').length;
  const highLevelUsers = totalUsers - normalUsers;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-100">ผู้ใช้งาน</div>
            <div className="text-3xl font-bold mt-1">{totalUsers}</div>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="bg-emerald-500 rounded-2xl p-4 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-emerald-100">ผู้ใช้งาน(ทั่วไป)</div>
            <div className="text-3xl font-bold mt-1">{normalUsers}</div>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="bg-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/20 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-amber-100">ผู้ใช้งาน(ระดับสูง)</div>
            <div className="text-3xl font-bold mt-1">{highLevelUsers}</div>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="bg-rose-500 rounded-2xl p-4 text-white shadow-lg shadow-rose-500/20 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-rose-100">รออนุมัติ</div>
            <div className="text-3xl font-bold mt-1">{pendingCount}</div>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <Hourglass className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            ข้อมูลพนักงาน
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">เพิ่ม แก้ไข และกำหนดสิทธิ์พนักงานทั้งหมด</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          เพิ่มพนักงานใหม่
        </button>
      </div>

      {/* ค้นหา */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="ค้นหาชื่อ, รหัส, อีเมล..."
          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-[var(--card-border)] rounded-xl bg-white dark:bg-[var(--card-bg)] text-sm text-[var(--text-main)] focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ตารางข้อมูล (Desktop) */}
      <div className="hidden md:block bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--card-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-[var(--text-muted)] border-b border-slate-200 dark:border-[var(--card-border)]">
                <th className="p-4 font-bold">รหัส</th>
                <th className="p-4 font-bold">พนักงาน</th>
                <th className="p-4 font-bold">สิทธิ์ (Role)</th>
                <th className="p-4 font-bold">หน่วยงาน / ฝ่าย</th>
                <th className="p-4 font-bold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[var(--card-border)] text-sm">
              {currentUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 text-[var(--text-muted)] font-medium">{user.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=random`} alt="Avatar" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      <div>
                        <div className="font-bold text-[var(--text-main)] text-sm">{user.fullname}</div>
                        <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-1">
                          <span>{user.id}</span>
                          {user.employee_id && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                              <span>ID: {user.employee_id}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border inline-block ${
                      user.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300' :
                      user.role === 'Admin' ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300' :
                      user.role === 'SuperUser' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' :
                      user.role === 'Manager' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' :
                      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--text-muted)]">
                    {agencies?.find(a => a.id === user.agency_id)?.name || user.agency_id || '-'} / {departments?.find(d => d.id === user.department_id)?.name || user.department_id || '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => setViewingUser(user)} className="p-2 text-blue-600 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/40 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenModal(user)} className="p-2 text-amber-600 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/40 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-rose-600 bg-rose-100 dark:bg-rose-500/20 hover:bg-rose-200 dark:hover:bg-rose-500/40 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentUsers.length > 0 && currentUsers.length < itemsPerPage && (
                Array.from({ length: itemsPerPage - currentUsers.length }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="opacity-0 pointer-events-none border-b-0">
                    <td className="p-4"><div className="h-14"></div></td>
                    <td className="p-4"></td>
                    <td className="p-4"></td>
                    <td className="p-4"></td>
                    <td className="p-4"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {currentUsers.length === 0 && (
            <div className="p-8 text-center text-[var(--text-muted)]">ไม่พบข้อมูลพนักงาน</div>
          )}
        </div>
        
        {filteredUsers.length > 0 && (
          <div ref={desktopPaginationRef} className="hidden md:flex p-4 border-t border-slate-200 dark:border-[var(--card-border)] bg-slate-50/50 dark:bg-[var(--card-bg)] flex-col items-center justify-center gap-4">
            <span className="text-sm text-[var(--text-muted)] text-center">
              แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, filteredUsers.length)} จากทั้งหมด {filteredUsers.length} รายการ
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1), 'desktop')}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 dark:border-[var(--card-border)] rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors text-[var(--text-main)]"
              >
                ย้อนกลับ
              </button>
              <span className="text-sm font-bold px-3 text-[var(--text-main)]">หน้า {currentPage} / {totalPages}</span>
              <button 
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1), 'desktop')}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 dark:border-[var(--card-border)] rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors text-[var(--text-main)]"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card List (Mobile) */}
      <div 
        className="md:hidden space-y-4"
        style={{ overflowAnchor: 'none' }}
      >
        {currentUsers.map(user => (
          <div key={user.id} className="bg-white dark:bg-[var(--card-bg)] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--card-border)]">
            <div className="flex items-center gap-3 mb-4">
              <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=random`} alt="Avatar" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--text-main)] truncate">{user.fullname}</p>
                <p className="text-xs text-[var(--text-muted)] font-medium mb-1">{user.id}</p>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border inline-block ${
                      user.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300' :
                      user.role === 'Admin' ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300' :
                      user.role === 'SuperUser' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' :
                      user.role === 'Manager' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' :
                      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {user.role}
                </span>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[var(--text-muted)]">
                <span>อีเมล:</span>
                <span className="font-medium text-[var(--text-main)] truncate max-w-[60%]">{user.email || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-[var(--text-muted)]">
                <span>หน่วยงาน/ฝ่าย:</span>
                <span className="font-medium text-[var(--text-main)] text-right truncate max-w-[60%]">
                  {agencies?.find(a => a.id === user.agency_id)?.name || user.agency_id || '-'} / {departments?.find(d => d.id === user.department_id)?.name || user.department_id || '-'}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setViewingUser(user)} className="flex-1 flex items-center justify-center gap-1.5 p-2.5 text-blue-600 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/40 rounded-xl transition-colors font-semibold text-xs">
                <Eye className="w-4 h-4" /> ดู
              </button>
              <button onClick={() => handleOpenModal(user)} className="flex-1 flex items-center justify-center gap-1.5 p-2.5 text-amber-600 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/40 rounded-xl transition-colors font-semibold text-xs">
                <Edit2 className="w-4 h-4" /> แก้ไข
              </button>
              <button onClick={() => handleDeleteUser(user.id)} className="flex-1 flex items-center justify-center gap-1.5 p-2.5 text-rose-600 bg-rose-100 dark:bg-rose-500/20 hover:bg-rose-200 dark:hover:bg-rose-500/40 rounded-xl transition-colors font-semibold text-xs">
                <Trash2 className="w-4 h-4" /> ลบ
              </button>
            </div>
          </div>
        ))}

        {currentUsers.length === 0 && (
          <div className="p-8 text-center text-[var(--text-muted)] bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--card-border)]">ไม่พบข้อมูลพนักงาน</div>
        )}
        
        {/* Pagination (Mobile) */}
        {filteredUsers.length > 0 && (
          <div ref={mobilePaginationRef} className="pt-4 pb-2 flex flex-col items-center justify-center gap-3">
             <span className="text-xs text-[var(--text-muted)]">
              แสดง {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} จาก {filteredUsers.length}
            </span>
            <div className="flex items-center justify-between w-full">
              <button 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1), 'mobile')}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 dark:border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] rounded-xl text-sm font-medium disabled:opacity-50 text-[var(--text-main)] shadow-sm"
              >
                ย้อนกลับ
              </button>
              <span className="text-sm font-bold text-[var(--text-main)]">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1), 'mobile')}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 dark:border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] rounded-xl text-sm font-medium disabled:opacity-50 text-[var(--text-main)] shadow-sm"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal เพิ่ม/แก้ไขพนักงาน */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-lg text-[var(--text-main)]">
                {editingUser ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 flex-1 min-h-0 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">UID (รหัสระบบ)</label>
                  <input 
                    type="text" 
                    value={formData.id} 
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">ID (รหัสพนักงาน)</label>
                  <input 
                    type="text" 
                    value={formData.employee_id} 
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    placeholder="เช่น 150, 272"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">ระดับสิทธิ์ (Role) <span className="text-rose-500">*</span></label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Employee">Employee (พนักงาน)</option>
                    <option value="SuperUser">SuperUser (หัวหน้า/รอง)</option>
                    <option value="Manager">Manager (ผู้จัดการ)</option>
                    <option value="Admin">Admin (บุคคล)</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">ชื่อ-นามสกุล <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.fullname} 
                  onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                  placeholder="เช่น สมชาย ใจดี"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">รูปโปรไฟล์ (Avatar) <span className="text-[var(--text-muted)] font-normal ml-1">(ทางเลือก)</span></label>
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer group flex flex-col items-center justify-center w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                      <div className="flex items-center gap-2 text-slate-500 group-hover:text-blue-500 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-medium">เลือกรูปภาพจากเครื่อง</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">อีเมล / Username <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                    placeholder="email@smetaltech.co.th"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">รหัสผ่าน (Password) <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                    placeholder="รหัสผ่านสำหรับเข้าสู่ระบบ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">ฝ่าย (Agency)</label>
                  <input 
                    type="text" 
                    value={formData.agency} 
                    onChange={(e) => setFormData({...formData, agency: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                    placeholder="เช่น AGC-014"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">แผนก (Department)</label>
                  <input 
                    type="text" 
                    value={formData.department} 
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                    placeholder="เช่น DPM-002"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase">LINE User ID (แจ้งเตือน 1:1)</label>
                <input 
                  type="text" 
                  value={formData.line_user_id} 
                  onChange={(e) => setFormData({...formData, line_user_id: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 font-mono border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                  placeholder="เช่น U1a2b3c4d5e6f..."
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">ใช้สำหรับส่งข้อความแจ้งเตือนสถานะการลาตรงเข้า LINE ส่วนตัว</p>
              </div>

              <div className="pt-4 flex gap-3 shrink-0">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-colors">
                  <Save className="w-4 h-4" />
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingUser && (
        <UserProfileModal 
          user={viewingUser} 
          userPolicies={userPolicies} 
          requests={requests} 
          agencies={agencies}
          departments={departments}
          leaveTypes={leaveTypes}
          onClose={() => setViewingUser(null)} 
        />
      )}
    </div>
  );
}
