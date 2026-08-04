const generateCodePolicies = (sheet) => {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return "PL-00001";
  }
  
  const ids = sheet.getRange(2, 1, lastRow - 1).getValues().flat();
  const numericIDs = ids
    .map(id => parseInt(id.replace('PL-', ''), 10))
    .filter(id => !isNaN(id) && id > 0);

  numericIDs.sort((a, b) => a - b);
  let newID = 1;
  
  for (let id of numericIDs) {
    if (newID < id) {
      break; 
    }
    newID++;
  }

  return 'PL-' + newID.toString().padStart(5, '0');
};

const addUserPolicies = (obj) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("UserPolicies");
  const codeID = generateCodePolicies(sheet);


  let rowData = ["'"+codeID, obj.data1, obj.data2, obj.data3];
  sheet.appendRow(rowData);

  return sheet.getRange("A2:D" + sheet.getLastRow()).getValues();
}

const upUserPolicies = (obj) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("UserPolicies");
  const data = sheet.getDataRange().getDisplayValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === obj.datakey) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 1, 2).setValue(obj.data1);
    sheet.getRange(rowIndex + 1, 3).setValue(obj.data2);
    sheet.getRange(rowIndex + 1, 4).setValue(obj.data3);
  }
};

const delDataUserPolicies = (codeID) => {
  const sheet = SpreadsheetApp.openById(idsheetA).getSheetByName("UserPolicies");
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
