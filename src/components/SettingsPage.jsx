import React, { useState } from 'react';
import { Settings, Shield, Calendar, Award, Database, RefreshCw, Key } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import PolicyManagement from './admin/PolicyManagement';
import HolidayManagement from './admin/HolidayManagement';
import AgencyManagement from './admin/AgencyManagement';
import DepartmentManagement from './admin/DepartmentManagement';

export default function SettingsPage({ userPolicies, setUserPolicies, holidays, setHolidays, users, agencies, setAgencies, departments, setDepartments }) {
  const [activeSubTab, setActiveSubTab] = useState('policies'); // policies | holidays | database
  const isConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center space-x-2">
            <span>ตั้งค่าระบบ & โควตาวันลา</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">กำหนดสิทธิ์วันลาคงเหลือ, วันหยุดประจำปี และการเชื่อมต่อ Supabase Database</p>
        </div>

        {/* Sub Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-[var(--card-bg)]/80 rounded-2xl border border-[var(--card-border)] self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('policies')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubTab === 'policies' ? 'bg-blue-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            โควตาวันลา
          </button>
          <button
            onClick={() => setActiveSubTab('holidays')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubTab === 'holidays' ? 'bg-blue-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            วันหยุดประจำปี
          </button>
          <button
            onClick={() => setActiveSubTab('agencies')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubTab === 'agencies' ? 'bg-blue-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            หน่วยงาน
          </button>
          <button
            onClick={() => setActiveSubTab('departments')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubTab === 'departments' ? 'bg-blue-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            ฝ่าย/แผนก
          </button>
          <button
            onClick={() => setActiveSubTab('database')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubTab === 'database' ? 'bg-blue-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            ฐานข้อมูล
          </button>
        </div>
      </div>

      {activeSubTab === 'policies' && (
        <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] shadow-sm">
          <PolicyManagement userPolicies={userPolicies} setUserPolicies={setUserPolicies} users={users} agencies={agencies} departments={departments} />
        </div>
      )}

      {activeSubTab === 'holidays' && (
        <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] shadow-sm">
          <HolidayManagement holidays={holidays} setHolidays={setHolidays} />
        </div>
      )}

      {activeSubTab === 'agencies' && (
        <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] shadow-sm">
          <AgencyManagement agencies={agencies} setAgencies={setAgencies} />
        </div>
      )}

      {activeSubTab === 'departments' && (
        <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] shadow-sm">
          <DepartmentManagement departments={departments} setDepartments={setDepartments} />
        </div>
      )}

      {activeSubTab === 'database' && (
        <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] space-y-6">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">สถานะการเชื่อมต่อ Supabase Database</h3>
              <p className="text-xs text-[var(--text-muted)]">โครงการ: leave-management-system (smetaltech26@gmail.com)</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--card-bg)]/80 border border-[var(--card-border)] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">สถานะคอนฟิกปัจจุบัน:</span>
              {isConfigured ? (
                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full font-semibold">
                  ✅ เชื่อมต่อ Supabase Live Project เรียบร้อย
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full font-semibold">
                  ⚠️ ใช้งานในโหมด Local High-Performance Mock Engine (พร้อมรัน SQL บน Supabase)
                </span>
              )}
            </div>

            <p className="text-[var(--text-muted)] leading-relaxed">
              ไฟล์ DDL Schema สำหรับสร้างตาราง PostgreSQL ทั้งหมดบน Supabase ถูกจัดเตรียมไว้เรียบร้อยแล้วที่ไฟล์ <code className="text-blue-300 font-mono">supabase_schema.sql</code>
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
