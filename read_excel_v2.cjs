const XLSX = require('xlsx');
const fs = require('fs');

try {
  const workbook = XLSX.readFile('ระบบลางาน ออนไลน์ 2025.xlsx');
  
  // 1. Users
  const userSheet = workbook.Sheets['Users'];
  const users = XLSX.utils.sheet_to_json(userSheet);
  fs.writeFileSync('src/lib/users.json', JSON.stringify(users, null, 2));
  console.log('Successfully generated users.json (', users.length, ' records)');

  // 2. Permissions (UsersMenu)
  const permSheet = workbook.Sheets['UsersMenu'];
  const permissions = XLSX.utils.sheet_to_json(permSheet);
  fs.writeFileSync('src/lib/permissions.json', JSON.stringify(permissions, null, 2));
  console.log('Successfully generated permissions.json (', permissions.length, ' records)');

} catch (error) {
  console.error('Error reading excel files:', error);
}
