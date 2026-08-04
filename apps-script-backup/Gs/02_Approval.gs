const setConfirmLeaveApprove = (obj) => {
  const ss = SpreadsheetApp.openById(idsheetB);
  const sheetRequests = ss.getSheetByName("LeaveRequests");
  const sheetSteps = ss.getSheetByName("ApprovalSteps");
  
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  const stepId = obj.stepId;
  const action = obj.action;
  const comment = obj.comment;
  
  try {
    const stepsData = sheetSteps.getDataRange().getValues();
    let stepRowIndex = -1;
    let requestId = '';
    let stepOrder = 0;
    
    for (let i = 1; i < stepsData.length; i++) {
      if (stepsData[i][0] === stepId) {
        stepRowIndex = i + 1;
        requestId = stepsData[i][1];
        stepOrder = stepsData[i][2];
        break;
      }
    }
    
    if (stepRowIndex === -1) {
      throw new Error("ไม่พบข้อมูล step ที่ต้องการอัพเดท");
    }
    
    // อัพเดท ApprovalSteps
    sheetSteps.getRange(stepRowIndex, 6).setValue(today);
    sheetSteps.getRange(stepRowIndex, 7).setValue(action);
    sheetSteps.getRange(stepRowIndex, 8).setValue(comment);
    
    const requestsData = sheetRequests.getDataRange().getValues();
    let requestRowIndex = -1;
    
    for (let i = 1; i < requestsData.length; i++) {
      if (requestsData[i][0] === requestId) {
        requestRowIndex = i + 1;
        break;
      }
    }
    
    if (requestRowIndex > -1) {
      if (action === 'Rejected') {
        // ปฏิเสธ - อัพเดทสถานะเป็น Rejected
        sheetRequests.getRange(requestRowIndex, 8).setValue('Rejected');
        sheetRequests.getRange(requestRowIndex, 9).setValue(stepOrder);
        sheetRequests.getRange(requestRowIndex, 10).setValue(comment);
        sheetRequests.getRange(requestRowIndex, 12).setValue(today);
        
      } else if (action === 'Approved') {
        // อนุมัติ - ตรวจสอบว่าเป็นขั้นตอนสุดท้ายหรือไม่
        const allRequestSteps = stepsData.filter(row => row[1] === requestId);
        const totalSteps = allRequestSteps.length;
        
        if (stepOrder >= totalSteps) {
          // ขั้นตอนสุดท้าย - อนุมัติเสร็จสิ้น
          sheetRequests.getRange(requestRowIndex, 8).setValue('Approved');
          sheetRequests.getRange(requestRowIndex, 9).setValue('');
          sheetRequests.getRange(requestRowIndex, 10).setValue(comment);
          sheetRequests.getRange(requestRowIndex, 12).setValue(today);
          
        } else {
          // ยังไม่ใช่ขั้นตอนสุดท้าย - ลด currentStep
          const currentStep = requestsData[requestRowIndex - 1][8];
          const newCurrentStep = Math.max(1, currentStep - 1);
          
          sheetRequests.getRange(requestRowIndex, 9).setValue(newCurrentStep);
          sheetRequests.getRange(requestRowIndex, 12).setValue(today);
        }
      }
    }
    
    sendLeaveNotification(requestId);
    
    return { success: true, message: "ดำเนินการสำเร็จ" };
    
  } catch (error) {
    console.error("Error in setConfirmLeaveApprove:", error);
    throw new Error(`เกิดข้อผิดพลาดในการดำเนินการ: ${error.message}`);
  }
};
