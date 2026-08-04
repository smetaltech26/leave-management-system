const generateCodeAgency = (sheet) => {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return "AGC-001";
  }
  
  const ids = sheet.getRange(2, 1, lastRow - 1).getValues().flat();
  const numericIDs = ids
    .map(id => parseInt(id.replace('AGC-', ''), 10))
    .filter(id => !isNaN(id) && id > 0);

  numericIDs.sort((a, b) => a - b);
  let newID = 1;
  
  for (let id of numericIDs) {
    if (newID < id) {
      break; 
    }
    newID++;
  }

  return 'AGC-' + newID.toString().padStart(3, '0');
};

const addAgency = (obj) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("Agency");
  const codeID = generateCodeAgency(sheet);


  let rowData = ["'"+codeID, obj.data1];
  sheet.appendRow(rowData);

  return sheet.getRange("A2:B" + sheet.getLastRow()).getValues();
}

const upAgency = (obj) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("Agency");
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

const delDataAgency = (codeID) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("Agency");
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
