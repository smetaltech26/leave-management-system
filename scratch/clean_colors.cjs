const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/components');

const replacements = [
  // ลบ class ที่ทำให้เกิดปัญหาตัวหนังสือมืด
  { regex: /\btext-slate-900\b/g, replace: 'text-[var(--text-main)]' },
  { regex: /\btext-slate-600\b/g, replace: 'text-[var(--text-muted)]' },
  { regex: /\btext-slate-500\b/g, replace: 'text-[var(--text-muted)]' },
  // ลบ dark:text-... ออกให้หมด
  { regex: /\bdark:text-\[var\(--text-main\)\]\b/g, replace: '' },
  { regex: /\bdark:text-\[var\(--text-muted\)\]\b/g, replace: '' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const rule of replacements) {
        if (rule.regex.test(content)) {
          content = content.replace(rule.regex, rule.replace);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned: ${file}`);
      }
    }
  }
}

processDirectory(componentsDir);
console.log("All done!");
