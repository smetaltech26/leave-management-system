import React from 'react';
import UserManagement from './admin/UserManagement';
import { MessageSquare } from 'lucide-react';

export default function UsersPage({ users, setUsers, pendingCount, userPolicies, requests, agencies, departments }) {
  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="glass-card-clean rounded-2xl p-4 border border-blue-500/30 bg-blue-500/5 text-xs text-[var(--text-muted)] flex items-start space-x-3">
        <MessageSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-400">ระบบจัดการผู้ใช้งาน:</span>
          <p className="mt-0.5 text-[var(--text-muted)]">
            สามารถเพิ่ม, แก้ไข, ลบข้อมูลพนักงาน หรือกำหนดสิทธิ์การใช้งาน (Role) ได้จากหน้านี้
          </p>
        </div>
      </div>

      <UserManagement users={users} setUsers={setUsers} pendingCount={pendingCount} userPolicies={userPolicies} requests={requests} agencies={agencies} departments={departments} />
    </div>
  );
}
