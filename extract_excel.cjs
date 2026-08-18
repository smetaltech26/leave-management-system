const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

try {
    const files = fs.readdirSync(__dirname);
    const excelFile = files.find(f => f.includes('2025') && f.endsWith('.xlsx') && !f.startsWith('~$'));
    
    if (!excelFile) {
        process.exit(1);
    }
    
    const workbook = xlsx.readFile(path.join(__dirname, excelFile));
    const sheetName = workbook.SheetNames.find(s => s.toLowerCase() === 'users' || s === 'Users');
    
    const worksheet = workbook.Sheets[sheetName];
    // อ่านทั้งหมดเลย จะได้ไล่หาว่าหัวข้ออยู่บรรทัดไหน
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    // ลองหาบรรทัดแรกสุดที่มีคำว่า UID หรือ ID
    let headerRowIndex = -1;
    let uidIndex = -1;
    let idIndex = -1;
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (!row) continue;
        
        uidIndex = row.findIndex(c => c && typeof c === 'string' && c.trim().toUpperCase() === 'UID');
        idIndex = row.findIndex(c => c && typeof c === 'string' && c.trim().toUpperCase() === 'ID');
        
        if (uidIndex !== -1 || idIndex !== -1) {
            headerRowIndex = i;
            break;
        }
    }
    
    console.log("Found Header Row:", headerRowIndex);
    console.log("Headers:", data[headerRowIndex]);
    console.log("UID Index:", uidIndex);
    console.log("ID Index:", idIndex);
    
    if (uidIndex === -1 || idIndex === -1) {
         console.log("Failed to find exact UID or ID index. Trying partial match...");
         const row = data[headerRowIndex] || [];
         uidIndex = row.findIndex(c => c && typeof c === 'string' && c.toUpperCase().includes('UID'));
         idIndex = row.findIndex(c => c && typeof c === 'string' && c.toUpperCase().includes('ID'));
         console.log("Partial Match UID Index:", uidIndex, "ID Index:", idIndex);
         
         if (uidIndex === -1 || idIndex === -1) {
              console.log("Still failed.");
              process.exit(1);
         }
    }
    
    let sqlValues = [];
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        const uid = row[uidIndex] ? row[uidIndex].toString().trim() : null;
        const empId = row[idIndex] ? row[idIndex].toString().trim() : null;
        
        if (uid && uid.startsWith('USER-') && empId) {
            sqlValues.push(`  ('${uid}', '${empId}')`);
        }
    }
    
    if (sqlValues.length === 0) {
         console.log("No valid mapping found.");
         process.exit(0);
    }
    
    const sqlScript = `-- สคริปต์สำหรับอัปเดตข้อมูล employee_id ในตาราง users แบบเต็ม
-- นำโค้ดทั้งหมดนี้ไปวางที่หน้า SQL Editor ของ Supabase แล้วกด RUN เพื่ออัปเดตข้อมูลได้เลยครับ

UPDATE public.users 
SET employee_id = mapping.employee_id
FROM (VALUES
${sqlValues.join(',\n')}
) AS mapping(user_id, employee_id)
WHERE public.users.id = mapping.user_id;
`;

    fs.writeFileSync('full_update.sql', sqlScript);
    console.log(`Successfully generated SQL script with ${sqlValues.length} records.`);
    
} catch (e) {
    console.error("Error:", e);
}
