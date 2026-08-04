const generateCodeMg = (sheet) => {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return "MNG-0001";
  }
  
  const ids = sheet.getRange(2, 1, lastRow - 1).getValues().flat();
  const numericIDs = ids
    .map(id => parseInt(id.replace('MNG-', ''), 10))
    .filter(id => !isNaN(id) && id > 0);

  numericIDs.sort((a, b) => a - b);
  let newID = 1;
  
  for (let id of numericIDs) {
    if (newID < id) {
      break; 
    }
    newID++;
  }

  return 'MNG-' + newID.toString().padStart(4, '0');
};

const addAnnouncements = (obj) => {
  const sheet = SpreadsheetApp.openById(idsheetB).getSheetByName("ManagerDB");
  const codeID = generateCodeMg(sheet);
  const folder = DriveApp.getFolderById(idfolder);
  let formattedDate = "";
  if (obj.data2) {
    const dateParts = obj.data2.split('-');
    formattedDate = Utilities.formatDate(new Date(dateParts[0], dateParts[1] - 1, dateParts[2]), Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }

  let fileUrl = "";

  if (obj.uploadedFiles?.length === 1) {
    const file = obj.uploadedFiles[0];
    const data = Utilities.base64Decode(file.imageDataUrl.split(',')[1]);
    const blob = Utilities.newBlob(data, file.filetype, file.filename);
    const driveFile = folder.createFile(blob);
    fileUrl = "https://drive.google.com/file/d/" + driveFile.getId();
  }

  let rowData = [codeID, obj.userId, obj.data1, formattedDate, fileUrl];
  sheet.appendRow(rowData);

  return sheet.getRange("A2:E" + sheet.getLastRow()).getValues();
}

const upAnnouncements = (obj) => {
  const sheet = SpreadsheetApp.openById(idsheetB).getSheetByName("ManagerDB");
  const data = sheet.getDataRange().getDisplayValues();
  const folder = DriveApp.getFolderById(idfolder);

  let formattedDate = "";
  if (obj.data2) {
    const dateParts = obj.data2.split('-');
    formattedDate = Utilities.formatDate(new Date(dateParts[0], dateParts[1] - 1, dateParts[2]), Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }

  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === obj.datakey) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex > -1) {
    const oldFileUrl = data[rowIndex][4];
    let fileUrl = oldFileUrl;

    if (obj.uploadedFiles?.length === 1) {
      const file = obj.uploadedFiles[0];
      const base64Data = Utilities.base64Decode(file.imageDataUrl.split(',')[1]);
      const blob = Utilities.newBlob(base64Data, file.filetype, file.filename);
      const driveFile = folder.createFile(blob);
      fileUrl = "https://drive.google.com/file/d/" + driveFile.getId();

      if (oldFileUrl && oldFileUrl.includes("drive.google.com/file/d/")) {
        try {
          const oldFileId = oldFileUrl.split("/d/")[1].split("/")[0];
          DriveApp.getFileById(oldFileId).setTrashed(true);
        } catch (e) {
          Logger.log("ไม่สามารถลบไฟล์เดิม: " + e);
        }
      }
    }

    sheet.getRange(rowIndex + 1, 3).setValue(obj.data1);
    sheet.getRange(rowIndex + 1, 2).setValue(obj.userId);
    sheet.getRange(rowIndex + 1, 4).setValue(formattedDate);
    sheet.getRange(rowIndex + 1, 5).setValue(fileUrl);
  }

  return sheet.getRange("A2:E" + sheet.getLastRow()).getValues();
};

const delDataAnnouncements = (codeID) => {
  const sheet = SpreadsheetApp.openById(idsheetB).getSheetByName("ManagerDB");
  const data = sheet.getDataRange().getDisplayValues();
  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === codeID) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex > -1) {
    const fileUrl = data[rowIndex][4];
    if (fileUrl && fileUrl.includes("drive.google.com/file/d/")) {
      try {
        const fileId = fileUrl.split("/d/")[1].split("/")[0];
        DriveApp.getFileById(fileId).setTrashed(true); // 🔥 ลบไฟล์
      } catch (e) {
        Logger.log("ลบไฟล์แนบไม่ได้: " + e);
      }
    }
    sheet.deleteRow(rowIndex + 1);
  }
};
