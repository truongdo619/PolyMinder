const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../../src/DocsPage/pages');

function processDirectory(currDir) {
  const files = fs.readdirSync(currDir);
  for (const file of files) {
    const fullPath = path.join(currDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') && !fullPath.includes('v3.3/Overview.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Specifically target backslashes that might have been left over and invalid unicode
      // We will replace all backslashes inside searchContent that aren't followed by valid escapes
      
      const searchBlockRegex = /export const searchContent = \`([\s\S]*?)\`;/;
      const match = content.match(searchBlockRegex);
      
      if (match) {
        // 1. Remove ALL non-ASCII characters completely (including zero-width spaces, dashes etc)
        // 2. Remove stray backslashes that could be interpreted as unicode escapes (\u)
        let cleanSearch = match[1]
          .replace(/[^\x20-\x7E\r\n\t]/g, " ") // Replace anything NOT printable ASCII with space
          .replace(/\\(?!n|r|t|"|'|`|\$)/g, ""); // Remove backslashes that don't escape standard chars
          
        content = content.replace(searchBlockRegex, `export const searchContent = \`${cleanSearch}\`;`);
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDirectory(pagesDir);
console.log('Rigorous Unicode scrub completed on TSX files');
