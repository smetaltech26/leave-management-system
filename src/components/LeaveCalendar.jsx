import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, X, Info, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import LeaveDetailsModal from './LeaveDetailsModal';

export default function LeaveCalendar({ requests, holidays, users, departments, agencies, userPolicies }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 7, 1)); // สิงหาคม 2026
  const [selectedGroup, setSelectedGroup] = useState(null); 
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const openDetailsModal = (req) => {
    setSelectedRequestDetails(req);
    setIsDetailsModalOpen(true);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const calendarDays = Array(firstDayIndex).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const daysOfWeek = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const formatDateStr = (day) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const openGroupModal = (dateStr, dept, reqs) => {
    setSelectedGroup({ dateStr, dept, reqs });
  };
  const closeGroupModal = () => setSelectedGroup(null);

  const getStatusBadge = (status) => {
    if (status === 'Approved') return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> อนุมัติแล้ว</span>;
    if (status === 'Rejected') return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> ไม่อนุมัติ</span>;
    return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> รออนุมัติ</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-[var(--card-bg)] p-4 rounded-xl shadow-sm border border-[var(--card-border)]">
        <h2 className="text-xl font-extrabold text-[var(--text-main)] flex items-center gap-2">
          ปฏิทินการลา
        </h2>
      </div>

      <div className="bg-[var(--card-bg)] p-4 md:p-6 rounded-2xl shadow-lg border border-[var(--card-border)]">
        <div className="flex justify-between items-center mb-6">
          <button onClick={prevMonth} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center space-x-2 text-sm font-bold transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span>เดือนก่อนหน้า</span>
          </button>
          
          <span className="text-xl md:text-2xl font-extrabold text-[var(--text-main)]">
            {monthNames[month]} {year + 543}
          </span>
          
          <button onClick={nextMonth} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center space-x-2 text-sm font-bold transition-colors">
            <span>เดือนถัดไป</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {calendarDays.map((dayNum, index) => {
            if (!dayNum) {
              return <div key={index} className="h-28 md:h-32 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50"></div>;
            }

            const dateStr = formatDateStr(dayNum);
            const holiday = holidays.find(h => h.date === dateStr);
            const leaveToday = requests.filter(r => dateStr >= r.date_start && dateStr <= r.date_end);
            
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = dateStr === todayStr;

            // Group by department logic
            const groupedByDept = {};
            leaveToday.forEach(r => {
              const requester = users.find(u => u.id === r.user_id);
              let deptName = 'ไม่ระบุแผนก';
              if (requester) {
                if (requester.department) {
                  deptName = requester.department;
                } else if (requester.department_id) {
                  const deptObj = departments?.find(d => d.id === requester.department_id);
                  if (deptObj) deptName = deptObj.name;
                }
              }
              if (!groupedByDept[deptName]) {
                groupedByDept[deptName] = [];
              }
              groupedByDept[deptName].push({ ...r, requester });
            });

            const isWeekend = (index % 7 === 0) || (index % 7 === 6);

            let borderClass = "border-slate-200 dark:border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)]";
            if (holiday || isWeekend) {
              borderClass = "border-rose-400 border-[1.5px] bg-white dark:bg-[var(--card-bg)]";
            } else if (isToday) {
              borderClass = "border-emerald-500 border-[1.5px] bg-white dark:bg-[var(--card-bg)]";
            }

            return (
              <div key={index} className={`h-28 md:h-32 rounded-xl p-2 transition-all flex flex-col relative overflow-hidden ${borderClass} border`}>
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-sm md:text-base font-extrabold text-[var(--text-main)]`}>
                    {dayNum}
                  </span>
                  
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[9px] md:text-[10px] font-semibold text-slate-400">
                      {daysOfWeek[index % 7]}
                    </span>
                    {holiday && (
                      <span className="text-[8px] md:text-[9px] text-rose-500 font-bold mt-0.5 truncate max-w-[50px] md:max-w-[70px]">
                        {holiday.title}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5 overflow-y-auto custom-scrollbar pb-1">
                  {Object.entries(groupedByDept).map(([dept, reqs]) => (
                    <div
                      key={dept}
                      onClick={() => openGroupModal(dateStr, dept, reqs)}
                      className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-[9px] md:text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors truncate shadow-sm"
                    >
                      <Users className="w-3 h-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                      <span className="truncate">{dept} ({reqs.length})</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in" onClick={closeGroupModal}>
          <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden border border-slate-200 dark:border-[var(--card-border)]" onClick={e => e.stopPropagation()}>
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-[var(--card-border)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[var(--text-main)]">
                ข้อมูลการลาประจำวันที่ {selectedGroup.dateStr.split('-').reverse().join('/')}
              </h2>
              <button onClick={closeGroupModal} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-grow">
              <div className="mb-6 p-4 rounded-xl shadow-sm border border-blue-500/20 bg-blue-500 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{selectedGroup.dept}</h3>
                    <p className="text-sm text-blue-100 font-medium">พนักงานที่ลาทั้งหมด {selectedGroup.reqs.length} รายการ</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400">พนักงาน</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 text-center">ประเภทการลา</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 text-center">ช่วงเวลา</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 text-center">สถานะ</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.reqs.map(req => (
                      <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-400 dark:text-slate-500 text-xs overflow-hidden shrink-0">
                               <img src={req.requester?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requester?.fullname || 'U')}&background=0D8ABC&color=fff`} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h3 className="font-bold text-[var(--text-main)] text-[14px] leading-tight">
                                {req.requester ? req.requester.fullname : req.user_id}
                              </h3>
                              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                รหัส: {req.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-xs font-bold text-[var(--text-main)] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            {req.leave_type}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-xs text-[var(--text-muted)] font-medium">
                              {req.date_start === req.date_end 
                                ? req.date_start.split('-').reverse().join('/')
                                : `${req.date_start.split('-').reverse().join('/')} - ${req.date_end.split('-').reverse().join('/')}`}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => openDetailsModal(req)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors mx-auto block"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedRequestDetails && (
        <LeaveDetailsModal
          isOpen={true}
          request={selectedRequestDetails}
          user={selectedRequestDetails.requester}
          allPolicies={userPolicies}
          onClose={() => setIsDetailsModalOpen(false)}
          users={users}
          agencies={agencies}
          departments={departments}
        />
      )}
    </div>
  );
}
