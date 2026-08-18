const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Business days calculation
function getBusinessDays(startDate, endDate) {
  let count = 0;
  let curDate = new Date(startDate);
  curDate.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(0,0,0,0);
  
  if (end < curDate) return 0;

  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    // 0 = Sunday. We now consider Saturday (6) as a working day by default.
    if (dayOfWeek !== 0) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

// Convert Excel dates to YYYY-MM-DD
function formatExcelDate(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'number') {
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }
    const d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  const parts = dateVal.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return null;
}

const leaveTypeMap = {
  'Annual': 'ลาพักร้อน',
  'Sick': 'ลาป่วย',
  'Personal': 'ลากิจได้รับค่าจ้าง',
  'Other': 'ลาอื่นๆ',
  'Maternity': 'ลาคลอด',
  'Military': 'ลาทหาร'
};

async function runImport() {
  console.log("Reading Data.xlsx...");
  const workbook = xlsx.readFile('Data.xlsx');
  
  // 1. Process Leave Requests
  const reqSheet = workbook.Sheets['LeaveRequests'];
  const reqData = xlsx.utils.sheet_to_json(reqSheet, { header: 1 });
  
  console.log(`Found ${reqData.length - 1} leave requests to process...`);
  
  const requestsToUpsert = [];
  
  // Skip header (row 0)
  for (let i = 1; i < reqData.length; i++) {
    const row = reqData[i];
    if (!row[0]) continue; // skip if no ID
    
    const id = row[0];
    const description = row[1] || '';
    const dateStart = formatExcelDate(row[2]);
    const dateEnd = formatExcelDate(row[3]);
    const userId = row[4];
    const engType = row[6] || 'Annual';
    const leaveType = leaveTypeMap[engType] || engType; // Map to Thai
    const status = row[7] || 'Pending';
    let currentStep = parseInt(row[8]) || 1;
    const rejectReason = row[9] || '';
    const createdAt = formatExcelDate(row[10]) || dateStart;
    const updatedAt = formatExcelDate(row[11]) || createdAt;
    const periodCode = row[12]; // F, AM, PM
    
    let leavePeriod = 'Full';
    if (periodCode === 'AM') leavePeriod = 'Morning';
    if (periodCode === 'PM') leavePeriod = 'Afternoon';
    
    // Calculate leave duration
    let duration = 0;
    if (dateStart && dateEnd) {
      duration = getBusinessDays(dateStart, dateEnd);
      if (duration > 0 && dateStart === dateEnd && leavePeriod !== 'Full') {
        duration = 0.5;
      }
    }
    
    requestsToUpsert.push({
      id,
      user_id: userId,
      leave_type: leaveType,
      description,
      date_start: dateStart,
      date_end: dateEnd,
      leave_duration: duration,
      leave_period: leavePeriod,
      status,
      current_step: currentStep,
      total_steps: 1, // Will update later if needed, but defaults to 1
      reject_reason: rejectReason,
      created_at: new Date(createdAt).toISOString(),
      updated_at: new Date(updatedAt).toISOString()
    });
  }
  
  // Upsert Leave Requests
  console.log(`Upserting ${requestsToUpsert.length} leave requests...`);
  for (let i = 0; i < requestsToUpsert.length; i += 50) {
    const chunk = requestsToUpsert.slice(i, i + 50);
    const { error } = await supabase.from('leave_requests').upsert(chunk);
    if (error) {
      console.error("Error upserting leave requests:", error);
    }
  }
  
  // 2. Process Approval Steps
  const stepSheet = workbook.Sheets['ApprovalSteps'];
  const stepData = xlsx.utils.sheet_to_json(stepSheet, { header: 1 });
  
  console.log(`Found ${stepData.length - 1} approval steps to process...`);
  
  const stepsToUpsert = [];
  const requestTotalSteps = {}; // to track total steps per request
  
  for (let i = 1; i < stepData.length; i++) {
    const row = stepData[i];
    if (!row[0]) continue; // skip if no ID
    
    const id = row[0];
    const requestId = row[1];
    const stepNumber = parseInt(row[2]) || 1;
    const approverId = row[3];
    const actionDate = formatExcelDate(row[5]); // approvedAt
    const status = row[6] || 'Pending';
    const comment = row[7] || '';
    
    // Update max step per request
    if (!requestTotalSteps[requestId] || stepNumber > requestTotalSteps[requestId]) {
      requestTotalSteps[requestId] = stepNumber;
    }
    
    stepsToUpsert.push({
      id,
      request_id: requestId,
      step_number: stepNumber,
      approver_id: approverId,
      status,
      comment,
      action_date: actionDate ? new Date(actionDate).toISOString() : null,
      created_at: new Date().toISOString()
    });
  }
  
  // Upsert Approval Steps
  console.log(`Upserting ${stepsToUpsert.length} approval steps...`);
  for (let i = 0; i < stepsToUpsert.length; i += 50) {
    const chunk = stepsToUpsert.slice(i, i + 50);
    const { error } = await supabase.from('approval_steps').upsert(chunk);
    if (error) {
      console.error("Error upserting approval steps:", error);
    }
  }
  
  // Update total_steps in leave_requests
  console.log("Updating total_steps in leave_requests...");
  for (const [reqId, totalSteps] of Object.entries(requestTotalSteps)) {
    await supabase.from('leave_requests').update({ total_steps: totalSteps }).eq('id', reqId);
  }
  
  // 3. Recalculate Quotas for 2026
  console.log("Recalculating quotas (used_days) for 2026...");
  
  // Reset all used_days to 0 for 2026
  console.log("Resetting all used_days to 0...");
  await supabase.from('user_policies').update({ used_days: 0 }).eq('year', 2026);
  
  // Fetch all user policies for 2026
  const { data: policies, error: polErr } = await supabase.from('user_policies').select('*').eq('year', 2026);
  if (polErr) {
    console.error("Error fetching user policies:", polErr);
    return;
  }
  
  console.log(`Found ${policies.length} user policies for 2026.`);
  
  // Fetch all valid requests
  const { data: validRequests, error: reqErr } = await supabase.from('leave_requests')
    .select('user_id, leave_type, leave_duration')
    .in('status', ['Approved', 'Pending']);
    
  if (reqErr) {
    console.error("Error fetching valid requests:", reqErr);
    return;
  }
  
  console.log(`Found ${validRequests.length} approved/pending requests to tally.`);
  
  // Aggregate used days
  const usedDaysMap = {}; // key: `${userId}_${leaveType}`
  for (const r of validRequests) {
    const key = `${r.user_id}_${r.leave_type}`;
    if (!usedDaysMap[key]) usedDaysMap[key] = 0;
    usedDaysMap[key] += Number(r.leave_duration);
  }
  
  // Update policies
  console.log("Updating user policies with recalculated used_days...");
  for (const p of policies) {
    const key = `${p.user_id}_${p.leave_type}`;
    const calculatedUsed = usedDaysMap[key] || 0;
    
    if (Number(p.used_days) !== calculatedUsed) {
      await supabase.from('user_policies')
        .update({ used_days: calculatedUsed })
        .eq('id', p.id);
    }
  }
  
  console.log("Data import and quota recalculation completed successfully!");
}

runImport().catch(console.error);
