const checkUsers = (username, password) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toLowerCase() === username.toLowerCase() && data[i][2] === password && data[i][10] === true) {
      const datauser = {
        uiduser: data[i][0],
        username: data[i][1],
        password: data[i][2],
        fullname: data[i][3],
        agency: data[i][4],
        department: data[i][5],
        role: data[i][6],
        imgUser: data[i][8],
        sigUser: data[i][9],
        status: data[i][10]
      };

      return datauser;
    }
  }
  return '⚠️ ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง';
}

const getDataUsersMenu = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('UsersMenu'); 
  const data = sheet.getDataRange().getDisplayValues().slice(1);
  //Logger.log(data)
  return data;
}

const updateMenuStatus = (menuItem, role, isChecked) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UsersMenu");
  const data = sheet.getDataRange().getValues();
  const index = data.findIndex(row => row[1] === menuItem);
  if (index !== -1) {
    const roleColumn = role === 'SuperAdmin' ? 3 : role === 'Admin' ? 4 : role === 'SuperUser' ? 5 : 6;
    const range = sheet.getRange(index + 1, roleColumn);
    range.setValue(isChecked ? "TRUE" : "FALSE");
  }
}

const getMenuItems = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UsersMenu");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const menuItems = {};

  for (let i = 1; i < data.length; i++) {
    const item = data[i][1];
    menuItems[item] = {};
    for (let j = 2; j < headers.length; j++) { 
      const cellValue = String(data[i][j]).toUpperCase() || "FALSE"; 
      menuItems[item][headers[j]] = cellValue === "TRUE";
    }
  }
  return menuItems;
};
