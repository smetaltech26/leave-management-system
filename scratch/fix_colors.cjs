const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/components');

const replacements = [
  { regex: /\btext-white\b/g, replace: 'text-[var(--text-main)]' },
  { regex: /\btext-slate-100\b/g, replace: 'text-[var(--text-main)]' },
  { regex: /\btext-slate-200\b/g, replace: 'text-[var(--text-main)]' },
  { regex: /\btext-slate-300\b/g, replace: 'text-[var(--text-muted)]' },
  { regex: /\btext-slate-400\b/g, replace: 'text-[var(--text-muted)]' },
  { regex: /\btext-slate-800\b/g, replace: 'text-[var(--text-main)]' }, // Some might be explicitly set for light mode before, unifying.
  { regex: /\bborder-slate-800\b/g, replace: 'border-[var(--card-border)]' },
  { regex: /\bborder-slate-700\b/g, replace: 'border-[var(--card-border)]' },
  { regex: /\bborder-white\/10\b/g, replace: 'border-[var(--card-border)]' },
  { regex: /\bbg-slate-800\b/g, replace: 'bg-[var(--card-bg)]' },
  { regex: /\bbg-slate-900\b/g, replace: 'bg-[var(--card-bg)]' },
  { regex: /\bbg-slate-900\/50\b/g, replace: 'bg-[var(--card-bg)]' },
  { regex: /\bbg-slate-800\/50\b/g, replace: 'bg-[var(--card-bg)]' },
  { regex: /\bglass-card\b/g, replace: 'glass-card-clean' } // upgrade all old glass cards to new standard
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
        console.log(`Updated: ${file}`);
      }
    }
  }
}

processDirectory(componentsDir);
console.log("All done!");
