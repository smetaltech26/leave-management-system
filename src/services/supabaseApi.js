import { supabase } from '../lib/supabase';

// ==========================================
// 1. Fetching Data (Get All)
// ==========================================

export const fetchAllUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
};

export const fetchAllAgencies = async () => {
  const { data, error } = await supabase.from('agencies').select('*');
  if (error) throw error;
  return data || [];
};

export const fetchAllDepartments = async () => {
  const { data, error } = await supabase.from('departments').select('*');
  if (error) throw error;
  return data || [];
};

export const fetchAllUserPolicies = async () => {
  const { data, error } = await supabase.from('user_policies').select('*');
  if (error) throw error;
  return data || [];
};

export const fetchAllRequests = async () => {
  // We need to fetch requests along with their approval steps and attachments
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      approvers:approval_steps(*),
      attachments:attachments(*)
    `)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  // Format the returned data to match the existing state structure
  return (data || []).map(req => ({
    ...req,
    approvers: req.approvers || [],
    attachments: req.attachments || []
  }));
};

export const fetchAllHolidays = async () => {
  const { data, error } = await supabase.from('holidays').select('*');
  if (error) throw error;
  return data || [];
};

export const fetchAllPermissions = async () => {
  const { data, error } = await supabase.from('role_permissions').select('*');
  if (error) throw error;
  
  // Format to match old permissions.json structure for easier integration
  return (data || []).map(p => ({
      MenuItems: p.id,
    'เมนู': p.menu_name,
    SuperAdmin: p.SuperAdmin,
    Admin: p.Admin,
    SuperUser: p.SuperUser,
    User: p.User
  }));
};

// ==========================================
// 2. Leave Requests Management
// ==========================================

export const createLeaveRequest = async (requestData, approvers, attachments) => {
  // 1. Insert Request
  const { data: reqData, error: reqError } = await supabase
    .from('leave_requests')
    .insert([{
      id: requestData.id,
      user_id: requestData.user_id,
      leave_type: requestData.leave_type,
      description: requestData.description,
      date_start: requestData.date_start,
      date_end: requestData.date_end,
      leave_duration: requestData.leave_duration,
      leave_period: requestData.leave_period || 'Full',
      total_steps: requestData.total_steps,
      current_step: 1,
      status: 'Pending'
    }])
    .select()
    .single();

  if (reqError) throw reqError;

  // 2. Insert Approvers
  if (approvers && approvers.length > 0) {
    const approversToInsert = approvers.map(a => ({
      id: a.step_id,
      request_id: requestData.id,
      step_number: a.step_number,
      approver_id: a.approver_id,
      status: 'Pending'
    }));
    const { error: appError } = await supabase.from('approval_steps').insert(approversToInsert);
    if (appError) throw appError;
  }

  // 3. Insert Attachments
  if (attachments && attachments.length > 0) {
    const attToInsert = attachments.map(att => ({
      id: att.id,
      request_id: requestData.id,
      file_url: att.file_url,
      file_name: att.file_name,
      uploaded_by: requestData.user_id
    }));
    const { error: attError } = await supabase.from('attachments').insert(attToInsert);
    if (attError) throw attError;
  }

  // Refetch the completely formed request to return
  const { data: newReq, error: fetchError } = await supabase
    .from('leave_requests')
    .select(`*, approvers:approval_steps(*), attachments:attachments(*)`)
    .eq('id', requestData.id)
    .single();

  if (fetchError) throw fetchError;
  return newReq;
};

export const updateLeaveRequest = async (updatedReqData) => {
  const { id, description, date_start, date_end, leave_duration, leave_type } = updatedReqData;
  const { error } = await supabase
    .from('leave_requests')
    .update({ description, date_start, date_end, leave_duration, leave_type })
    .eq('id', id);
    
  if (error) throw error;
};

export const deleteLeaveRequest = async (requestId) => {
  // Cascading deletes will handle approval_steps and attachments
  const { error } = await supabase.from('leave_requests').delete().eq('id', requestId);
  if (error) throw error;
};

// ==========================================
// 3. Approval Workflow
// ==========================================

export const approveStep = async (requestId, stepNumber, comment, isFinalStep) => {
  // 1. Update the approval step
  const { error: stepError } = await supabase
    .from('approval_steps')
    .update({ status: 'Approved', comment, action_date: new Date().toISOString() })
    .eq('request_id', requestId)
    .eq('step_number', stepNumber);
    
  if (stepError) throw stepError;

  // 2. Update the main request
  const reqUpdate = {
    current_step: isFinalStep ? stepNumber : stepNumber + 1,
    status: isFinalStep ? 'Approved' : 'Pending'
  };
  
  const { error: reqError } = await supabase
    .from('leave_requests')
    .update(reqUpdate)
    .eq('id', requestId);
    
  if (reqError) throw reqError;
};

export const rejectStep = async (requestId, stepNumber, comment) => {
  // 1. Update the approval step
  const { error: stepError } = await supabase
    .from('approval_steps')
    .update({ status: 'Rejected', comment, action_date: new Date().toISOString() })
    .eq('request_id', requestId)
    .gte('step_number', stepNumber);
    
  if (stepError) throw stepError;

  // 2. Update the main request
  const { error: reqError } = await supabase
    .from('leave_requests')
    .update({ status: 'Rejected', reject_reason: comment })
    .eq('id', requestId);
    
  if (reqError) throw reqError;
};

// ==========================================
// 4. User Policies (Quotas)
// ==========================================

export const updateUserPolicyUsedDays = async (userId, leaveType, diffAmount) => {
  // Fetch current policy
  const { data: policy, error: fetchError } = await supabase
    .from('user_policies')
    .select('*')
    .eq('user_id', userId)
    .eq('leave_type', leaveType)
    .eq('year', new Date().getFullYear())
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
     throw fetchError;
  }
  
  if (policy) {
    const newUsed = Number(policy.used_days) + Number(diffAmount);
    const { error: updateError } = await supabase
      .from('user_policies')
      .update({ used_days: newUsed })
      .eq('id', policy.id);
      
    if (updateError) throw updateError;
  } else if (diffAmount > 0) {
    // If no policy exists for some reason, and we are adding used days (which implies they are requesting leave)
    // we might need to insert one. (In a real app, HR sets policies first. For now, we'll let it fail or handle it.)
    console.warn("No user policy found to update for:", userId, leaveType);
  }
};

// ==========================================
// 5. Users
// ==========================================

export const updateUserProfile = async (userId, updateData) => {
  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);
    
  if (error) throw error;
};

// ==========================================
// 6. Permissions
// ==========================================

export const updateRolePermissions = async (permissions) => {
  // Convert back to DB format
  const records = permissions.map(p => ({
    id: p.MenuItems,
    menu_name: p['เมนู'],
    "SuperAdmin": p.SuperAdmin,
    "Admin": p.Admin,
    "SuperUser": p.SuperUser,
    "User": p.User
  }));
  
  const { error } = await supabase.from('role_permissions').upsert(records);
  if (error) throw error;
};

// ==========================================
// 8. Admin Leave Modifications
// ==========================================
export const adminUpdateLeaveRequest = async (requestId, payload) => {
  const { error } = await supabase
    .from('leave_requests')
    .update(payload)
    .eq('id', requestId);
    
  if (error) throw error;
};

export const adminResetApprovalSteps = async (requestId) => {
  const { error } = await supabase
    .from('approval_steps')
    .update({ status: 'Pending', comment: '', action_date: null })
    .eq('request_id', requestId);
    
  if (error) throw error;
};
