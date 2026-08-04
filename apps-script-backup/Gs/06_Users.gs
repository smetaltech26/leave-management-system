const sendForgotPassword = (username) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const user = data.find(row => row[1] === username);

  if (user && user[1]) {
    const email = user[1];
    const password = user[2];
    const subject = "🔐 คำขอรหัสผ่านจากระบบ Epic Coding";

    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 10px; 
                      box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 20px;">
            
            <div style="background-color: #181280; color: white; padding: 15px; 
                        border-radius: 8px 8px 0 0; margin: -20px -20px 20px; text-align: center;">
              <img src="https://cdn.jsdelivr.net/gh/EPICCODING17/image/Logo-EicCoding.png" 
                   alt="Epic Coding Logo" style="width: 80px; margin-bottom: 10px;">
              <h2 style="margin: 0;">Epic Coding Channel</h2>
              <p style="margin: 0; font-size: 14px;">แจ้งข้อมูลการขอรหัสผ่านใหม่</p>
            </div>

            <div style="padding: 20px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 10px;">คุณได้ทำการขอรหัสผ่านจากระบบ</p>
              <p style="font-size: 18px; margin: 10px 0;"><strong>👨‍💻 Username:</strong> ${user[1]}</p>
              <p style="font-size: 18px; margin: 10px 0;"><strong>🔐 Password:</strong> ${password}</p>
              <p style="font-size: 14px; color: #777; margin-top: 20px;">กรุณาเก็บรหัสผ่านนี้ไว้เป็นความลับ</p>
            </div>

            <div style="margin-top: 20px; padding: 15px; border-top: 1px solid #dee2e6; text-align: center;">
              <p style="color: #666; font-size: 14px;">หากคุณไม่ได้เป็นผู้ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้</p>
              <p style="color: #888; font-size: 12px;">* อีเมลนี้ถูกส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
            </div>
          </div>
        </body>
      </html>
    `;

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
  }
};

const getDataUsers = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users'); 
  const data = sheet.getDataRange().getDisplayValues().slice(1);
  //Logger.log(data)
  return data;
}

const generateCodeUser = (sheet) => {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return "USER-001";
  }
  
  const ids = sheet.getRange(2, 1, lastRow - 1).getValues().flat();
  const numericIDs = ids
    .map(id => parseInt(id.replace('USER-', ''), 10))
    .filter(id => !isNaN(id) && id > 0);

  numericIDs.sort((a, b) => a - b);
  let newID = 1;
  
  for (let id of numericIDs) {
    if (newID < id) {
      break; 
    }
    newID++;
  }

  return 'USER-' + newID.toString().padStart(3, '0');
};

const registerNewUser = (obj) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const codeID = generateCodeUser(sheet);
  const folder = DriveApp.getFolderById(idfolder);
  const currentTime = new Date();
  const formattedDate = Utilities.formatDate(currentTime, Session.getScriptTimeZone(), 'd/M/yyyy');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toLowerCase() === obj.username.toLowerCase()) {
      return false;
    }
  }

  let profileUrl = "";
  let signatureUrl = "";

  if (obj.profileCheck !== "" && obj.profileImageDataUrl) {
    try {
      let profileData = Utilities.base64Decode(obj.profileImageDataUrl.split(',')[1]);
      let profileBlob = Utilities.newBlob(profileData, obj.profileFiletype, obj.profileFilename);
      let profileFile = folder.createFile(profileBlob);
      let profileFileId = profileFile.getId();
      profileUrl = "https://lh3.googleusercontent.com/d/" + profileFileId;
    } catch (error) {
      console.log("Error uploading profile image: " + error);
      profileUrl = "";
    }
  } else {
    profileUrl = obj.profileImage || "";
  }

  if (obj.signatureCheck !== "" && obj.signatureImageDataUrl) {
    try {
      let signatureData = Utilities.base64Decode(obj.signatureImageDataUrl.split(',')[1]);
      let signatureBlob = Utilities.newBlob(signatureData, obj.signatureFiletype, obj.signatureFilename);
      let signatureFile = folder.createFile(signatureBlob);
      let signatureFileId = signatureFile.getId();
      signatureUrl = "https://lh3.googleusercontent.com/d/" + signatureFileId;
    } catch (error) {
      console.log("Error uploading signature image: " + error);
      signatureUrl = "";
    }
  } else {
    signatureUrl = obj.signatureImage || "";
  }

  sheet.appendRow([codeID, "'"+obj.username, "'"+obj.password, "'"+obj.fullname, "", "", "User", formattedDate, profileUrl, signatureUrl, false]);

  return true;
}

const addUsers = (obj) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const codeID = generateCodeUser(sheet);
  const folder = DriveApp.getFolderById(idfolder);
  const currentTime = new Date();
  const formattedDate = Utilities.formatDate(currentTime, Session.getScriptTimeZone(), 'd/M/yyyy');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toLowerCase() === obj.username.toLowerCase()) {
      return false;
    }
  }

  let profileUrl = "";
  let signatureUrl = "";

  if (obj.profileCheck !== "" && obj.profileImageDataUrl) {
    try {
      let profileData = Utilities.base64Decode(obj.profileImageDataUrl.split(',')[1]);
      let profileBlob = Utilities.newBlob(profileData, obj.profileFiletype, obj.profileFilename);
      let profileFile = folder.createFile(profileBlob);
      let profileFileId = profileFile.getId();
      profileUrl = "https://lh3.googleusercontent.com/d/" + profileFileId;
    } catch (error) {
      console.log("Error uploading profile image: " + error);
      profileUrl = "";
    }
  } else {
    profileUrl = obj.profileImage || "";
  }

  if (obj.signatureCheck !== "" && obj.signatureImageDataUrl) {
    try {
      let signatureData = Utilities.base64Decode(obj.signatureImageDataUrl.split(',')[1]);
      let signatureBlob = Utilities.newBlob(signatureData, obj.signatureFiletype, obj.signatureFilename);
      let signatureFile = folder.createFile(signatureBlob);
      let signatureFileId = signatureFile.getId();
      signatureUrl = "https://lh3.googleusercontent.com/d/" + signatureFileId;
    } catch (error) {
      console.log("Error uploading signature image: " + error);
      signatureUrl = "";
    }
  } else {
    signatureUrl = obj.signatureImage || "";
  }

  sheet.appendRow([codeID, "'"+obj.username, "'"+obj.password, "'"+obj.fullname, obj.agency, obj.department, obj.role, formattedDate, profileUrl, signatureUrl, obj.status]);

  return true;
};

const upUsers = (obj) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getDisplayValues();
  const folder = DriveApp.getFolderById(idfolder);
  let profileUrl = "";
  let signatureUrl = "";
  let rowIndex = -1;

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === obj.datakey) {
      rowIndex = i;
      break;
    }
  }

  if (obj.profileCheck !== "" && obj.profileImageDataUrl) {
    try {
      if (obj.profileImage && obj.profileImage.includes("https://lh3.googleusercontent.com/d/")) {
        const oldProfileFileId = obj.profileImage.split('/d/')[1].split('/')[0];
        DriveApp.getFileById(oldProfileFileId).setTrashed(true);
      }

      const profileData = Utilities.base64Decode(obj.profileImageDataUrl.split(',')[1]);
      const profileBlob = Utilities.newBlob(profileData, obj.profileFiletype, obj.profileFilename);
      const profileFile = folder.createFile(profileBlob);
      profileUrl = "https://lh3.googleusercontent.com/d/" + profileFile.getId();
    } catch (error) {
      console.log("Error uploading profile image: " + error);
      profileUrl = obj.profileImage || "";
    }
  } else {
    profileUrl = obj.profileImage || "";
  }

  if (obj.signatureCheck !== "" && obj.signatureImageDataUrl) {
    try {
      if (obj.signatureImage && obj.signatureImage.includes("https://lh3.googleusercontent.com/d/")) {
        const oldSignatureFileId = obj.signatureImage.split('/d/')[1].split('/')[0];
        DriveApp.getFileById(oldSignatureFileId).setTrashed(true);
      }

      const signatureData = Utilities.base64Decode(obj.signatureImageDataUrl.split(',')[1]);
      const signatureBlob = Utilities.newBlob(signatureData, obj.signatureFiletype, obj.signatureFilename);
      const signatureFile = folder.createFile(signatureBlob);
      signatureUrl = "https://lh3.googleusercontent.com/d/" + signatureFile.getId();
    } catch (error) {
      console.log("Error uploading signature image: " + error);
      signatureUrl = obj.signatureImage || "";
    }
  } else {
    signatureUrl = obj.signatureImage || "";
  }

  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 1, 2).setValue("'" + obj.username);
    sheet.getRange(rowIndex + 1, 3).setValue("'" + obj.password);
    sheet.getRange(rowIndex + 1, 4).setValue("'" + obj.fullname);
    sheet.getRange(rowIndex + 1, 5).setValue(obj.agency);
    sheet.getRange(rowIndex + 1, 6).setValue(obj.department);
    sheet.getRange(rowIndex + 1, 7).setValue(obj.role);
    sheet.getRange(rowIndex + 1, 9).setValue(profileUrl);
    sheet.getRange(rowIndex + 1, 10).setValue(signatureUrl);
    sheet.getRange(rowIndex + 1, 11).setValue(obj.status);
  }

  return true;
};

const delDataUsers = (codeID) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getDisplayValues();
  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === codeID) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex > -1) {
    const fileDlUser = sheet.getRange(rowIndex + 1, 9).getValue();
    const sigDlUser = sheet.getRange(rowIndex + 1, 10).getValue(); 

    if (fileDlUser.includes("https://lh3.googleusercontent.com/d/")) {
      const fileId = fileDlUser.split('/d/')[1];
      DriveApp.getFileById(fileId).setTrashed(true);
    }

    if (sigDlUser.includes("https://lh3.googleusercontent.com/d/")) {
      const fileId = sigDlUser.split('/d/')[1];
      DriveApp.getFileById(fileId).setTrashed(true);
    }

    sheet.deleteRow(rowIndex + 1);
  }
}

function changePageProFile(obj) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getDisplayValues();
  const documentFolder = DriveApp.getFolderById(idfolder);
  let rowIndex = -1;

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === obj.datakey) {
      rowIndex = i;
      break;
    }
  }

  let profileImageUrl = "";
  let signatureImageUrl = "";

  // อัปโหลดรูปโปรไฟล์
  if (obj.profileImageData && obj.profileImageData.includes(',')) {
    try {
      const base64Data = Utilities.base64Decode(obj.profileImageData.split(',')[1]);
      const blob = Utilities.newBlob(base64Data, obj.profileFiletype || 'image/png', obj.profileFilename || 'profile.png');
      const file = documentFolder.createFile(blob);
      profileImageUrl = `https://lh3.googleusercontent.com/d/${file.getId()}`;
      Logger.log("✅ อัปโหลดรูปโปรไฟล์สำเร็จ: " + profileImageUrl);
    } catch (error) {
      Logger.log("❌ อัปโหลดรูปโปรไฟล์ล้มเหลว: " + error.message);
    }
  }

  // อัปโหลดลายเซ็น
  if (obj.signatureImageData && obj.signatureImageData.includes(',')) {
    try {
      const base64Data = Utilities.base64Decode(obj.signatureImageData.split(',')[1]);
      const blob = Utilities.newBlob(base64Data, obj.signatureFiletype || 'image/png', obj.signatureFilename || 'signature.png');
      const file = documentFolder.createFile(blob);
      signatureImageUrl = `https://lh3.googleusercontent.com/d/${file.getId()}`;
      Logger.log("✅ อัปโหลดลายเซ็นสำเร็จ: " + signatureImageUrl);
    } catch (error) {
      Logger.log("❌ อัปโหลดลายเซ็นล้มเหลว: " + error.message);
    }
  }

  if (rowIndex > -1) {
    if (obj.data1) sheet.getRange(rowIndex + 1, 2).setValue(obj.data1);
    if (obj.data3) sheet.getRange(rowIndex + 1, 3).setValue(obj.data3);
    if (obj.data2) sheet.getRange(rowIndex + 1, 4).setValue(obj.data2);
    if (profileImageUrl) sheet.getRange(rowIndex + 1, 9).setValue(profileImageUrl);
    if (signatureImageUrl) sheet.getRange(rowIndex + 1, 10).setValue(signatureImageUrl);
  }
}
