const xlsx = require('xlsx');

try {
  const workbook = xlsx.readFile('Data.xlsx');
  console.log("Sheet Names:", workbook.SheetNames);
  
  const leaveReqSheet = workbook.Sheets['LeaveRequests'];
  if (leaveReqSheet) {
    const leaveReqData = xlsx.utils.sheet_to_json(leaveReqSheet, { header: 1 });
    console.log("LeaveRequests Headers:", leaveReqData[0]);
    console.log("LeaveRequests Row 1:", leaveReqData[1]);
  } else {
    console.log("LeaveRequests sheet not found!");
  }
  
  const approvalSheet = workbook.Sheets['ApprovalSteps'];
  if (approvalSheet) {
    const approvalData = xlsx.utils.sheet_to_json(approvalSheet, { header: 1 });
    console.log("ApprovalSteps Headers:", approvalData[0]);
    console.log("ApprovalSteps Row 1:", approvalData[1]);
  } else {
    console.log("ApprovalSteps sheet not found!");
  }
} catch (e) {
  console.error("Error reading Data.xlsx:", e);
}
