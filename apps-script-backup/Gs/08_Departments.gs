const generateCodeDPM = (sheet) => {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return "DPM-001";
  }
  
  const ids = sheet.getRange(2, 1, lastRow - 1).getValues().flat();
  const numericIDs = ids
    .map(id => parseInt(id.replace('DPM-', ''), 10))
    .filter(id => !isNaN(id) && id > 0);

  numericIDs.sort((a, b) => a - b);
  let newID = 1;
  
  for (let id of numericIDs) {
    if (newID < id) {
      break; 
    }
    newID++;
  }

  return 'DPM-' + newID.toString().padStart(3, '0');
};

const addDepartments = (obj) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("Departments");
  const codeID = generateCodeDPM(sheet);


  let rowData = ["'"+codeID, obj.data1];
  sheet.appendRow(rowData);

  return sheet.getRange("A2:B" + sheet.getLastRow()).getValues();
}

const upDepartments = (obj) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("Departments");
  const data = sheet.getDataRange().getDisplayValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === obj.datakey) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 1, 2).setValue(obj.data1);

  }
};

const delDataDepartments = (codeID) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("Departments");
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
