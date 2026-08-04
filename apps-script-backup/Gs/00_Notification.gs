function sendLeaveNotification(requestId) {
  const ssB = SpreadsheetApp.openById(idsheetB);
  const ssA = SpreadsheetApp.openById(idsheetA);
  const sheetUsers = ssA.getSheetByName("Users");
  const sheetAgencies = ssA.getSheetByName("Agency");
  const sheetDepartments = ssA.getSheetByName("Departments");
  const sheetRequests = ssB.getSheetByName("LeaveRequests");
  const sheetSteps = ssB.getSheetByName("ApprovalSteps");

  if (!sheetUsers || !sheetAgencies || !sheetDepartments || !sheetRequests || !sheetSteps) {
    throw new Error("ไม่พบหนึ่งในชีต Users / Agency / Departments / LeaveRequests / ApprovalSteps");
  }

  const usersData = sheetUsers.getDataRange().getValues();
  const agencies = sheetAgencies.getDataRange().getValues().slice(1);
  const departments = sheetDepartments.getDataRange().getValues().slice(1);
  const requestsData = sheetRequests.getDataRange().getValues();
  const stepsData = sheetSteps.getDataRange().getValues();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
  };

  const findUserById = (uid) => {
    const row = usersData.find(r => r[0] === uid);
    if (!row) return null;
    const [ , email, , fullname, agencyId, deptId ] = row;
    const agency = agencies.find(a => a[0] === agencyId)?.[1] || agencyId;
    const department = departments.find(d => d[0] === deptId)?.[1] || deptId;
    return { email, name: fullname, agency, department };
  };

  const requestRow = requestsData.find(r => r[0] === requestId);
  if (!requestRow) return;

  const [ , description, startDate, endDate, userId, , leaveType, status ] = requestRow;
  const requester = findUserById(userId);

  const subject = "📩 แจ้งเตือนคำขอลางานจากระบบ";
  const dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;
  const leaveLabel = {
    'Annual': 'ลาพักร้อน',
    'Sick': 'ลาป่วย',
    'Personal': 'ลากิจได้รับค่าจ้าง',
    'Other': 'อื่นๆ',
    'Maternity': 'ลาคลอด',
    'Study': 'ลาศึกษา',
    'Military': 'ลาทหาร'
  }[leaveType] || leaveType;

  const htmlBody = (receiverName, role, requesterInfo) => `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 10px; 
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 20px;">
          <div style="background-color: #228B22; color: white; padding: 15px; 
                      border-radius: 8px 8px 0 0; margin: -20px -20px 20px; text-align: center;">
            <img src="https://cdn.jsdelivr.net/gh/smetaltech25/Img/SMT.png" 
                 alt="Epic Coding Logo" style="width: 80px; margin-bottom: 10px;">
            <h2 style="margin: 0;">Leave Management System</h2>
            <p style="margin: 0; font-size: 14px;">ระบบแจ้งเตือนคำขอลางาน</p>
          </div>
          <div style="padding: 20px;">
            <p>สวัสดีคุณ <strong>${receiverName}</strong></p>
            <p>มีการ${role === 'approver' ? 'มอบหมายคำขอลางานให้คุณอนุมัติ' : 'ส่งคำขอลางานของคุณสำเร็จแล้ว'}:</p>
            <ul style="line-height: 1.8;">
              <li><strong>ชื่อผู้ขอ:</strong> ${requesterInfo.name}</li>
              <li><strong>หน่วยงาน:</strong> ${requesterInfo.agency}</li>
              <li><strong>ฝ่าย:</strong> ${requesterInfo.department}</li>
              <li><strong>เรื่อง:</strong> ${description}</li>
              <li><strong>ประเภทการลา:</strong> ${leaveLabel}</li>
              <li><strong>ช่วงเวลา:</strong> ${dateRange}</li>
              <li><strong>สถานะปัจจุบัน:</strong> ${status}</li>
              <li><strong>รหัสคำขอ:</strong> ${requestId}</li>
            </ul>
            <p style="font-size: 14px; color: #777;">กรุณาเข้าสู่ระบบเพื่อตรวจสอบรายละเอียดเพิ่มเติม</p>
            <p><a href="https://www.smetaltech.co.th" target="_blank" style="padding: 10px 15px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">👉 คลิกเข้าสู่ระบบ </a></p>
          </div>
          <div style="margin-top: 20px; padding: 15px; border-top: 1px solid #dee2e6; text-align: center;">
            <p style="color: #666; font-size: 14px;">หากคุณไม่ได้เกี่ยวข้อง กรุณาเพิกเฉยต่ออีเมลนี้</p>
            <p style="color: #888; font-size: 12px;">* อีเมลนี้ถูกส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (requester && requester.email.includes("@")) {
    MailApp.sendEmail({
      to: requester.email,
      subject: subject,
      htmlBody: htmlBody(requester.name, "requester", requester)
    });
  }

  stepsData
    .filter(r => r[1] === requestId && r[6] === "Pending")
    .forEach(step => {
      const approver = findUserById(step[3]);
      if (approver && approver.email.includes("@")) {
        MailApp.sendEmail({
          to: approver.email,
          subject: subject,
          htmlBody: htmlBody(approver.name, "approver", requester)
        });
      }
    });
}
