const XLSX = require('xlsx');
const fs = require('fs');

try {
  // Read Data.xlsx
  const dataWorkbook = XLSX.readFile('Data.xlsx');
  const userSheet = dataWorkbook.Sheets[dataWorkbook.SheetNames[0]]; // Assuming first sheet is Users
  const users = XLSX.utils.sheet_to_json(userSheet);
  
  fs.writeFileSync('src/lib/users.json', JSON.stringify(users, null, 2));
  console.log('Successfully generated users.json');

  // Read Permissions
  const permWorkbook = XLSX.readFile('ระบบลางาน ออนไลน์ 2025.xlsx');
  // Find UsersMenu sheet
  let permSheet;
  if (permWorkbook.Sheets['UsersMenu']) {
    permSheet = permWorkbook.Sheets['UsersMenu'];
  } else {
    // If not found, just use the first sheet for debugging
    permSheet = permWorkbook.Sheets[permWorkbook.SheetNames[0]];
    console.log('UsersMenu not found, using first sheet:', permWorkbook.SheetNames[0]);
  }
  
  const permissions = XLSX.utils.sheet_to_json(permSheet);
  fs.writeFileSync('src/lib/permissions.json', JSON.stringify(permissions, null, 2));
  console.log('Successfully generated permissions.json');

} catch (error) {
  console.error('Error reading excel files:', error);
}
