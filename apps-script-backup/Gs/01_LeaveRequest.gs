const generateCodeREQ = (sheet) => {
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return "LEV-0001";
  }
  
  const dataRows = lastRow - 1;
  const ids = sheet.getRange(2, 1, dataRows).getValues().flat();
  const nums = ids.map(id => parseInt(id.replace("LEV-", ""))).filter(n => !isNaN(n));
  const newId = getNextAvailableNumber(nums);
  return "LEV-" + newId.toString().padStart(4, '0');
};

const generateCodeFile = (sheet) => {
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return "FILE-0001";
  }
  
  const dataRows = lastRow - 1;
  const ids = sheet.getRange(2, 1, dataRows).getValues().flat();
  const nums = ids.map(id => parseInt(id.replace("FILE-", ""))).filter(n => !isNaN(n));
  const newId = getNextAvailableNumber(nums);
  return "FILE-" + newId.toString().padStart(4, '0');
};

const getNextAvailableNumber = (numbers) => {
  numbers.sort((a, b) => a - b);
  let next = 1;
  for (let n of numbers) {
    if (n > next) break;
    next++;
  }
  return next;
};

const addRequest = (obj) => {
  const ss = SpreadsheetApp.openById(idsheetB);
  const sheetRequests = ss.getSheetByName("LeaveRequests");
  const sheetSteps = ss.getSheetByName("ApprovalSteps");
  const sheetFiles = ss.getSheetByName("Attachments");
  const folder = DriveApp.getFolderById(idfolder);

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  const requestId = generateCodeREQ(sheetRequests);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
  };

  // บันทึกคำขออนุมัติ
  const requestRow = [ requestId, obj.description, formatDate(obj.dateStart), formatDate(obj.endStart), obj.userId, obj.policyId, obj.leaveType, 'Pending', obj.currentStep, '', today, today, obj.leaveDuration];
  sheetRequests.appendRow(requestRow);

  // บันทึกผู้อนุมัติ
  if (obj.approvers?.length) {
    const stepRows = obj.approvers.map((uid, i) => {
      return [ requestId + "-STEP" + (i + 1), requestId, i + 1, uid, today, '', 'Pending', '' ];
    });
    
    if (stepRows.length > 0) {
      sheetSteps.getRange(sheetSteps.getLastRow() + 1, 1, stepRows.length, stepRows[0].length).setValues(stepRows);
    }
  }

  // ⬇️ บันทึกไฟล์แนบ
  if (obj.uploadedFiles?.length) {
    obj.uploadedFiles.forEach(file => {
      const data = Utilities.base64Decode(file.imageDataUrl.split(',')[1]);
      const blob = Utilities.newBlob(data, file.filetype, file.filename);
      const driveFile = folder.createFile(blob);
      const fileUrl = "https://drive.google.com/file/d/" + driveFile.getId();
      const fileId = generateCodeFile(sheetFiles);

      sheetFiles.appendRow([fileId, requestId, fileUrl, obj.userId, today]);
    });
  }

  sendLeaveNotification(requestId);
};

