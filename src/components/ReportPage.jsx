import React, { useState, useEffect } from 'react';
import { FileText, Download, PieChart, TrendingUp, Filter, Search, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ReportPage({ requests, users, agencies, departments }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const totalRequests = requests.length;
  // Note: in previous code status was 'Approved', here we might need to handle lowercase depending on mock data
  const approvedCount = requests.filter(r => r.status.toLowerCase() === 'approved').length;
  const pendingCount = requests.filter(r => r.status.toLowerCase() === 'pending').length;
  const rejectedCount = requests.filter(r => r.status.toLowerCase() === 'rejected').length;

  // Filter Logic
  const filteredRequests = requests.filter(r => {
    const reqUser = users.find(u => u.id === r.user_id);
    const agencyName = agencies?.find(a => a.id === reqUser?.agency_id)?.name || reqUser?.agency_id || 'SMT';
    const deptName = departments?.find(d => d.id === reqUser?.department_id)?.name || reqUser?.department_id || 'ทั่วไป';
    
    const term = searchTerm.toLowerCase();
    const searchMatch = !searchTerm || 
      (reqUser && reqUser.fullname.toLowerCase().includes(term)) ||
      r.id.toLowerCase().includes(term) ||
      r.leave_type.toLowerCase().includes(term) ||
      agencyName.toLowerCase().includes(term) ||
      deptName.toLowerCase().includes(term);
    
    // Simple date filter (assuming date format YYYY-MM-DD for comparison)
    const startMatch = !startDate || r.date_start >= startDate;
    const endMatch = !endDate || r.date_end <= endDate;

    return searchMatch && startMatch && endMatch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = () => {
    const formatExcelDate = (d) => {
      if (!d) return '';
      const parts = d.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return d;
    };

    const exportData = filteredRequests.map((r, index) => {
      const reqUser = users.find(u => u.id === r.user_id);
      
      let periodText = 'ทั้งวัน';
      if (r.leave_period === 'Morning') periodText = 'เช้า';
      else if (r.leave_period === 'Afternoon') periodText = 'บ่าย';

      let statusText = 'รออนุมัติ';
      if (r.status.toLowerCase() === 'approved') statusText = 'อนุมัติ';
      else if (r.status.toLowerCase() === 'rejected') statusText = 'ไม่อนุมัติ';

      return {
        'ลำดับ': index + 1,
        'รหัสคำขอ': r.id,
        'พนักงาน': reqUser?.fullname || r.user_id,
        'ประเภท': r.leave_type,
        'วันที่เริ่ม': formatExcelDate(r.date_start),
        'วันที่สิ้นสุด': formatExcelDate(r.date_end),
        'จำนวน(วัน)': r.leave_duration,
        'ช่วง': periodText,
        'เหตุผล': r.description || '',
        'สถานะ': statusText
      };
    });

    let fileName = 'รายงานการลา';
    if (startDate && endDate) {
      const formatLocal = (d) => {
        const parts = d.split('-');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return d;
      };
      fileName += `_${formatLocal(startDate)}_ถึง_${formatLocal(endDate)}`;
    } else {
      fileName += '_ทั้งหมด';
    }
    fileName += '.xlsx';

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานการลา');
    
    XLSX.writeFile(workbook, fileName);
  };

  const StatusBadge = ({ status }) => {
    const s = status.toLowerCase();
    if (s === 'approved') return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> อนุมัติ</span>;
    if (s === 'rejected') return <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit"><AlertCircle className="w-3 h-3"/> ไม่อนุมัติ</span>;
    return <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit"><Clock className="w-3 h-3"/> รออนุมัติ</span>;
  };

  const LeaveTypeBadge = ({ type }) => {
    let colorClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    if (type.includes('พักร้อน')) colorClass = "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30";
    else if (type.includes('ป่วย')) colorClass = "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30";
    else if (type.includes('ลากิจ')) colorClass = "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30";
    
    return <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center justify-center w-fit ${colorClass}`}>{type}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card-clean rounded-2xl p-5 border border-[var(--card-border)]">
          <p className="text-xs text-[var(--text-muted)]">คำขอลาทั้งหมด</p>
          <p className="text-3xl font-extrabold text-[var(--text-main)] mt-1">{totalRequests}</p>
        </div>
        <div className="glass-card-clean rounded-2xl p-5 border border-blue-500/30 bg-blue-500/5">
          <p className="text-xs text-blue-400">อนุมัติแล้ว</p>
          <p className="text-3xl font-extrabold text-blue-400 mt-1">{approvedCount}</p>
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

      {/* Requests Log Table with Filters */}
      <div className="bg-white dark:bg-[var(--card-bg)] rounded-3xl border border-slate-200 dark:border-[var(--card-border)] overflow-hidden shadow-sm">
        
        {/* Filters Area */}
        <div className="p-4 border-b border-slate-200 dark:border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-800/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h3 className="font-bold text-[var(--text-main)] whitespace-nowrap">รายงานข้อมูลการลาพนักงาน</h3>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ค้นหาข้อมูล..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-[var(--text-main)]"
              />
            </div>

            <div className="relative">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-[var(--text-main)]"
              />
            </div>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-emerald-500/20 transition-all"
            >
              Export
            </button>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden flex flex-col space-y-4 p-4 bg-slate-50/30 dark:bg-slate-900/10">
          {displayedRequests.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-muted)]">ไม่พบข้อมูล</div>
          ) : (
            displayedRequests.map((r) => {
              const reqUser = users.find(u => u.id === r.user_id);
              return (
                <div key={r.id} className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative shrink-0">
                        <img 
                          src={reqUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reqUser?.fullname || r.user_id)}&background=random`} 
                          alt={reqUser?.fullname}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                            {r.id}
                          </span>
                        </div>
                        <h3 className="font-bold text-[var(--text-main)] text-sm truncate">{reqUser?.fullname || r.user_id}</h3>
                        <div className="text-xs text-[var(--text-muted)] truncate">{agencies?.find(a => a.id === reqUser?.agency_id)?.name || reqUser?.agency_id || 'SMT'} | {departments?.find(d => d.id === reqUser?.department_id)?.name || reqUser?.department_id || 'ทั่วไป'}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <LeaveTypeBadge type={r.leave_type} />
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                    <div className="text-xs text-center">
                      <div className="text-[var(--text-muted)] font-medium mb-1">เริ่มต้น</div>
                      <div className="font-bold text-[var(--text-main)]">{r.date_start ? r.date_start.split('-').reverse().join('-') : ''}</div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex flex-col items-center">
                      <span>{r.leave_duration} วัน</span>
                      <div className="w-12 h-px bg-slate-300 dark:bg-slate-700 my-1"></div>
                    </div>
                    <div className="text-xs text-center">
                      <div className="text-[var(--text-muted)] font-medium mb-1">สิ้นสุด</div>
                      <div className="font-bold text-[var(--text-main)]">{r.date_end ? r.date_end.split('-').reverse().join('-') : ''}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <div className="text-xs text-[var(--text-muted)] truncate flex-1" title={r.description}>
                      <span className="font-bold">เหตุผล: </span>{r.description || 'ไม่ระบุ'}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg text-xs font-bold">
                        {r.leave_period === 'Morning' ? 'ช่วงเช้า' : r.leave_period === 'Afternoon' ? 'ช่วงบ่าย' : 'ทั้งวัน'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {displayedRequests.length > 0 && displayedRequests.length < itemsPerPage && (
            Array.from({ length: itemsPerPage - displayedRequests.length }).map((_, i) => {
              const r = displayedRequests[0];
              const reqUser = users.find(u => u.id === r.user_id);
              return (
                <div key={`empty-card-${i}`} className="invisible pointer-events-none select-none bg-white dark:bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] flex flex-col gap-4" aria-hidden="true">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative shrink-0">
                        <img 
                          src={reqUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reqUser?.fullname || r.user_id)}&background=random`} 
                          alt={reqUser?.fullname}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                            {r.id}
                          </span>
                        </div>
                        <h3 className="font-bold text-[var(--text-main)] text-sm truncate">{reqUser?.fullname || r.user_id}</h3>
                        <div className="text-xs text-[var(--text-muted)] truncate">{agencies?.find(a => a.id === reqUser?.agency_id)?.name || reqUser?.agency_id || 'SMT'} | {departments?.find(d => d.id === reqUser?.department_id)?.name || reqUser?.department_id || 'ทั่วไป'}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <LeaveTypeBadge type={r.leave_type} />
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                    <div className="text-xs text-center">
                      <div className="text-[var(--text-muted)] font-medium mb-1">เริ่มต้น</div>
                      <div className="font-bold text-[var(--text-main)]">{r.date_start ? r.date_start.split('-').reverse().join('-') : ''}</div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex flex-col items-center">
                      <span>{r.leave_duration} วัน</span>
                      <div className="w-12 h-px bg-slate-300 dark:bg-slate-700 my-1"></div>
                    </div>
                    <div className="text-xs text-center">
                      <div className="text-[var(--text-muted)] font-medium mb-1">สิ้นสุด</div>
                      <div className="font-bold text-[var(--text-main)]">{r.date_end ? r.date_end.split('-').reverse().join('-') : ''}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <div className="text-xs text-[var(--text-muted)] truncate flex-1" title={r.description}>
                      <span className="font-bold">เหตุผล: </span>{r.description || 'ไม่ระบุ'}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg text-xs font-bold">
                        {r.leave_period === 'Morning' ? 'ช่วงเช้า' : r.leave_period === 'Afternoon' ? 'ช่วงบ่าย' : 'ทั้งวัน'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[var(--text-main)] border-b border-slate-200 dark:border-[var(--card-border)]">
                <th className="py-4 px-6 font-bold whitespace-nowrap">รหัสคำขอ</th>
                <th className="py-4 px-6 font-bold">พนักงาน</th>
                <th className="py-4 px-6 font-bold text-center">ประเภท</th>
                <th className="py-4 px-6 font-bold text-center">วันที่เริ่ม - สิ้นสุด</th>
                <th className="py-4 px-6 font-bold text-center">จำนวน</th>
                <th className="py-4 px-6 font-bold text-center">ช่วง</th>
                <th className="py-4 px-6 font-bold">เหตุผล</th>
                <th className="py-4 px-6 font-bold text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[var(--card-border)]">
              {displayedRequests.length === 0 ? (
                <tr><td colSpan="8" className="py-8 text-center text-[var(--text-muted)]">ไม่พบข้อมูล</td></tr>
              ) : (
                displayedRequests.map((r) => {
                  const reqUser = users.find(u => u.id === r.user_id);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="py-4 px-6 font-mono text-slate-500 dark:text-slate-400 text-xs">{r.id}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <img src={reqUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reqUser?.fullname || r.user_id)}&background=random`} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700" />
                          <div>
                            <div className="font-bold text-[var(--text-main)] text-sm">{reqUser?.fullname || r.user_id}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">{agencies?.find(a => a.id === reqUser?.agency_id)?.name || reqUser?.agency_id || 'SMT'} | {departments?.find(d => d.id === reqUser?.department_id)?.name || reqUser?.department_id || 'ทั่วไป'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center"><LeaveTypeBadge type={r.leave_type} /></div>
                      </td>
                      <td className="py-4 px-6 text-center text-xs text-[var(--text-muted)] leading-tight">
                        <div className="font-medium text-[var(--text-main)] mb-1">{r.date_start ? r.date_start.split('-').reverse().join('-') : ''}</div>
                        <div>ถึง</div>
                        <div className="font-medium text-[var(--text-main)] mt-1">{r.date_end ? r.date_end.split('-').reverse().join('-') : ''}</div>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-[var(--text-main)]">{r.leave_duration} วัน</td>
                      <td className="py-4 px-6 text-center font-bold text-blue-600 dark:text-blue-400">{r.leave_period === 'Morning' ? 'เช้า' : r.leave_period === 'Afternoon' ? 'บ่าย' : 'ทั้งวัน'}</td>
                      <td className="py-4 px-6 text-[var(--text-muted)] text-sm truncate max-w-[200px]" title={r.description}>{r.description}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center"><StatusBadge status={r.status} /></div>
                      </td>
                    </tr>
                  );
                })
              )}
              {displayedRequests.length > 0 && displayedRequests.length < itemsPerPage && (
                Array.from({ length: itemsPerPage - displayedRequests.length }).map((_, i) => (
                  <tr key={`empty-row-${i}`} className="border-none pointer-events-none">
                    <td className="py-4 px-6" colSpan="8">
                      <div className="h-12 w-12 opacity-0"></div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {filteredRequests.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-[var(--card-border)] bg-slate-50/50 dark:bg-[var(--card-bg)] flex flex-col items-center justify-center gap-4">
            <span className="text-sm text-[var(--text-muted)]">
              แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, filteredRequests.length)} จากทั้งหมด {filteredRequests.length} รายการ
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 dark:border-[var(--card-border)] rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors text-[var(--text-main)]"
              >
                ย้อนกลับ
              </button>
              <span className="text-sm font-bold px-3 text-[var(--text-main)]">หน้า {currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 dark:border-[var(--card-border)] rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors text-[var(--text-main)]"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
