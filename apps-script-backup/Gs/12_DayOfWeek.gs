const setWorkingDayStatus = (dayName, isWorking) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DayOfWeek");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dayName) {
      sheet.getRange(i + 1, 2).setValue(isWorking);
      break;
    }
  }
}
