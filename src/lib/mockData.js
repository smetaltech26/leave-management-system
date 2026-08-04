// Mock Initial Data สำหรับทดสอบและใช้งานในกรณีไม่มี Supabase Connection

export const INITIAL_AGENCIES = [
  { id: 'AG-01', name: 'S Metal Tech' },
  { id: 'AG-02', name: 'KMP Metal' },
];

export const INITIAL_DEPARTMENTS = [
  { id: 'DP-01', name: 'บริหาร / จัดการ' },
  { id: 'DP-02', name: 'เทคโนโลยีสารสนเทศ (IT)' },
  { id: 'DP-03', name: 'ทรัพยากรบุคคล (HR)' },
  { id: 'DP-04', name: 'บัญชีและการเงิน' },
  { id: 'DP-05', name: 'ฝ่ายผลิตและคลังสินค้า' },
];

export const INITIAL_USERS = [
  {
    id: 'USER-001',
    email: 'admin@smetaltech.co.th',
    fullname: 'ผู้ดูแลระบบ (Admin)',
    agency_id: 'AG-01',
    department_id: 'DP-02',
    role: 'Admin',
    approver_step1_id: 'USER-006',
    approver_step2_id: '',
    approver_step3_id: '',
    line_user_id: '',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'USER-006',
    email: 'sompol@smetaltech.co.th',
    fullname: 'คุณสมพล (ผู้จัดการฝ่าย)',
    agency_id: 'AG-01',
    department_id: 'DP-01',
    role: 'Manager',
    approver_step1_id: '',
    approver_step2_id: '',
    approver_step3_id: '',
    line_user_id: 'U1234567890abcdef1234567890abcdef', // Mock Line User ID
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'USER-008',
    email: 'anuson26051993@gmail.com',
    fullname: 'คุณอนุสรณ์ (พนักงาน)',
    agency_id: 'AG-01',
    department_id: 'DP-05',
    role: 'Employee',
    approver_step1_id: 'USER-006',
    approver_step2_id: 'USER-001',
    approver_step3_id: '',
    line_user_id: '',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  }
];

export const INITIAL_USER_POLICIES = [
  { id: 'pol-1', user_id: 'USER-008', leave_type: 'Annual', max_days: 6, used_days: 1, year: 2026 },
  { id: 'pol-2', user_id: 'USER-008', leave_type: 'Sick', max_days: 30, used_days: 2, year: 2026 },
  { id: 'pol-3', user_id: 'USER-008', leave_type: 'Personal', max_days: 6, used_days: 0, year: 2026 },
  { id: 'pol-4', user_id: 'USER-001', leave_type: 'Annual', max_days: 10, used_days: 2, year: 2026 },
  { id: 'pol-5', user_id: 'USER-001', leave_type: 'Sick', max_days: 30, used_days: 0, year: 2026 },
  { id: 'pol-6', user_id: 'USER-006', leave_type: 'Annual', max_days: 15, used_days: 3, year: 2026 },
];

export const INITIAL_REQUESTS = [
  {
    id: 'LEV-0001',
    user_id: 'USER-008',
    leave_type: 'Annual',
    description: 'พักผ่อนท่องเที่ยวต่างจังหวัดกับครอบครัว',
    date_start: '2026-08-10',
    date_end: '2026-08-10',
    leave_duration: 1,
    status: 'Pending',
    current_step: 1,
    total_steps: 2,
    created_at: '2026-08-04T08:00:00Z',
    approvers: [
      { step_id: 'LEV-0001-STEP1', step_number: 1, approver_id: 'USER-006', approver_name: 'คุณสมพล (ผู้จัดการฝ่าย)', status: 'Pending', comment: '' },
      { step_id: 'LEV-0001-STEP2', step_number: 2, approver_id: 'USER-001', approver_name: 'ผู้ดูแลระบบ (Admin)', status: 'Pending', comment: '' }
    ],
    attachments: [
      { id: 'FILE-0001', file_name: 'ใบขอลาพักร้อน.jpg', file_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&auto=format&fit=crop&q=80' }
    ]
  }
];

export const INITIAL_HOLIDAYS = [
  { id: 'h1', date: '2026-01-01', title: 'วันขึ้นปีใหม่', year: 2026 },
  { id: 'h2', date: '2026-04-13', title: 'วันสงกรานต์', year: 2026 },
  { id: 'h3', date: '2026-04-14', title: 'วันสงกรานต์', year: 2026 },
  { id: 'h4', date: '2026-04-15', title: 'วันสงกรานต์', year: 2026 },
  { id: 'h5', date: '2026-05-01', title: 'วันแรงงานแห่งชาติ', year: 2026 },
  { id: 'h6', date: '2026-07-28', title: 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว', year: 2026 },
  { id: 'h7', date: '2026-08-12', title: 'วันแม่แห่งชาติ', year: 2026 },
  { id: 'h8', date: '2026-12-05', title: 'วันพ่อแห่งชาติ', year: 2026 },
  { id: 'h9', date: '2026-12-31', title: 'วันสิ้นปี', year: 2026 },
];
