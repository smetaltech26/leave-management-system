import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export default function LeaveCalendar({ requests, holidays, users }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 7, 1)); // สิงหาคม 2026

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // สร้างอาร์เรย์วัน
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const formatDateStr = (dayNum) => {
    if (!dayNum) return '';
    const m = (month + 1).toString().padStart(2, '0');
    const d = dayNum.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>ปฏิทินแสดงการลางาน</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">ตารางภาพรวมการลางานของพนักงาน และวันหยุดประจำปี {year}</p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center space-x-3 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button onClick={prevMonth} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-white px-2">
            {monthNames[month]} {year + 543}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card rounded-3xl p-4 md:p-6 border border-slate-800 overflow-hidden shadow-2xl">
        
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {daysOfWeek.map((day, idx) => (
            <div key={idx} className={`py-2 text-xs font-bold ${idx === 0 || idx === 6 ? 'text-rose-400' : 'text-slate-400'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((dayNum, index) => {
            if (!dayNum) {
              return <div key={index} className="h-24 md:h-28 rounded-2xl bg-slate-950/20 border border-transparent"></div>;
            }

            const dateStr = formatDateStr(dayNum);
            const holiday = holidays.find(h => h.date === dateStr);
            const leaveToday = requests.filter(r => r.status === 'Approved' && dateStr >= r.date_start && dateStr <= r.date_end);

            const isWeekend = (index % 7 === 0) || (index % 7 === 6);

            return (
              <div
                key={index}
                className={`h-24 md:h-28 rounded-2xl p-2 border transition-all flex flex-col justify-between overflow-hidden ${
                  holiday
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : isWeekend
                    ? 'bg-slate-900/40 border-slate-800/60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${holiday || isWeekend ? 'text-rose-400' : 'text-slate-200'}`}>
                    {dayNum}
                  </span>
                  {holiday && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-rose-500/20 text-rose-300 rounded font-semibold truncate max-w-[70px]">
                      {holiday.title}
                    </span>
                  )}
                </div>

                {/* Leaves List for this day */}
                <div className="space-y-1 overflow-y-auto max-h-16">
                  {leaveToday.map(r => {
                    const requester = users.find(u => u.id === r.user_id);
                    return (
                      <div
                        key={r.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium truncate"
                        title={`${requester?.fullname}: ${r.leave_type}`}
                      >
                        🌴 {requester?.fullname || r.user_id}
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
