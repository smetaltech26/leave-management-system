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
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>รายงานและสถิติการลางาน</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">สรุปข้อมูลคำขอลางาน การอนุมัติ และสถิติภาพรวมประจำปี 2026</p>
        </div>

        <button
          onClick={() => alert('ดาวน์โหลดรายงาน CSV / Excel เรียบร้อยแล้วค่ะ')}
          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <p className="text-xs text-slate-400">คำขอลาทั้งหมด</p>
          <p className="text-3xl font-extrabold text-white mt-1">{totalRequests}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/5">
          <p className="text-xs text-emerald-400">อนุมัติแล้ว</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1">{approvedCount}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5">
          <p className="text-xs text-amber-400">รอการอนุมัติ</p>
          <p className="text-3xl font-extrabold text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-rose-500/30 bg-rose-500/5">
          <p className="text-xs text-rose-400">ปฏิเสธคำขอ</p>
          <p className="text-3xl font-extrabold text-rose-400 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Requests Log Table */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-white">ตารางสรุปคำขอลางานทั้งหมด</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
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
                  <tr key={r.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-400">{r.id}</td>
                    <td className="py-3 px-3 font-semibold text-white">{reqUser?.fullname || r.user_id}</td>
                    <td className="py-3 px-3 text-slate-300">{r.leave_type}</td>
                    <td className="py-3 px-3 text-slate-400 truncate max-w-xs">{r.description}</td>
                    <td className="py-3 px-3 text-slate-400">{r.date_start} ถึง {r.date_end}</td>
                    <td className="py-3 px-3 font-bold text-white">{r.leave_duration} วัน</td>
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
