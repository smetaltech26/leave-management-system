import XLSX from 'xlsx';

const wb1 = XLSX.readFile('ระบบลางาน ออนไลน์ 2025.xlsx');
console.log("== ระบบลางาน ออนไลน์ 2025.xlsx ==");
wb1.SheetNames.forEach(sheet => {
  const data = XLSX.utils.sheet_to_json(wb1.Sheets[sheet], {header: 1});
  console.log(`Sheet: ${sheet}`);
  if(data.length) console.log(data[0]);
});

const wb2 = XLSX.readFile('Data.xlsx');
console.log("\n== Data.xlsx ==");
wb2.SheetNames.forEach(sheet => {
  const data = XLSX.utils.sheet_to_json(wb2.Sheets[sheet], {header: 1});
  console.log(`Sheet: ${sheet}`);
  if(data.length) console.log(data[0]);
});
