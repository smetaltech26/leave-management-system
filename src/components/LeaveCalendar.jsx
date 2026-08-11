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
        <div className="flex justify-between items-center mb-6 gap-1 sm:gap-2">
          <button onClick={prevMonth} className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center space-x-0.5 sm:space-x-2 text-[10px] sm:text-xs md:text-sm font-bold transition-colors whitespace-nowrap">
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>เดือนก่อนหน้า</span>
          </button>
          
          <span className="text-sm sm:text-lg md:text-2xl font-extrabold text-[var(--text-main)] text-center whitespace-nowrap">
            {monthNames[month]} {year}
          </span>
          
          <button onClick={nextMonth} className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center space-x-0.5 sm:space-x-2 text-[10px] sm:text-xs md:text-sm font-bold transition-colors whitespace-nowrap">
            <span>เดือนถัดไป</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 md:gap-2">
          {calendarDays.map((dayNum, index) => {
            if (!dayNum) {
              return <div key={index} className="hidden md:block h-28 md:h-32 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50"></div>;
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
              <div key={index} className={`min-h-[6rem] md:min-h-0 md:h-32 rounded-xl p-3 md:p-2 transition-all flex flex-col relative overflow-hidden ${borderClass} border`}>
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-lg md:text-base font-extrabold text-[var(--text-main)]`}>
                    {dayNum}
                  </span>
                  
                  <div className="flex flex-col items-end text-right">
                    <span className="text-sm md:text-[10px] font-semibold text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-[max(5rem,env(safe-area-inset-bottom))] md:pb-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in" onClick={closeGroupModal}>
          <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-full md:max-h-[80dvh] flex flex-col overflow-hidden border border-slate-200 dark:border-[var(--card-border)]" onClick={e => e.stopPropagation()}>
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-[var(--card-border)] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-[var(--text-main)]">
                ข้อมูลการลาประจำวันที่ {selectedGroup.dateStr.split('-').reverse().join('/')}
              </h2>
              <button onClick={closeGroupModal} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-grow">
              <div className="mb-6 p-4 rounded-xl shadow-sm border border-blue-500/20 bg-blue-500 dark:bg-blue-500/10 dark:border-blue-500/20">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white dark:text-blue-400">{selectedGroup.dept}</h3>
                    <p className="text-sm font-medium text-blue-100 dark:text-blue-300">พนักงานที่ลาทั้งหมด {selectedGroup.reqs.length} รายการ</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                {selectedGroup.reqs.map(req => (
                  <div key={req.id} className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img 
                            src={req.requester?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requester?.fullname || 'U')}&background=0D8ABC&color=fff`} 
                            alt={req.requester?.fullname}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                              {req.id}
                            </span>
                          </div>
                          <h3 className="font-bold text-[var(--text-main)] text-sm mt-0.5">{req.requester ? req.requester.fullname : req.user_id}</h3>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md text-[10px] font-bold">
                          {req.leave_type}
                        </span>
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                      <div className="text-xs text-center">
                        <div className="text-[var(--text-muted)] font-medium mb-1">เริ่มต้น</div>
                        <div className="font-bold text-[var(--text-main)]">{req.date_start ? req.date_start.split('-').reverse().join('-') : ''}</div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex flex-col items-center">
                        <span>{req.leave_duration || '1'} วัน</span>
                        <div className="w-12 h-px bg-slate-300 dark:bg-slate-700 my-1"></div>
                      </div>
                      <div className="text-xs text-center">
                        <div className="text-[var(--text-muted)] font-medium mb-1">สิ้นสุด</div>
                        <div className="font-bold text-[var(--text-main)]">{req.date_end ? req.date_end.split('-').reverse().join('-') : ''}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div className="text-xs text-[var(--text-muted)] truncate flex-1" title={req.description}>
                        <span className="font-bold">เหตุผล: </span>{req.description || 'ไม่ระบุ'}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => openDetailsModal(req)} className="p-2 text-blue-600 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/40 rounded-lg transition-colors" title="ดูรายละเอียด">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Empty Footer for Spacing */}
            <div className="p-4 border-t border-slate-200 dark:border-[var(--card-border)] bg-white dark:bg-[var(--card-bg)] shrink-0 min-h-[72px]"></div>
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
