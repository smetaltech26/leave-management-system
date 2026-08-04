const generateCodeHD = (sheet) => {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return "HD-00001";
  }
  
  const ids = sheet.getRange(2, 1, lastRow - 1).getValues().flat();
  const numericIDs = ids
    .map(id => parseInt(id.replace('HD-', ''), 10))
    .filter(id => !isNaN(id) && id > 0);

  numericIDs.sort((a, b) => a - b);
  let newID = 1;
  
  for (let id of numericIDs) {
    if (newID < id) {
      break; 
    }
    newID++;
  }

  return 'HD-' + newID.toString().padStart(5, '0');
};

const addHolidays = (obj) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("Holidays");
  const codeID = generateCodeHD(sheet);

  let formattedDate = "";
  if (obj.data1) {
    const dateParts1 = obj.data1.split('-');
    formattedDate = Utilities.formatDate(new Date(dateParts1[0], dateParts1[1] - 1, dateParts1[2]), Session.getScriptTimeZone(), 'd/M/yyyy');
  }

  let rowData = ["'"+codeID, formattedDate, obj.data2];
  sheet.appendRow(rowData);

  return sheet.getRange("A2:C" + sheet.getLastRow()).getValues();
}

const upHolidays = (obj) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("Holidays");
  const data = sheet.getDataRange().getDisplayValues();

  let formattedDate = "";
  if (obj.data1) {
    const dateParts1 = obj.data1.split('-');
    formattedDate = Utilities.formatDate(new Date(dateParts1[0], dateParts1[1] - 1, dateParts1[2]), Session.getScriptTimeZone(), 'd/M/yyyy');
  }

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === obj.datakey) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 1, 2).setValue(formattedDate);
    sheet.getRange(rowIndex + 1, 3).setValue(obj.data2);
  }

  return sheet.getRange("A2:C" + sheet.getLastRow()).getValues();
};

const delDataHolidays = (codeID) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("Holidays");
  const data = sheet.getDataRange().getDisplayValues();
  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === codeID) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex > -1) {
    sheet.deleteRow(rowIndex + 1);
  }
}
