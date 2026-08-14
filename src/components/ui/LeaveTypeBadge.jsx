import React from 'react';
import { 
  Luggage, 
  HeartPulse, 
  Briefcase, 
  FileMinus, 
  Calendar, 
  Baby, 
  Shield, 
  GraduationCap, 
  Sparkles, 
  Heart,
  UserX,
  AlertCircle
} from 'lucide-react';

/**
 * ดึง Meta และ Icon ที่เหมาะสมกับชื่อประเภทการลา
 */
export const getLeaveTypeMeta = (type = '') => {
  const t = (type || '').toLowerCase().trim();
  
  if (t.includes('ขาดงาน') || t.includes('ขาด') || t.includes('absent')) {
    return {
      name: type || 'ขาดงาน',
      icon: UserX,
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20',
      bar: 'from-rose-500 to-red-600'
    };
  }
  
  if (t.includes('พักร้อน') || t.includes('annual') || t.includes('vacation')) {
    return {
      name: type || 'ลาพักร้อน',
      icon: Luggage,
      iconColor: 'text-amber-500 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20',
      bar: 'from-amber-500 to-orange-500'
    };
  }
  
  if (t.includes('ป่วย') || t.includes('sick') || t.includes('หมอ')) {
    return {
      name: type || 'ลาป่วย',
      icon: HeartPulse,
      iconColor: 'text-rose-500 dark:text-rose-400',
      iconBg: 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20',
      bar: 'from-rose-500 to-pink-500'
    };
  }
  
  if (t.includes('ไม่ได้รับค่าจ้าง') || t.includes('unpaid') || t.includes('ไม่มีค่าจ้าง')) {
    return {
      name: type || 'ลากิจไม่ได้รับค่าจ้าง',
      icon: FileMinus,
      iconColor: 'text-slate-500 dark:text-slate-400',
      iconBg: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
      bar: 'from-slate-500 to-gray-500'
    };
  }
  
  if (t.includes('ลากิจ') || t.includes('personal') || t.includes('ธุรกิจ')) {
    return {
      name: type || 'ลากิจได้รับค่าจ้าง',
      icon: Briefcase,
      iconColor: 'text-blue-500 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20',
      bar: 'from-blue-500 to-cyan-500'
    };
  }
  
  if (t.includes('คลอด') || t.includes('maternity')) {
    return {
      name: type || 'ลาคลอด',
      icon: Baby,
      iconColor: 'text-pink-500 dark:text-pink-400',
      iconBg: 'bg-pink-50 dark:bg-pink-500/10 border border-pink-200/60 dark:border-pink-500/20',
      bar: 'from-pink-500 to-rose-400'
    };
  }
  
  if (t.includes('ทหาร') || t.includes('military')) {
    return {
      name: type || 'ลาทหาร',
      icon: Shield,
      iconColor: 'text-sky-500 dark:text-sky-400',
      iconBg: 'bg-sky-50 dark:bg-sky-500/10 border border-sky-200/60 dark:border-sky-500/20',
      bar: 'from-sky-500 to-blue-600'
    };
  }
  
  if (t.includes('ศึกษา') || t.includes('อบรม') || t.includes('study') || t.includes('train') || t.includes('เรียน')) {
    return {
      name: type || 'ลาศึกษา/อบรม',
      icon: GraduationCap,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20',
      bar: 'from-indigo-500 to-purple-500'
    };
  }
  
  if (t.includes('หมัน')) {
    return {
      name: type || 'ลาทำหมัน',
      icon: Sparkles,
      iconColor: 'text-teal-500 dark:text-teal-400',
      iconBg: 'bg-teal-50 dark:bg-teal-500/10 border border-teal-200/60 dark:border-teal-500/20',
      bar: 'from-teal-500 to-emerald-500'
    };
  }
  
  if (t.includes('ศพ') || t.includes('ฌาปนกิจ')) {
    return {
      name: type || 'ลาฌาปนกิจ',
      icon: Heart,
      iconColor: 'text-slate-600 dark:text-slate-400',
      iconBg: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
      bar: 'from-slate-600 to-slate-700'
    };
  }

  // ค่าปริยาย หรือ ลาอื่นๆ
  return {
    name: type || 'ลาอื่นๆ',
    icon: Calendar,
    iconColor: 'text-purple-500 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-500/10 border border-purple-200/60 dark:border-purple-500/20',
    bar: 'from-purple-500 to-indigo-500'
  };
};

export default function LeaveTypeBadge({ type, className = '', showIcon = true, size = 'md' }) {
  const meta = getLeaveTypeMeta(type);
  const Icon = meta.icon;

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  const containerSizes = {
    sm: 'w-5 h-5 rounded-md',
    md: 'w-6 h-6 rounded-lg',
    lg: 'w-7 h-7 rounded-lg'
  };

  const textSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showIcon && (
        <div className={`${containerSizes[size] || containerSizes.md} flex items-center justify-center shrink-0 ${meta.iconBg}`}>
          <Icon className={`${iconSizes[size] || iconSizes.md} ${meta.iconColor}`} />
        </div>
      )}
      <span className={`font-semibold text-slate-800 dark:text-slate-200 ${textSizes[size] || textSizes.md}`}>
        {type || meta.name}
      </span>
    </div>
  );
}
