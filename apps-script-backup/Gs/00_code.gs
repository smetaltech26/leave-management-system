const doGet = () => {
  const template = HtmlService.createTemplateFromFile('Index');
  template.nameEng = nameEng;
  template.nameThai = nameThai;
  template.logoSystem = logoSystem;

  const page = template.evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle(nameEng)
    .setFaviconUrl(logoSystem)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  return page;
};

const include = (filename) => {
  return HtmlService.createHtmlOutputFromFile(filename).getContent()
}

const settingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Setting');
const idfolder = settingSheet.getRange('B1').getDisplayValue();
const idapi = settingSheet.getRange('B2').getDisplayValue();
const idsheetA = settingSheet.getRange('B3').getDisplayValue();
const idsheetB = settingSheet.getRange('B4').getDisplayValue();
const logoSystem = settingSheet.getRange('B5').getDisplayValue();
const nameThai = settingSheet.getRange('B6').getDisplayValue();
const nameEng = settingSheet.getRange('B7').getDisplayValue();

function getSettingData() {
  const settingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Setting');
  return {
    idapi: settingSheet.getRange('B2').getDisplayValue(),
    idsheetA: settingSheet.getRange('B3').getDisplayValue(),
    idsheetB: settingSheet.getRange('B4').getDisplayValue()
  };
}

const getSet = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Setting');
  const data = sheet.getRange('B1:B7').getDisplayValues().flat();
  return data;
}

const getURL = () => {
  return ScriptApp.getService().getUrl();
}

const getDataLeaveRequests = () => {
  const sheet = SpreadsheetApp.openById(idsheetB).getSheetByName('LeaveRequests');
  const data = sheet.getDataRange().getDisplayValues().slice(1);
  //Logger.log(data)
  return data;
};

const getDataApprovalSteps = () => {
  const sheet = SpreadsheetApp.openById(idsheetB).getSheetByName('ApprovalSteps');
  const data = sheet.getDataRange().getDisplayValues().slice(1);
  //Logger.log(data)
  return data;
};
