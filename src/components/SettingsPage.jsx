import React, { useState } from 'react';
import { Settings, Shield, Calendar, Award, Database, RefreshCw, Key } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function SettingsPage({ userPolicies, holidays, onUpdatePolicies }) {
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
        <div className="flex p-1 bg-[var(--card-bg)]/80 rounded-2xl border border-[var(--card-border)] self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('policies')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubTab === 'policies' ? 'bg-emerald-500 text-[var(--text-main)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            โควตาวันลา (Policies)
          </button>
          <button
            onClick={() => setActiveSubTab('holidays')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubTab === 'holidays' ? 'bg-emerald-500 text-[var(--text-main)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            วันหยุดประจำปี
          </button>
          <button
            onClick={() => setActiveSubTab('database')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubTab === 'database' ? 'bg-emerald-500 text-[var(--text-main)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            ฐานข้อมูล Supabase
          </button>
        </div>
      </div>

      {activeSubTab === 'policies' && (
        <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-main)]">ตารางโควตาวันลาประจำปี (User Leave Policies)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-muted)]">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-muted)]">
                  <th className="pb-3 px-3">รหัสพนักงาน</th>
                  <th className="pb-3 px-3">ประเภทการลา</th>
                  <th className="pb-3 px-3">สิทธิ์วันลาสูงสุด</th>
                  <th className="pb-3 px-3">ใช้ไปแล้ว</th>
                  <th className="pb-3 px-3">วันคงเหลือ</th>
                  <th className="pb-3 px-3">ปี พ.ศ.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {userPolicies.map((pol) => (
                  <tr key={pol.id} className="hover:bg-[var(--card-bg)]/40">
                    <td className="py-3 px-3 font-semibold text-emerald-400">{pol.user_id}</td>
                    <td className="py-3 px-3 text-[var(--text-main)]">{pol.leave_type}</td>
                    <td className="py-3 px-3 font-semibold">{pol.max_days} วัน</td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{pol.used_days} วัน</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">{pol.remaining_days} วัน</td>
                    <td className="py-3 px-3 text-slate-500">{pol.year + 543}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'holidays' && (
        <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-main)]">วันหยุดประจำปี (Annual Holidays)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {holidays.map((h) => (
              <div key={h.id} className="p-3.5 rounded-2xl bg-[var(--card-bg)]/60 border border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-main)]">{h.title}</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{h.date}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-[var(--card-bg)] text-[var(--text-muted)] rounded-md">
                  หยุดประจำปี
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'database' && (
        <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] space-y-6">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">สถานะการเชื่อมต่อ Supabase Database</h3>
              <p className="text-xs text-[var(--text-muted)]">โครงการ: leave-management-system (smetaltech26@gmail.com)</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--card-bg)]/80 border border-[var(--card-border)] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">สถานะคอนฟิกปัจจุบัน:</span>
              {isConfigured ? (
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold">
                  ✅ เชื่อมต่อ Supabase Live Project เรียบร้อย
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full font-semibold">
                  ⚠️ ใช้งานในโหมด Local High-Performance Mock Engine (พร้อมรัน SQL บน Supabase)
                </span>
              )}
            </div>

            <p className="text-[var(--text-muted)] leading-relaxed">
              ไฟล์ DDL Schema สำหรับสร้างตาราง PostgreSQL ทั้งหมดบน Supabase ถูกจัดเตรียมไว้เรียบร้อยแล้วที่ไฟล์ <code className="text-emerald-300 font-mono">supabase_schema.sql</code> พี่ต้นสามารถนำโค้ดไปวางและรันใน Supabase SQL Editor ได้ทันทีค่ะ!
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
