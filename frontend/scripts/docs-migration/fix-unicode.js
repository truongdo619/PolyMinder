const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../../src/DocsPage/pages');

function processDirectory(currDir) {
  const files = fs.readdirSync(currDir);
  for (const file of files) {
    const fullPath = path.join(currDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // The issue is hidden unicode characters (like soft hyphens, zero-width spaces, or non-breaking spaces)
      // getting caught in the template literal. Let's sanitize the searchContent template literal by 
      // removing any non-standard ASCII characters from the raw search string block.
      
      // Specifically we only want to nuke weird unicode inside the export const searchContent = `...` block
      const searchBlockRegex = /export const searchContent = \`([\s\S]*?)\`;/;
      const match = content.match(searchBlockRegex);
      
      if (match) {
        let cleanSearch = match[1].replace(/[^\x00-\x7F]/g, " "); // Replace any non-ASCII with space
        content = content.replace(searchBlockRegex, `export const searchContent = \`${cleanSearch}\`;`);
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDirectory(pagesDir);
console.log('Unicode sanitized in all TSX files');
