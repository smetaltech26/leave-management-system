import React from 'react';
import { FileText, Download, PieChart, TrendingUp, Filter } from 'lucide-react';

export default function ReportPage({ requests, users }) {
  const totalRequests = requests.length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center space-x-2">
            <span>รายงานและสถิติการลางาน</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">สรุปข้อมูลคำขอลางาน การอนุมัติ และสถิติภาพรวมประจำปี 2026</p>
        </div>

        <button
          onClick={() => alert('ดาวน์โหลดรายงาน CSV / Excel เรียบร้อยแล้วค่ะ')}
          className="py-2.5 px-4 bg-[var(--card-bg)] hover:bg-slate-700 text-emerald-400 border border-[var(--card-border)] text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card-clean rounded-2xl p-5 border border-[var(--card-border)]">
          <p className="text-xs text-[var(--text-muted)]">คำขอลาทั้งหมด</p>
          <p className="text-3xl font-extrabold text-[var(--text-main)] mt-1">{totalRequests}</p>
        </div>
        <div className="glass-card-clean rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/5">
          <p className="text-xs text-emerald-400">อนุมัติแล้ว</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1">{approvedCount}</p>
        </div>
        <div className="glass-card-clean rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5">
          <p className="text-xs text-amber-400">รอการอนุมัติ</p>
          <p className="text-3xl font-extrabold text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="glass-card-clean rounded-2xl p-5 border border-rose-500/30 bg-rose-500/5">
          <p className="text-xs text-rose-400">ปฏิเสธคำขอ</p>
          <p className="text-3xl font-extrabold text-rose-400 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Requests Log Table */}
      <div className="glass-card-clean rounded-3xl p-6 border border-[var(--card-border)] space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-[var(--text-main)]">ตารางสรุปคำขอลางานทั้งหมด</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-muted)]">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-muted)] font-semibold">
                <th className="pb-3 px-3">เลขที่คำขอ</th>
                <th className="pb-3 px-3">ชื่อผู้ขอลา</th>
                <th className="pb-3 px-3">ประเภท</th>
                <th className="pb-3 px-3">เหตุผล</th>
                <th className="pb-3 px-3">ช่วงเวลา</th>
                <th className="pb-3 px-3">จำนวนวัน</th>
                <th className="pb-3 px-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requests.map((r) => {
                const reqUser = users.find(u => u.id === r.user_id);
                return (
                  <tr key={r.id} className="hover:bg-[var(--card-bg)]/40">
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-400">{r.id}</td>
                    <td className="py-3 px-3 font-semibold text-[var(--text-main)]">{reqUser?.fullname || r.user_id}</td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{r.leave_type}</td>
                    <td className="py-3 px-3 text-[var(--text-muted)] truncate max-w-xs">{r.description}</td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{r.date_start} ถึง {r.date_end}</td>
                    <td className="py-3 px-3 font-bold text-[var(--text-main)]">{r.leave_duration} วัน</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        r.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
