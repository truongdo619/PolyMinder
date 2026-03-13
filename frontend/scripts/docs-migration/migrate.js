const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../../src/DocsPage/markdown');
const destDir = path.join(__dirname, '../../src/DocsPage/pages');

function convertMarkdownToComponent(mdContent, fileName) {
  const lines = mdContent.split('\\n');
  let title = fileName;
  let componentName = fileName.replace(/[^a-zA-Z0-9]/g, '');
  componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
  
  if (componentName.match(/^[0-9]/)) {
    componentName = 'Page' + componentName;
  }

  let inCodeBlock = false;
  let codeLang = '';
  let currentCode = [];
  
  let inTable = false;
  let tableHeaderParsed = false;
  
  const toc = [];
  let reactContent = [];
  let rawSearchContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Frontmatter extraction
    if (line.trim() === '---' && i === 0) {
      let j = 1;
      while (j < lines.length && lines[j].trim() !== '---') {
        if (lines[j].startsWith('title:')) {
          title = lines[j].replace('title:', '').trim();
        }
        j++;
      }
      i = j;
      continue;
    }

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim();
        currentCode = [];
      } else {
        inCodeBlock = false;
        const codeContent = currentCode.join('\\n').replace(/`/g, '\\\`').replace(/\\$/g, '\\\\$');
        reactContent.push('      <DocCodeBlock code={`' + codeContent + '`} />');
      }
      continue;
    }

    if (inCodeBlock) {
      currentCode.push(line);
      continue;
    }

    // Headers
    const hMatch = line.match(/^(#{1,3})\\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      let text = hMatch[2].trim();
      const rawText = text.replace(/[*_`]/g, '');
      const id = rawText.toLowerCase().replace(/[^\\w\\s-]/g, '').replace(/\\s+/g, '-');
      
      if (level === 1) {
        title = rawText;
      } else if (level === 2 || level === 3) {
        toc.push({ id, title: rawText, level });
      }
      
      rawSearchContent.push(rawText);
      reactContent.push(`      <DocHeader level={\${level}} id="\${id}">\${parseInline(text)}</DocHeader>`);
      continue;
    }

    // Tables (Basic support)
    if (line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHeaderParsed = false;
        reactContent.push(`      <table style={tableStyle}>`);
        reactContent.push(`        <thead>`);
      }
      
      if (line.includes('---')) {
        // Divider row
        continue;
      }
      
      const cells = line.split('|').map(c => c.trim()).filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''));
      
      reactContent.push(`          <tr>`);
      for (const cell of cells) {
        if (!tableHeaderParsed) {
          reactContent.push(`            <th style={thStyle}>\${parseInline(cell)}</th>`);
        } else {
          reactContent.push(`            <td style={tdStyle}>\${parseInline(cell)}</td>`);
        }
      }
      reactContent.push(`          </tr>`);
      
      if (!tableHeaderParsed) {
        tableHeaderParsed = true;
        reactContent.push(`        </thead>`);
        reactContent.push(`        <tbody>`);
      }
      continue;
    } else if (inTable) {
      inTable = false;
      reactContent.push(`        </tbody>`);
      reactContent.push(`      </table>`);
    }

    // Lists
    if (line.trim().match(/^-\\s+/)) {
      let isFirst = i === 0 || !lines[i-1].trim().match(/^-\\s+/);
      let isLast = i === lines.length - 1 || !lines[i+1].trim().match(/^-\\s+/);
      
      if (isFirst) reactContent.push(`      <DocList>`);
      const text = line.trim().replace(/^-\\s+/, '');
      rawSearchContent.push(text.replace(/[*_`]/g, ''));
      reactContent.push(`        <DocListItem>\${parseInline(text)}</DocListItem>`);
      if (isLast) reactContent.push(`      </DocList>`);
      continue;
    }

    // Plain text / Paragraphs
    if (line.trim() !== '') {
      // HTML passthrough check
      if (line.trim().startsWith('<p') || line.trim().startsWith('</p')) {
        continue;
      }

      rawSearchContent.push(line.trim().replace(/[*_`]/g, ''));
      reactContent.push(`      <DocText>`);
      reactContent.push(`        \${parseInline(line)}`);
      reactContent.push(`      </DocText>`);
    }
  }

  // Close unclosed tags
  if (inTable) {
    reactContent.push(`        </tbody>`);
    reactContent.push(`      </table>`);
  }

const resultTsx = 'import React from "react";\\n' +
'import { Box } from "@mui/material";\\n' +
'import { \\n' +
'  DocHeader, \\n' +
'  DocText, \\n' +
'  DocLink, \\n' +
'  DocList, \\n' +
'  DocListItem, \\n' +
'  DocInlineCode,\\n' +
'  DocCodeBlock,\\n' +
'  DocCallout\\n' +
'} from "../../components/DocComponents";\\n\\n' +
'export const toc = ' + JSON.stringify(toc, null, 2) + ';\\n\\n' +
'export const searchContent = `\\n' +
rawSearchContent.join('\\n').replace(/`/g, '\\\`').replace(/\\$/g, '\\\\$') + '\\n' +
'`;\\n\\n' +
`const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };\n` +
`const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };\n` +
`const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };\n\n` +
'export default function ' + componentName + '() {\\n' +
'  return (\\n' +
'    <Box>\\n' +
reactContent.join('\\n') + '\\n' +
'    </Box>\\n' +
'  );\\n' +
'}\\n';

  return resultTsx;
}

// Simple regex replacements for basic inline markdown
function parseInline(text) {
  let result = text;
  
  // bold: **text**
  result = result.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
  
  // italic: _text_
  result = result.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // inline code: `code`
  result = result.replace(/`(.*?)`/g, '<DocInlineCode>$1</DocInlineCode>');
  
  // links: [text](href)
  result = result.replace(/\\[(.*?)\\]\\((.*?)\\)/g, '<DocLink href="$2">$1</DocLink>');

  return result;
}

function processDirectory(currDir, currentDest) {
  if (!fs.existsSync(currentDest)) {
    fs.mkdirSync(currentDest, { recursive: true });
  }

  const files = fs.readdirSync(currDir);
  
  for (const file of files) {
    const fullPath = path.join(currDir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath, path.join(currentDest, file));
    } else if (file.endsWith('.md')) {
      const baseName = path.basename(file, '.md');
      
      // Allow compiling overview for all versions
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const compiled = convertMarkdownToComponent(content, baseName);
      
      // Capitalize first letter of file for React Component naming convention
      const outName = baseName.charAt(0).toUpperCase() + baseName.slice(1) + '.tsx';
      const outPath = path.join(currentDest, outName);
      
      fs.writeFileSync(outPath, compiled);
      console.log(`Compiled \${fullPath} -> \${outPath}`);
    }
  }
}

// Run the script
processDirectory(srcDir, destDir);
console.log('Migration complete!');
