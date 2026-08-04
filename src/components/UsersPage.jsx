import React, { useState } from 'react';
import { Users, UserPlus, Shield, MessageSquare, Edit, CheckCircle2, QrCode } from 'lucide-react';

export default function UsersPage({ users, onUpdateUser, agencies, departments }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [lineUserIdInput, setLineUserIdInput] = useState('');

  const handleSaveLineId = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    onUpdateUser({
      ...selectedUser,
      line_user_id: lineUserIdInput
    });

    setSelectedUser(null);
    setLineUserIdInput('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center space-x-2">
            <span>จัดการพนักงาน & การผูก LINE 1:1</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">รายชื่อพนักงาน ผู้อนุมัติ และการบันทึก LINE User ID สำหรับ Direct Push Notification</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="glass-card-clean rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/5 text-xs text-[var(--text-muted)] flex items-start space-x-3">
        <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-emerald-400">ระบบแจ้งเตือนแบบ 1:1 Direct Push Notification:</span>
          <p className="mt-0.5 text-[var(--text-muted)]">
            พนักงาน/ผู้อนุมัติสามารถผูก <code className="text-emerald-300 font-mono">LINE User ID</code> (เริ่มต้นด้วย <code className="text-emerald-300 font-mono">U...</code>) เพื่อรับข้อความแจ้งเตือนคำขอและการอนุมัติส่งตรงเข้าไลน์ส่วนตัวโดยตรงโดยไม่ต้องดึงเข้ากลุ่มค่ะ
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card-clean rounded-3xl p-4 md:p-6 border border-[var(--card-border)] shadow-2xl overflow-x-auto">
        <table className="w-full text-left text-xs text-[var(--text-muted)]">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-[var(--text-muted)] font-semibold">
              <th className="pb-3 px-3">รหัสพนักงาน</th>
              <th className="pb-3 px-3">ชื่อ-นามสกุล</th>
              <th className="pb-3 px-3">ฝ่าย/แผนก</th>
              <th className="pb-3 px-3">สิทธิ์ (Role)</th>
              <th className="pb-3 px-3">ผู้อนุมัติ Step 1</th>
              <th className="pb-3 px-3">สถานะ LINE 1:1</th>
              <th className="pb-3 px-3 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((u) => {
              const app1 = users.find(x => x.id === u.approver_step1_id);

              return (
                <tr key={u.id} className="hover:bg-[var(--card-bg)]/40 transition-all">
                  <td className="py-3.5 px-3 font-mono font-semibold text-emerald-400">{u.id}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2.5">
                      <img src={u.avatar_url} alt={u.fullname} className="w-8 h-8 rounded-xl object-cover" />
                      <div>
                        <div className="font-semibold text-[var(--text-main)]">{u.fullname}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-[var(--text-muted)]">{u.agency_id || 'SMT'} / {u.department_id || 'ทั่วไป'}</td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                      u.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                      u.role === 'Manager' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)]'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-[var(--text-muted)]">{app1 ? app1.fullname : '-'}</td>
                  <td className="py-3.5 px-3">
                    {u.line_user_id ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ผูก LINE 1:1 แล้ว</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold text-[10px]">
                        ยังไม่ผูก LINE
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setLineUserIdInput(u.line_user_id || '');
                      }}
                      className="py-1.5 px-3 bg-[var(--card-bg)] hover:bg-slate-700 text-emerald-400 rounded-xl border border-[var(--card-border)] text-xs font-semibold flex items-center space-x-1 ml-auto transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>ผูก LINE</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Edit LINE User ID */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] shadow-2xl space-y-5">
            
            <div className="flex justify-between items-center pb-3 border-b border-[var(--card-border)]">
              <h3 className="text-sm font-bold text-[var(--text-main)]">บันทึก LINE User ID ({selectedUser.fullname})</h3>
              <button onClick={() => setSelectedUser(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">✕</button>
            </div>

            <form onSubmit={handleSaveLineId} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  LINE User ID (ขึ้นต้นด้วย U ตามด้วยตัวเลข/อักษร 32 ตัว)
                </label>
                <input
                  type="text"
                  placeholder="เช่น U1234567890abcdef1234567890abcdef"
                  value={lineUserIdInput}
                  onChange={(e) => setLineUserIdInput(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] font-mono focus:outline-none"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  * ผู้ใช้สามารถดู LINE User ID ได้จากการทักข้อความหา LINE Official Account ของระบบค่ะ
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--card-bg)]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-emerald-500 hover:bg-emerald-400 text-[var(--text-main)] text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/25"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
