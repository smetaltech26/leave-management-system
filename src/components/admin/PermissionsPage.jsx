import React, { useState } from 'react';
import { ShieldCheck, Info, Save, Loader2 } from 'lucide-react';
import * as api from '../../services/supabaseApi';
import { useModal } from '../../contexts/ModalContext';

export default function PermissionsPage({ permissions, setPermissions }) {
  const roles = ["SuperAdmin", "Admin", "SuperUser", "User"];
  const [isSaving, setIsSaving] = useState(false);
  const { showAlert } = useModal();

  const handleToggle = (menuItemCode, role) => {
    setPermissions(prev => prev.map(perm => {
      if (perm.MenuItems === menuItemCode) {
        return {
          ...perm,
          [role]: !perm[role]
        };
      }
      return perm;
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.updateRolePermissions(permissions);
      await showAlert('บันทึกสิทธิ์การใช้งานเรียบร้อยแล้ว', { type: 'success', title: 'สำเร็จ' });
    } catch (err) {
      console.error("Error saving permissions:", err);
      await showAlert('เกิดข้อผิดพลาดในการบันทึกสิทธิ์: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-extrabold text-[var(--text-main)] flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-500" />
          สิทธิการใช้งาน (Permission Matrix)
        </h2>
        <p className="text-[var(--text-muted)] text-sm">
          ตั้งค่าสิทธิ์การเข้าถึงเมนูต่างๆ ในระบบสำหรับแต่ละระดับพนักงาน
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-500/25 active:scale-95"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าสิทธิ์'}
        </button>
      </div>

      <div className="bg-[var(--card-bg)] rounded-3xl border border-slate-200 dark:border-[var(--card-border)] shadow-sm overflow-hidden">
        {/* Table Wrapper */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-[var(--card-border)]">
                <th className="p-4 md:p-5 font-bold text-sm text-[var(--text-muted)] w-[30%]">
                  เมนู / หน้า
                </th>
                {roles.map(role => (
                  <th key={role} className="p-4 md:p-5 font-bold text-sm text-[var(--text-muted)] text-center">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border inline-block ${
                      role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300' :
                      role === 'Admin' ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300' :
                      role === 'SuperUser' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' :
                      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {role}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[var(--card-border)]">
              {permissions.map((perm, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 md:p-5">
                    <div className="flex items-center gap-8 md:gap-12 pl-2 md:pl-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{index + 1}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[16px]">🖥️</span>
                        <span className="font-medium text-sm text-[var(--text-main)]">
                          {perm['เมนู']}
                        </span>
                      </div>
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={role} className="p-4 md:p-5 text-center align-middle">
                      {/* Modern Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(perm.MenuItems, role)}
                        aria-label={`Toggle ${role} access to ${perm['เมนู']}`}
                        className="relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                        style={{
                          width: '44px',
                          height: '24px',
                          backgroundColor: perm[role] ? '#3b82f6' : '#cbd5e1',
                          flexShrink: 0
                        }}
                      >
                        <span
                          className="inline-block rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out"
                          style={{
                            width: '20px',
                            height: '20px',
                            transform: perm[role] ? 'translateX(22px)' : 'translateX(2px)'
                          }}
                        />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Info Footer */}
        <div className="p-4 md:p-5 border-t border-slate-200 dark:border-[var(--card-border)] bg-slate-50 dark:bg-slate-800/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            <strong>หมายเหตุ:</strong> การปรับเปลี่ยนสิทธิ์นี้จะส่งผลกับการแสดงผลเมนูด้านซ้ายทันที 
            หากปิดสิทธิ์เมนูที่ใช้งานอยู่ พนักงานในระดับนั้นจะไม่สามารถมองเห็นและเข้าใช้งานหน้านั้นได้
            (อย่าลืมกดปุ่ม "บันทึกการตั้งค่าสิทธิ์" ด้านบนเพื่อบันทึกลงฐานข้อมูล)
          </p>
        </div>
      </div>
    </div>
  );
}
