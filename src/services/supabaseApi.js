import { supabase } from '../lib/supabase';

// ==========================================
// 1. Fetching Data (Get All)
// ==========================================

export const fetchAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, fullname, agency_id, department_id, role, approver_step1_id, approver_step2_id, approver_step3_id, line_user_id, avatar_url, employee_id, created_at, auth_id');
  if (error) throw error;
  return (data || []).sort((a, b) => {
    const numA = parseInt((a.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    const numB = parseInt((b.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    if (numA !== numB) return numA - numB;
    return (a.id || '').localeCompare(b.id || '');
  });
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

export const fetchAllLeaveTypes = async () => {
  const { data, error } = await supabase.from('leave_types').select('*').order('created_at', { ascending: true });
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
  // Always query the next global LEV ID from the database to avoid duplicate key conflicts
  let targetId = requestData.id;
  try {
    const { data: generatedId, error: rpcErr } = await supabase.rpc('get_next_leave_request_id');
    if (!rpcErr && generatedId) {
      targetId = generatedId;
    }
  } catch (e) {
    console.warn("Could not fetch generated ID via RPC, using targetId:", targetId, e);
  }

  // 1. Insert Request
  const { data: reqData, error: reqError } = await supabase
    .from('leave_requests')
    .insert([{
      id: targetId,
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
    const approversToInsert = approvers.map((a, idx) => ({
      id: `${targetId}-STEP${a.step_number || (idx + 1)}`,
      request_id: targetId,
      step_number: a.step_number || (idx + 1),
      approver_id: a.approver_id,
      status: 'Pending'
    }));
    const { error: appError } = await supabase.from('approval_steps').insert(approversToInsert);
    if (appError) throw appError;
  }

  // 3. Insert Attachments
  if (attachments && attachments.length > 0) {
    const attToInsert = [];
    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      let finalFileUrl = att.file_url;
      const attId = `${targetId}-ATT-${i + 1}`;
      
      // Upload to Supabase Storage if there's a raw file
      if (att.raw_file) {
        const fileExt = att.raw_file.name.split('.').pop() || 'png';
        const filePath = `${targetId}/${attId}.${fileExt}`;
        
        // We assume 'attachments' bucket exists and is public
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, att.raw_file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (!uploadError) {
          const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
          finalFileUrl = data.publicUrl;
        } else {
          console.error("Upload file error:", uploadError);
        }
      }

      attToInsert.push({
        id: attId,
        request_id: targetId,
        file_url: finalFileUrl,
        file_name: att.file_name,
        uploaded_by: requestData.user_id
      });
    }

    const { error: attError } = await supabase.from('attachments').insert(attToInsert);
    if (attError) throw attError;
  }

  // Refetch the completely formed request to return
  const { data: newReq, error: fetchError } = await supabase
    .from('leave_requests')
    .select(`*, approvers:approval_steps(*), attachments:attachments(*)`)
    .eq('id', targetId)
    .single();

  if (fetchError) throw fetchError;
  return newReq;
};

export const updateLeaveRequest = async (updatedReqData) => {
  const { id, description, date_start, date_end, leave_duration, leave_type, attachments, user_id } = updatedReqData;
  const { error } = await supabase
    .from('leave_requests')
    .update({ description, date_start, date_end, leave_duration, leave_type })
    .eq('id', id);
    
  if (error) throw error;

  // จัดการอัปโหลดไฟล์แนบใหม่ (กรณีแก้ไขใบลาแล้วแนบไฟล์เพิ่ม)
  if (attachments && Array.isArray(attachments)) {
    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (att.raw_file) {
        const fileExt = att.raw_file.name.split('.').pop() || 'jpg';
        const attId = `${id}-ATT-${Date.now()}`;
        const filePath = `${id}/${attId}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, att.raw_file, {
            cacheControl: '3600',
            upsert: true
          });
          
        let finalFileUrl = att.file_url;
        if (!uploadError) {
          const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
          finalFileUrl = data.publicUrl;
        }

        await supabase.from('attachments').insert([{
          id: attId,
          request_id: id,
          file_url: finalFileUrl,
          file_name: att.file_name,
          uploaded_by: user_id || updatedReqData.user_id
        }]);
      }
    }
  }
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

export const createUserPolicy = async (policyData) => {
  const currentYear = new Date().getFullYear();
  const payload = {
    user_id: policyData.user_id,
    leave_type: policyData.leave_type,
    max_days: Number(policyData.max_days) || 0,
    used_days: Number(policyData.used_days) || 0,
    year: Number(policyData.year) || currentYear
  };
  
  const { data, error } = await supabase
    .from('user_policies')
    .upsert([payload], { onConflict: 'user_id,leave_type,year' })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const updateUserPolicy = async (id, policyData) => {
  const payload = {
    user_id: policyData.user_id,
    leave_type: policyData.leave_type,
    max_days: Number(policyData.max_days) || 0,
    used_days: Number(policyData.used_days) || 0
  };
  if (policyData.year) {
    payload.year = Number(policyData.year);
  }
  
  const { data, error } = await supabase
    .from('user_policies')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteUserPolicy = async (id) => {
  const { error } = await supabase
    .from('user_policies')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
};

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

export const adminCreateUser = async (userData) => {
  const { data, error } = await supabase.rpc('admin_create_user_account', {
    p_id: userData.id,
    p_fullname: userData.fullname,
    p_email: userData.email,
    p_password: userData.password || '',
    p_agency_id: userData.agency_id || null,
    p_department_id: userData.department_id || null,
    p_role: userData.role || 'Employee',
    p_employee_id: userData.employee_id || null,
    p_line_user_id: userData.line_user_id || null,
    p_avatar_url: userData.avatar_url || null
  });

  if (error) throw error;
  return data;
};

export const adminUpdateUser = async (userData) => {
  const { data, error } = await supabase.rpc('admin_update_user_account', {
    p_id: userData.id,
    p_fullname: userData.fullname,
    p_email: userData.email,
    p_password: userData.password || null,
    p_agency_id: userData.agency_id || null,
    p_department_id: userData.department_id || null,
    p_role: userData.role || null,
    p_employee_id: userData.employee_id || null,
    p_line_user_id: userData.line_user_id || null,
    p_avatar_url: userData.avatar_url || null
  });

  if (error) throw error;
  return data;
};

export const adminDeleteUser = async (userId) => {
  const { data, error } = await supabase.rpc('admin_delete_user_account', {
    p_user_id: userId
  });

  if (error) throw error;
  return data;
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

// ==========================================
// 9. Leave Types Management
// ==========================================
export const createLeaveType = async (payload) => {
  const { data, error } = await supabase
    .from('leave_types')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateLeaveType = async (id, payload) => {
  const { error } = await supabase
    .from('leave_types')
    .update(payload)
    .eq('id', id);
  if (error) throw error;
};

export const deleteLeaveType = async (id) => {
  const { error } = await supabase
    .from('leave_types')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
