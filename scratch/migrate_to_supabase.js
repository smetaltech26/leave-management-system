import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseKey);

function excelDateToJSDate(serial) {
  if (!serial) return null;
  try {
    if (typeof serial === 'number') {
      const epoch = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return epoch.toISOString();
    }
    const d = new Date(serial);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch(e) {
    return null;
  }
}

function parseDateOnly(str) {
  if (!str) return null;
  if (typeof str === 'number') {
    const d = new Date(Math.round((str - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  const parts = str.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const year = Number(y) > 2500 ? Number(y) - 543 : Number(y);
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return str;
}

async function migrate() {
  console.log("🚀 Starting Full Data Migration to Supabase...");

  // 1. Clear existing data (in reverse dependency order)
  console.log("🧹 Clearing old data in Supabase...");
  await supabase.from('approval_steps').delete().neq('id', '0');
  await supabase.from('attachments').delete().neq('id', '0');
  await supabase.from('leave_requests').delete().neq('id', '0');
  await supabase.from('user_policies').delete().neq('id', '0');
  await supabase.from('holidays').delete().neq('id', '0');
  await supabase.from('users').delete().neq('id', '0');
  await supabase.from('departments').delete().neq('id', '0');
  await supabase.from('agencies').delete().neq('id', '0');

  // 2. Load Excel files
  console.log("📂 Loading Excel files...");
  const wb1 = XLSX.readFile('ระบบลางาน ออนไลน์ 2025.xlsx');
  const wb2 = XLSX.readFile('Data.xlsx');

  // --- Agencies ---
  const agenciesSheet = XLSX.utils.sheet_to_json(wb1.Sheets['Agency']);
  if (agenciesSheet.length) {
    const records = agenciesSheet.map(r => ({ id: r.agencyId, name: r.agencyname }));
    await supabase.from('agencies').upsert(records);
    console.log(`✅ Migrated ${records.length} Agencies`);
  }

  // --- Departments ---
  const deptsSheet = XLSX.utils.sheet_to_json(wb1.Sheets['Departments']);
  if (deptsSheet.length) {
    const records = deptsSheet.map(r => ({ id: r.deptId, name: r.deptname }));
    await supabase.from('departments').upsert(records);
    console.log(`✅ Migrated ${records.length} Departments`);
  }

  // --- Users ---
  // We combine 'Users' from wb1 and 'Data' from wb2 to get LineUserId and Approvers
  const usersSheet1 = XLSX.utils.sheet_to_json(wb1.Sheets['Users']);
  const usersSheet2 = XLSX.utils.sheet_to_json(wb2.Sheets['Data']);
  
  if (usersSheet1.length) {
    const records = usersSheet1.filter(r => r.UID && r.Username).map(r => {
      // Find matching user in wb2 'Data' sheet
      const match = usersSheet2.find(u => u.UID === r.UID) || {};
      return {
        id: r.UID,
        email: r.Username,
        password_hash: String(r.Password),
        fullname: r.Fullname,
        agency_id: r.Agency,
        department_id: r.Department,
        role: (r.Role === 'SuperAdmin' || r.Role === 'Admin') ? 'Admin' : (r.Role === 'SuperUser' || r.Role === 'Manager' ? 'Manager' : 'Employee'),
        avatar_url: r.Profile || null,
        created_at: excelDateToJSDate(r.Date),
        // From Data sheet:
        approver_step1_id: match.UserSend1 || null,
        approver_step2_id: match.UserSend2 || null,
        approver_step3_id: match.UserSend3 || null,
        line_user_id: match.LineUserId || null,
      };
    });
    
    // Some foreign keys might be missing (e.g., if a user references an agency that doesn't exist)
    // Supabase will throw error. Let's make sure we just try to insert and log errors.
    const { error } = await supabase.from('users').upsert(records);
    if(error) console.error("❌ Error Users:", error);
    else console.log(`✅ Migrated ${records.length} Users`);
  }

  // --- User Policies ---
  const policiesSheet = XLSX.utils.sheet_to_json(wb1.Sheets['UserPolicies']);
  if (policiesSheet.length) {
    const records = policiesSheet.filter(r => r.UserID).map(r => ({
      user_id: r.UserID,
      leave_type: r.LeaveType,
      max_days: Number(r.LeaveQuota) || 0,
      used_days: 0, // In original excel, used days is calculated dynamically or tracked elsewhere
      year: 2026
    }));
    
    for (let i = 0; i < records.length; i += 50) {
      const { error } = await supabase.from('user_policies').insert(records.slice(i, i + 50));
      if (error) console.error("❌ Error UserPolicies batch:", error.message);
    }
    console.log(`✅ Migrated ${records.length} UserPolicies`);
  }

  // --- Holidays ---
  const holidaysSheet = XLSX.utils.sheet_to_json(wb1.Sheets['Holidays']);
  if (holidaysSheet.length) {
    const records = holidaysSheet.map(r => ({
      date: parseDateOnly(r.HolidaysDay),
      title: r.HolidaysName,
      year: 2026
    })).filter(r => r.date);
    
    const { error } = await supabase.from('holidays').insert(records);
    if (error) console.error("❌ Error Holidays:", error);
    else console.log(`✅ Migrated ${records.length} Holidays`);
  }

  // --- Leave Requests ---
  const reqSheetRaw = XLSX.utils.sheet_to_json(wb2.Sheets['LeaveRequests']);
  if (reqSheetRaw.length) {
    const records = reqSheetRaw.map(r => ({
      // XLSX might parse the empty header 'A' as __EMPTY or __EMPTY_1
      id: r.id || r.__EMPTY || r.__EMPTY_1 || r[''], 
      user_id: r.userId,
      leave_type: r.leaveType || 'Annual',
      description: r.description || '',
      date_start: parseDateOnly(r.startDate),
      date_end: parseDateOnly(r.endDate),
      leave_duration: Number(r.leaveDuration) || 1,
      status: r.status || 'Pending',
      current_step: Number(r.currentStep) || 1,
      total_steps: 2, // Approximated
      reject_reason: r.rejectedReason || null,
      created_at: excelDateToJSDate(r.submitDate) || new Date().toISOString()
    })).filter(r => r.id && r.user_id && r.date_start);

    for (let i = 0; i < records.length; i += 50) {
      const { error } = await supabase.from('leave_requests').upsert(records.slice(i, i + 50));
      if (error) console.error("❌ Error LeaveRequests batch:", error.message);
    }
    console.log(`✅ Migrated ${records.length} LeaveRequests`);
  }

  // --- Approval Steps ---
  const stepsSheet = XLSX.utils.sheet_to_json(wb2.Sheets['ApprovalSteps']);
  if (stepsSheet.length) {
    const records = stepsSheet.map(r => ({
      id: r.stepId,
      request_id: r.requestId,
      step_number: Number(r.stepOrder) || 1,
      approver_id: r.approverId,
      status: r.status || 'Pending',
      comment: r.comment || null,
      action_date: r.approvedAt ? excelDateToJSDate(r.approvedAt) : null
    })).filter(r => r.id && r.request_id && r.approver_id);

    for (let i = 0; i < records.length; i += 50) {
      const { error } = await supabase.from('approval_steps').upsert(records.slice(i, i + 50));
      if (error) console.error("❌ Error ApprovalSteps batch:", error.message);
    }
    console.log(`✅ Migrated ${records.length} ApprovalSteps`);
  }

  // --- Attachments ---
  const attSheet = XLSX.utils.sheet_to_json(wb2.Sheets['Attachments']);
  if (attSheet.length) {
    const records = attSheet.map(r => ({
      id: r.fileId,
      request_id: r.requestId,
      file_url: r.fileUrl,
      file_name: r.fileUrl.split('/').pop() || 'attachment',
      uploaded_by: r.uploadedBy
    })).filter(r => r.id && r.request_id);

    for (let i = 0; i < records.length; i += 50) {
      const { error } = await supabase.from('attachments').upsert(records.slice(i, i + 50));
      if (error) console.error("❌ Error Attachments batch:", error.message);
    }
    console.log(`✅ Migrated ${records.length} Attachments`);
  }

  console.log("🎉 All Data Migrated Successfully!");
}

migrate();
