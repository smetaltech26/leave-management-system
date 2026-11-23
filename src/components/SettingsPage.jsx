import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  RefreshCw,
  AlertTriangle,
  Trash2,
  HardDrive,
  ShieldAlert,
  X,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { useModal } from '../contexts/ModalContext';
import * as api from '../services/supabaseApi';
import PolicyManagement from './admin/PolicyManagement';
import HolidayManagement from './admin/HolidayManagement';
import AgencyManagement from './admin/AgencyManagement';
import DepartmentManagement from './admin/DepartmentManagement';
import LeaveTypeManagement from './admin/LeaveTypeManagement';

export default function SettingsPage({
  currentUser,
  requests = [],
  onResetLeaveRequests,
  userPolicies,
  setUserPolicies,
  holidays,
  setHolidays,
  users,
  agencies,
  setAgencies,
  departments,
  setDepartments,
  leaveTypes,
  setLeaveTypes
}) {
  const [activeSubTab, setActiveSubTab] = useState('policies'); // policies | leavetypes | holidays | agencies | departments | database
  const isConfigured = isSupabaseConfigured();
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const { showAlert } = useModal();

  // Danger Zone: DB Annual Reset Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [isResettingDb, setIsResettingDb] = useState(false);

  // Danger Zone: Storage Bucket Cleanup state
  const [storageFileCount, setStorageFileCount] = useState(null);
  const [isLoadingStorageCount, setIsLoadingStorageCount] = useState(false);
  const [storageCountError, setStorageCountError] = useState('');
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [storageInput, setStorageInput] = useState('');
  const [isPurgingStorage, setIsPurgingStorage] = useState(false);

  const requestStats = useMemo(() => {
    const safeRequests = Array.isArray(requests) ? requests : [];
    const approvalStepsCount = safeRequests.reduce(
      (sum, req) => sum + (Array.isArray(req.approvers) ? req.approvers.length : 0),
      0
    );
    const attachmentRowsCount = safeRequests.reduce(
      (sum, req) => sum + (Array.isArray(req.attachments) ? req.attachments.length : 0),
      0
    );
    return {
      requestsCount: safeRequests.length,
      approvalStepsCount,
      attachmentRowsCount
    };
  }, [requests]);

  const loadStorageFileCount = useCallback(async () => {
    if (!isSuperAdmin || !isConfigured) return;
    setIsLoadingStorageCount(true);
    setStorageCountError('');
    try {
      const files = await api.listAllAttachmentStorageFiles();
      setStorageFileCount(files.length);
    } catch (err) {
      console.error('Failed to count storage attachment files:', err);
      setStorageCountError(err?.message || 'ไม่สามารถตรวจสอบจำนวนไฟล์ใน Storage ได้');
    } finally {
      setIsLoadingStorageCount(false);
    }
  }, [isSuperAdmin, isConfigured]);

  useEffect(() => {
    if (activeSubTab === 'database' && isSuperAdmin && isConfigured) {
      loadStorageFileCount();
    }
  }, [activeSubTab, isSuperAdmin, isConfigured, loadStorageFileCount]);

  // Escape key closes open Danger Zone modal when idle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (isResetModalOpen && !isResettingDb) {
        setIsResetModalOpen(false);
        setResetInput('');
      } else if (isStorageModalOpen && !isPurgingStorage) {
        setIsStorageModalOpen(false);
        setStorageInput('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResetModalOpen, isResettingDb, isStorageModalOpen, isPurgingStorage]);

  const handleConfirmAnnualReset = async () => {
    if (!isSuperAdmin || isResettingDb) return;
    if (resetInput !== api.ANNUAL_RESET_CONFIRMATION_TEXT) return;

    setIsResettingDb(true);
    try {
      const result = await onResetLeaveRequests(resetInput);
      setIsResetModalOpen(false);
      setResetInput('');
      await showAlert(
        `รีเซ็ตข้อมูลคำขอลาขึ้นปีใหม่เรียบร้อยแล้ว\n\n` +
        `• ลบคำขอลาทั้งหมด: ${result.deleted_requests.toLocaleString()} รายการ\n` +
        `• ลบประวัติขั้นตอนอนุมัติ: ${result.deleted_approval_steps.toLocaleString()} รายการ\n` +
        `• ลบข้อมูลเอกสารแนบใน DB: ${result.deleted_attachments.toLocaleString()} รายการ\n` +
        `• เลขที่คำขอถัดไปพร้อมเริ่มที่: ${result.next_request_id}\n\n` +
        `ข้อมูลพนักงาน, แผนก, ประเภทการลา, สิทธิ์วันลา และตั้งค่าระบบอื่นๆ ยังคงอยู่ครบถ้วน`,
        { type: 'success', title: 'รีเซ็ตข้อมูลขึ้นปีใหม่สำเร็จ' }
      );
    } catch (err) {
      console.error('Annual reset error:', err);
      await showAlert(err?.message || 'ไม่สามารถรีเซ็ตข้อมูลคำขอลาได้ กรุณาลองใหม่อีกครั้ง', {
        type: 'error',
        title: 'รีเซ็ตข้อมูลไม่สำเร็จ'
      });
    } finally {
      setIsResettingDb(false);
    }
  };

  const handleConfirmStoragePurge = async () => {
    if (!isSuperAdmin || isPurgingStorage) return;
    if (storageInput !== api.STORAGE_PURGE_CONFIRMATION_TEXT) return;

    setIsPurgingStorage(true);
    try {
      const result = await api.purgeAttachmentStorageBucket(storageInput);
      setStorageFileCount(result.remaining_files);
      setIsStorageModalOpen(false);
      setStorageInput('');
      await showAlert(
        result.remaining_files === 0
          ? `ลบไฟล์ใน Storage Bucket (attachments) เรียบร้อยแล้ว\n\n• ลบไฟล์ออกทั้งหมด: ${result.deleted_files.toLocaleString()} ไฟล์\n• ไฟล์คงเหลือ: 0 ไฟล์\n\nรูปโปรไฟล์พนักงานใน Bucket (avatars) ไม่ได้รับผลกระทบ`
          : `ดำเนินการลบไฟล์บางส่วนแล้ว\n\n• ลบสำเร็จ: ${result.deleted_files.toLocaleString()} ไฟล์\n• คงเหลือ: ${result.remaining_files.toLocaleString()} ไฟล์`,
        {
          type: result.remaining_files === 0 ? 'success' : 'alert',
          title: 'จัดการไฟล์ Storage Bucket เสร็จสิ้น'
        }
      );
    } catch (err) {
      console.error('Storage purge error:', err);
      await showAlert(err?.message || 'ไม่สามารถลบไฟล์ใน Storage Bucket ได้', {
        type: 'error',
        title: 'ลบไฟล์ Storage ไม่สำเร็จ'
      });
    } finally {
      setIsPurgingStorage(false);
    }
  };

  const isResetPhraseMatched = resetInput === api.ANNUAL_RESET_CONFIRMATION_TEXT;
  const isStoragePhraseMatched = storageInput === api.STORAGE_PURGE_CONFIRMATION_TEXT;

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
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setActiveSubTab('policies')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'policies'
                ? 'bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/40 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            โควตาวันลา
          </button>
          <button
            onClick={() => setActiveSubTab('leavetypes')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'leavetypes'
                ? 'bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/40 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ประเภทการลา
          </button>
          <button
            onClick={() => setActiveSubTab('holidays')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'holidays'
                ? 'bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/40 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            วันหยุดประจำปี
          </button>
          <button
            onClick={() => setActiveSubTab('agencies')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'agencies'
                ? 'bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/40 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            หน่วยงาน
          </button>
          <button
            onClick={() => setActiveSubTab('departments')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'departments'
                ? 'bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/40 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ฝ่าย/แผนก
          </button>
          <button
            onClick={() => setActiveSubTab('database')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'database'
                ? 'bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/40 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ฐานข้อมูล
          </button>
        </div>
      </div>

      {activeSubTab === 'policies' && (
        <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] shadow-sm">
          <PolicyManagement userPolicies={userPolicies} setUserPolicies={setUserPolicies} users={users} agencies={agencies} departments={departments} leaveTypes={leaveTypes} />
        </div>
      )}

      {activeSubTab === 'leavetypes' && (
        <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] shadow-sm">
          <LeaveTypeManagement leaveTypes={leaveTypes} setLeaveTypes={setLeaveTypes} />
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
        <div className="space-y-6">
          {/* Database Connection Status Card */}
          <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] shadow-sm space-y-5">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6 text-blue-500 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">สถานะการเชื่อมต่อ Supabase Database</h3>
                <p className="text-xs text-[var(--text-muted)]">โครงการ: leave-management-system (smetaltech26@gmail.com)</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-[var(--card-border)] space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[var(--text-muted)]">สถานะคอนฟิกปัจจุบัน:</span>
                {isConfigured ? (
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-full font-semibold">
                    เชื่อมต่อ Supabase Live Project เรียบร้อย
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full font-semibold">
                    ใช้งานในโหมด Local Mock Engine
                  </span>
                )}
              </div>

              <p className="text-[var(--text-muted)] leading-relaxed">
                ไฟล์ DDL Schema สำหรับสร้างตาราง PostgreSQL ทั้งหมดบน Supabase ถูกจัดเตรียมไว้เรียบร้อยแล้วที่ไฟล์ <code className="text-blue-600 dark:text-blue-300 font-mono">supabase_schema.sql</code>
              </p>
            </div>
          </div>

          {/* SuperAdmin-only Danger Zone */}
          {isSuperAdmin && (
            <div className="rounded-3xl p-6 border-2 border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 shadow-sm space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-red-700 dark:text-red-300">
                        Danger Zone — รีเซ็ตระบบขึ้นปีใหม่
                      </h3>
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-600 text-white">
                        SuperAdmin Only
                      </span>
                    </div>
                    <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-1 leading-relaxed">
                      การดำเนินการในส่วนนี้ไม่สามารถย้อนกลับได้ กรุณาตรวจสอบให้แน่ใจว่าได้ Backup รายงานประจำเดือน/ประจำปีเรียบร้อยแล้วก่อนดำเนินการ
                    </p>
                  </div>
                </div>
              </div>

              {/* Action 1: Reset Leave Requests & Restart Numbering at LEV-0001 */}
              <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-red-200/80 dark:border-red-900/50 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>1. รีเซ็ตข้อมูลคำขอลาและเริ่มเลขที่คำขอใหม่ที่ LEV-0001</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      ลบข้อมูลคำขอลาเก่า, ประวัติขั้นตอนการอนุมัติ และรายการเอกสารแนบในฐานข้อมูลทั้งหมดแบบ Atomic เพื่อให้เลขที่คำขอลาใหม่เริ่มรันที่ <strong className="font-mono text-red-600 dark:text-red-400">LEV-0001</strong> สำหรับปีใหม่
                    </p>

                    {/* Live Counts */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                      <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">คำขอลาปัจจุบัน</div>
                        <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                          {requestStats.requestsCount.toLocaleString()} <span className="text-xs font-medium text-slate-500">รายการ</span>
                        </div>
                      </div>
                      <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">ประวัติขั้นตอนอนุมัติ</div>
                        <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                          {requestStats.approvalStepsCount.toLocaleString()} <span className="text-xs font-medium text-slate-500">รายการ</span>
                        </div>
                      </div>
                      <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">ข้อมูลเอกสารแนบ (DB)</div>
                        <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                          {requestStats.attachmentRowsCount.toLocaleString()} <span className="text-xs font-medium text-slate-500">รายการ</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>ข้อมูลที่ไม่ถูกแตะต้อง:</strong> พนักงาน, หน่วยงาน, ฝ่าย/แผนก, ประเภทการลา, สิทธิ์/โควตาวันลา, วันหยุดประจำปี และสิทธิ์การใช้งานระบบทั้งหมด
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center lg:pt-1">
                    <button
                      type="button"
                      disabled={!isConfigured || isResettingDb}
                      onClick={() => {
                        setResetInput('');
                        setIsResetModalOpen(true);
                      }}
                      className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>รีเซ็ตคำขอลาขึ้นปีใหม่ (LEV-0001)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action 2: Purge Storage Bucket ('attachments') */}
              <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-red-200/80 dark:border-red-900/50 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>2. ลบไฟล์เอกสารแนบทั้งหมดใน Storage Bucket (attachments)</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      ล้างไฟล์รูปภาพ/ใบรับรองแพทย์เก่าทั้งหมดออกจาก Supabase Storage Bucket <code className="font-mono text-orange-600 dark:text-orange-400">attachments</code> เพื่อคืนพื้นที่จัดเก็บสำหรับปีใหม่ (แนะนำให้กดหลังจากรีเซ็ตคำขอลาเรียบร้อยแล้ว)
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">ไฟล์ใน Bucket attachments:</span>
                        {isLoadingStorageCount ? (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            กำลังนับ...
                          </span>
                        ) : storageFileCount !== null ? (
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                            {storageFileCount.toLocaleString()} ไฟล์
                          </span>
                        ) : (
                          <span className="font-medium text-slate-500">-</span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!isConfigured || isLoadingStorageCount}
                        onClick={loadStorageFileCount}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStorageCount ? 'animate-spin' : ''}`} />
                        <span>รีเฟรชจำนวนไฟล์</span>
                      </button>
                    </div>

                    {storageCountError && (
                      <p className="text-[11px] text-red-600 dark:text-red-400">{storageCountError}</p>
                    )}

                    <div className="flex items-start gap-2 pt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>ปลอดภัยต่อรูปพนักงาน:</strong> ลบเฉพาะไฟล์ใน Bucket <code className="font-mono">attachments</code> เท่านั้น ไม่แตะรูปโปรไฟล์ใน Bucket <code className="font-mono">avatars</code>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center lg:pt-1">
                    <button
                      type="button"
                      disabled={!isConfigured || isPurgingStorage || storageFileCount === 0}
                      onClick={() => {
                        setStorageInput('');
                        setIsStorageModalOpen(true);
                      }}
                      className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <HardDrive className="w-4 h-4" />
                      <span>ลบไฟล์ใน Storage Bucket</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: 2-Step Confirmation for Annual DB Reset (iOS Safari Compliant + Portal) */}
      {isResetModalOpen && isSuperAdmin && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="annual-reset-modal-title"
          onClick={() => {
            if (!isResettingDb) {
              setIsResetModalOpen(false);
              setResetInput('');
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl flex flex-col overflow-hidden max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0 shadow-2xl border border-red-200 dark:border-red-900/60"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-red-100 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0">
                  <h3 id="annual-reset-modal-title" className="text-base font-bold text-red-700 dark:text-red-300">
                    ยืนยันการรีเซ็ตข้อมูลคำขอลาขึ้นปีใหม่
                  </h3>
                  <p className="text-xs text-red-600/80 dark:text-red-300/80">
                    การลบข้อมูลนี้ถาวรและไม่สามารถย้อนกลับได้
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="ปิดหน้าต่างยืนยัน"
                disabled={isResettingDb}
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetInput('');
                }}
                className="p-2 rounded-xl text-slate-500 hover:bg-red-100/70 dark:hover:bg-red-900/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar space-y-4 text-sm">
              <div className="rounded-xl p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-1.5 text-xs text-red-800 dark:text-red-200">
                <p className="font-bold">รายการที่จะถูกลบออกจากฐานข้อมูลทันที:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>คำขอลาทั้งหมด: <strong>{requestStats.requestsCount.toLocaleString()} รายการ</strong></li>
                  <li>ประวัติขั้นตอนการอนุมัติ: <strong>{requestStats.approvalStepsCount.toLocaleString()} รายการ</strong></li>
                  <li>ข้อมูลเอกสารแนบใน DB: <strong>{requestStats.attachmentRowsCount.toLocaleString()} รายการ</strong></li>
                </ul>
                <p className="pt-1 font-semibold">
                  หลังรีเซ็ต เลขที่คำขอลาถัดไปจะเริ่มใหม่ที่ <code className="font-mono px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60">LEV-0001</code>
                </p>
              </div>

              <div className="rounded-xl p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-200">
                <strong>ไม่แตะต้อง:</strong> ข้อมูลพนักงาน, หน่วยงาน, แผนก, ประเภทการลา, สิทธิ์/โควตาวันลา, วันหยุดประจำปี และสิทธิ์การใช้งานระบบ
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="annual-reset-confirm-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  กรุณาพิมพ์ข้อความด้านล่างให้ตรงทุกตัวอักษรเพื่อยืนยัน:
                </label>
                <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-red-600 dark:text-red-400 select-all">
                  {api.ANNUAL_RESET_CONFIRMATION_TEXT}
                </div>
                <input
                  id="annual-reset-confirm-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isResettingDb}
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  placeholder="พิมพ์คำยืนยันที่นี่..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <button
                type="button"
                disabled={isResettingDb}
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetInput('');
                }}
                className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!isResetPhraseMatched || isResettingDb}
                onClick={handleConfirmAnnualReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                {isResettingDb ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังรีเซ็ตข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>ยืนยันลบและรีเซ็ตเป็น LEV-0001</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: 2-Step Confirmation for Storage Bucket Purge (iOS Safari Compliant + Portal) */}
      {isStorageModalOpen && isSuperAdmin && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="storage-purge-modal-title"
          onClick={() => {
            if (!isPurgingStorage) {
              setIsStorageModalOpen(false);
              setStorageInput('');
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl flex flex-col overflow-hidden max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0 shadow-2xl border border-orange-200 dark:border-orange-900/60"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-orange-100 dark:border-orange-900/40 bg-orange-50/70 dark:bg-orange-950/30 shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0">
                  <HardDrive className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0">
                  <h3 id="storage-purge-modal-title" className="text-base font-bold text-orange-700 dark:text-orange-300">
                    ยืนยันการลบไฟล์ใน Storage Bucket
                  </h3>
                  <p className="text-xs text-orange-600/80 dark:text-orange-300/80">
                    ไฟล์เอกสารแนบทั้งหมดใน Bucket attachments จะถูกลบถาวร
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="ปิดหน้าต่างยืนยัน"
                disabled={isPurgingStorage}
                onClick={() => {
                  setIsStorageModalOpen(false);
                  setStorageInput('');
                }}
                className="p-2 rounded-xl text-slate-500 hover:bg-orange-100/70 dark:hover:bg-orange-900/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar space-y-4 text-sm">
              <div className="rounded-xl p-3.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 space-y-1.5 text-xs text-orange-800 dark:text-orange-200">
                <p className="font-bold">
                  ไฟล์ใน Bucket <code className="font-mono">attachments</code> ที่จะถูกลบถาวร:{' '}
                  <strong>{storageFileCount !== null ? `${storageFileCount.toLocaleString()} ไฟล์` : 'ทั้งหมด'}</strong>
                </p>
                <p>
                  หากยังมีคำขอลาเก่าค้างอยู่ในระบบ ลิงก์ดูไฟล์แนบของใบลาเหล่านั้นจะไม่สามารถเปิดดูได้หลังลบไฟล์
                </p>
              </div>

              <div className="rounded-xl p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-200">
                <strong>ปลอดภัย:</strong> รูปโปรไฟล์พนักงานใน Bucket <code className="font-mono">avatars</code> จะไม่ถูกลบ
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="storage-purge-confirm-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  กรุณาพิมพ์ข้อความด้านล่างให้ตรงทุกตัวอักษรเพื่อยืนยัน:
                </label>
                <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-orange-600 dark:text-orange-400 select-all">
                  {api.STORAGE_PURGE_CONFIRMATION_TEXT}
                </div>
                <input
                  id="storage-purge-confirm-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isPurgingStorage}
                  value={storageInput}
                  onChange={(e) => setStorageInput(e.target.value)}
                  placeholder="พิมพ์คำยืนยันที่นี่..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <button
                type="button"
                disabled={isPurgingStorage}
                onClick={() => {
                  setIsStorageModalOpen(false);
                  setStorageInput('');
                }}
                className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!isStoragePhraseMatched || isPurgingStorage}
                onClick={handleConfirmStoragePurge}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                {isPurgingStorage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังลบไฟล์ใน Storage...</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4" />
                    <span>ยืนยันลบไฟล์แนบทั้งหมด</span>
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