const upRequest = (obj) => {
  const ss = SpreadsheetApp.openById(idsheetB);
  const sheetRequests = ss.getSheetByName("LeaveRequests");
  const sheetSteps = ss.getSheetByName("ApprovalSteps");
  const sheetFiles = ss.getSheetByName("Attachments");
  const folder = DriveApp.getFolderById(idfolder);

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  const requestId = obj.datakey;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
  };

  try {
    // 1. อัปเดตข้อมูลคำขอใน LeaveRequests
    const requestsData = sheetRequests.getDataRange().getValues();
    let requestRowIndex = -1;
    
    for (let i = 1; i < requestsData.length; i++) {
      if (requestsData[i][0] === requestId) {
        requestRowIndex = i + 1;
        break;
      }
    }
    
    if (requestRowIndex === -1) {
      throw new Error(`Leave request ${requestId} not found`);
    }

    sheetRequests.getRange(requestRowIndex, 2).setValue(obj.description);
    sheetRequests.getRange(requestRowIndex, 3).setValue(formatDate(obj.dateStart));
    sheetRequests.getRange(requestRowIndex, 4).setValue(formatDate(obj.endStart));
    sheetRequests.getRange(requestRowIndex, 6).setValue(obj.policyId);
    sheetRequests.getRange(requestRowIndex, 7).setValue(obj.leaveType);
    sheetRequests.getRange(requestRowIndex, 9).setValue(obj.approvers?.length || 0);
    sheetRequests.getRange(requestRowIndex, 12).setValue(today);
    sheetRequests.getRange(requestRowIndex, 13).setValue(obj.leaveDuration);

    // 2. ลบและสร้าง ApprovalSteps ใหม่
    const stepsData = sheetSteps.getDataRange().getValues();
    const stepsToDelete = [];
    
    for (let i = 1; i < stepsData.length; i++) {
      if (stepsData[i][1] === requestId) {
        stepsToDelete.push(i + 1);
      }
    }
    
    // ลบแถวจากล่างขึ้นบน เพื่อไม่ให้ index เปลี่ยน
    for (let i = stepsToDelete.length - 1; i >= 0; i--) {
      sheetSteps.deleteRow(stepsToDelete[i]);
    }
    
    // เพิ่ม ApprovalSteps ใหม่
  if (obj.approvers?.length) {
    const stepRows = obj.approvers.map((uid, i) => {
      return [ requestId + "-STEP" + (i + 1), requestId, i + 1, uid, today, '', 'Pending', '' ];
    });
    
    if (stepRows.length > 0) {
      sheetSteps.getRange(sheetSteps.getLastRow() + 1, 1, stepRows.length, stepRows[0].length).setValues(stepRows);
    }
  }

    // 3. จัดการไฟล์แนบ
    const filesData = sheetFiles.getDataRange().getValues();
    const currentFiles = []; // ไฟล์ที่มีอยู่ในระบบ
    const filesToDelete = []; // แถวที่ต้องลบ
    
    // หาไฟล์ปัจจุบันและแถวที่ต้องลบ
    for (let i = 1; i < filesData.length; i++) {
      if (filesData[i][1] === requestId) {
        currentFiles.push({
          fileId: filesData[i][0],
          fileUrl: filesData[i][2],
          rowIndex: i + 1
        });
        filesToDelete.push(i + 1);
      }
    }
    
    // เปรียบเทียบไฟล์เก่ากับไฟล์ที่ยังคงอยู่
    const remainingFileIds = (obj.existingAttachments || []).map(att => att.fileId);
    const filesToTrash = currentFiles.filter(file => !remainingFileIds.includes(file.fileId));
    
    // ย้ายไฟล์ที่ถูกลบไปถังขยะ
    filesToTrash.forEach(file => {
      try {
        if (file.fileUrl && file.fileUrl.includes("https://drive.google.com/file/d/")) {
          const fileId = file.fileUrl.split('/d/')[1].split('/')[0];
          DriveApp.getFileById(fileId).setTrashed(true);
        }
      } catch (error) {
        console.log(`Error moving file ${file.fileId} to trash:`, error);
      }
    });
    
    // ลบแถวไฟล์เก่าทั้งหมดจาก sheet
    for (let i = filesToDelete.length - 1; i >= 0; i--) {
      sheetFiles.deleteRow(filesToDelete[i]);
    }
    
    // เพิ่มไฟล์เก่าที่ยังคงอยู่กลับเข้าไป
    if (obj.existingAttachments?.length) {
      const existingFileRows = obj.existingAttachments.map(att => [ att.fileId, requestId, att.fileUrl, att.uploadedBy, att.uploadedAt]);
      sheetFiles.getRange(sheetFiles.getLastRow() + 1, 1, existingFileRows.length, existingFileRows[0].length).setValues(existingFileRows);
    }
    
    // เพิ่มไฟล์ใหม่
    if (obj.uploadedFiles?.length) {
      obj.uploadedFiles.forEach(file => {
        try {
          const data = Utilities.base64Decode(file.imageDataUrl.split(',')[1]);
          const blob = Utilities.newBlob(data, file.filetype, file.filename);
          const driveFile = folder.createFile(blob);
          const fileUrl = "https://drive.google.com/file/d/" + driveFile.getId();
          const fileId = generateCodeFile(sheetFiles);
          sheetFiles.appendRow([fileId, requestId, fileUrl, obj.userId, today]);
        } catch (error) {
          console.log(`Error uploading file ${file.filename}:`, error);
        }
      });
    }
    
    sendLeaveNotification(requestId);
    
    return { 
      success: true, 
      requestId: requestId,
      message: 'Leave request updated successfully'
    };

  } catch (error) {
    console.error('Error updating leave request:', error);
    return {
      success: false,
      message: 'Error updating leave request: ' + error.toString()
    };
  }
};

const delDataLeaveRequests = (codeID) => {
  const ss = SpreadsheetApp.openById(idsheetB);
  const sheetRequests = ss.getSheetByName("LeaveRequests");
  const sheetSteps = ss.getSheetByName("ApprovalSteps");
  const sheetFiles = ss.getSheetByName("Attachments");
  
  try {
    const requestsData = sheetRequests.getDataRange().getValues();
    let requestRowIndex = -1;
    
    for (let i = 1; i < requestsData.length; i++) {
      if (requestsData[i][0] === codeID) {
        requestRowIndex = i + 1;
        break;
      }
    }
    
    if (requestRowIndex === -1) {
      throw new Error("ไม่พบข้อมูลคำขอลาที่ต้องการลบ");
    }
    
    // ลบไฟล์แนบ
    const filesData = sheetFiles.getDataRange().getValues();
    const filesToDelete = [];
    const fileRowsToDelete = [];
    
    for (let i = 1; i < filesData.length; i++) {
      if (filesData[i][1] === codeID) {
        const fileUrl = filesData[i][2];
        filesToDelete.push(fileUrl);
        fileRowsToDelete.push(i + 1);
      }
    }
    
    filesToDelete.forEach(fileUrl => {
      try {
        if (fileUrl && fileUrl.includes("https://drive.google.com/file/d/")) {
          const fileId = fileUrl.split('/d/')[1].split('/')[0];
          DriveApp.getFileById(fileId).setTrashed(true);
          console.log(`Moved file to trash: ${fileId}`);
        }
      } catch (error) {
        console.log(`Error moving file to trash: ${error}`);
      }
    });
    
    for (let i = fileRowsToDelete.length - 1; i >= 0; i--) {
      sheetFiles.deleteRow(fileRowsToDelete[i]);
    }
    
    const stepsData = sheetSteps.getDataRange().getValues();
    const stepRowsToDelete = [];
    
    for (let i = 1; i < stepsData.length; i++) {
      if (stepsData[i][1] === codeID) {
        stepRowsToDelete.push(i + 1);
      }
    }
    
    for (let i = stepRowsToDelete.length - 1; i >= 0; i--) {
      sheetSteps.deleteRow(stepRowsToDelete[i]);
    }
    
    sheetRequests.deleteRow(requestRowIndex);
    
  } catch (error) {
    console.error("Error in delLeaveRequest:", error);
    throw new Error(`เกิดข้อผิดพลาดในการลบข้อมูล: ${error.message}`);
  }
};
