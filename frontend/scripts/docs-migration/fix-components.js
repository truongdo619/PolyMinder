/**
 * fix-components.js
 *
 * Reads every .tsx page file in src/DocsPage/pages/{v3.0,v3.1},
 * parses the markdown stored in `searchContent`, and regenerates
 * a proper React component function + toc array from it.
 *
 * The v3.3/Overview.tsx is manually written and is NOT touched.
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../../src/DocsPage/pages');
const photosDir = path.join(__dirname, '../../src/DocsPage/photos');

// ── Build a lookup of all actual photo files (lowercased, no underscores → real path) ──
const photoLookup = new Map(); // key: lowercased basename without underscores → value: real relative path from src/DocsPage/photos/
function buildPhotoLookup(dir, prefix) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      buildPhotoLookup(full, prefix ? prefix + '/' + entry : entry);
    } else {
      const relPath = prefix ? prefix + '/' + entry : entry;
      const key = entry.toLowerCase().replace(/_/g, '');
      photoLookup.set(key, relPath);
    }
  }
}
buildPhotoLookup(photosDir, '');

/** Resolve a mangled image path from searchContent to the actual file path */
function resolveImagePath(srcAttr) {
  // srcAttr looks like "./src/DocsPage/photos/Signin.png" or "/src/DocsPage/photos/v3.1/signinpage.png"
  const basename = path.basename(srcAttr);
  const key = basename.toLowerCase().replace(/_/g, '');
  if (photoLookup.has(key)) {
    return photoLookup.get(key);
  }
  // Try with directory prefix (e.g., v3.1/)
  const dirMatch = srcAttr.match(/photos\/([\w.]+)\/([^/]+)$/);
  if (dirMatch) {
    const subdir = dirMatch[1];
    const fname = dirMatch[2];
    const keyWithDir = fname.toLowerCase().replace(/_/g, '');
    // Search lookup for matching file in the right subdir
    for (const [k, v] of photoLookup.entries()) {
      if (k === keyWithDir && v.startsWith(subdir + '/')) return v;
    }
  }
  return null; // not found
}

// ── Inline markdown → JSX ──────────────────────────────────────────────────

/** Escape characters that are special in JSX text content.
 *  Called on raw markdown text BEFORE parseInline adds JSX tags. */
function escapeJsx(text) {
  return text.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/\{/g, '&#123;')
             .replace(/\}/g, '&#125;');
}

function parseInline(text) {
  // First escape JSX-special chars in the raw text
  let r = escapeJsx(text);
  // bold **…**
  r = r.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // italic _…_  (only between word boundaries to avoid false positives)
  r = r.replace(/\b_(.*?)_\b/g, '<em>$1</em>');
  // inline code `…`
  r = r.replace(/`(.*?)`/g, '<DocInlineCode>$1</DocInlineCode>');
  // links [text](url)
  r = r.replace(/\[(.*?)\]\((.*?)\)/g, '<DocLink href="$2">$1</DocLink>');
  return r;
}

// ── Convert the raw markdown (from searchContent) → { toc, jsxLines } ──────
function markdownToJsx(md) {
  const lines = md.split('\n');
  const toc = [];
  const jsx = [];
  let images = null; // will become an array if figures are found

  let inCodeBlock = false;
  let codeLang = '';
  let codeLines = [];

  let inTable = false;
  let tableHeaderDone = false;

  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Code fences ──
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.trim().replace('```', '').trim();
        codeLines = [];
      } else {
        inCodeBlock = false;
        const code = codeLines.join('\n').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        jsx.push(`      <DocCodeBlock code={\`${code}\`} />`);
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // ── BibTeX block (no code fences, starts with @type{) ──
    if (/^@\w+\{/.test(line.trim())) {
      if (inList) { jsx.push('      </DocList>'); inList = false; }
      const bibLines = [line];
      let j = i + 1;
      while (j < lines.length) {
        bibLines.push(lines[j]);
        if (lines[j].trim() === '}') { j++; break; }
        j++;
      }
      i = j - 1; // skip ahead
      const bibCode = bibLines.join('\n').replace(/`/g, '\\`').replace(/\$/g, '\\$');
      jsx.push(`      <DocCodeBlock code={\`${bibCode}\`} />`);
      continue;
    }

    // ── Standalone "bibtex" label (from stripped code fences) ──
    if (line.trim() === 'bibtex') {
      continue;
    }

    // ── Horizontal rules ──
    if (/^---+\s*$/.test(line.trim())) {
      // close any open list
      if (inList) { jsx.push('      </DocList>'); inList = false; }
      continue;
    }

    // ── HTML figure blocks — extract image and render ──
    if (/^\s*<figure/.test(line)) {
      if (inList) { jsx.push('      </DocList>'); inList = false; }
      if (inTable) {
        jsx.push('        </tbody>');
        jsx.push('      </table>');
        inTable = false;
      }
      // Collect all lines of this figure block
      const figLines = [line];
      let j = i + 1;
      while (j < lines.length && !/<\/figure>/.test(lines[j])) {
        figLines.push(lines[j]);
        j++;
      }
      if (j < lines.length) { figLines.push(lines[j]); j++; }
      i = j - 1; // skip ahead

      const figBlock = figLines.join('\n');
      const srcMatch = figBlock.match(/src="([^"]+)"/);
      const altMatch = figBlock.match(/alt="([^"]+)"/);
      const capMatch = figBlock.match(/<figcaption><em>([^<]+)<\/em><\/figcaption>/);
      const widthMatch = figBlock.match(/<figure[^>]*style="[^"]*width:\s*(\d+%?)/);

      if (srcMatch) {
        const resolved = resolveImagePath(srcMatch[1]);
        if (resolved) {
          const importName = 'img_' + resolved.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
          if (!images) images = [];
          images.push({ importName, resolvedPath: resolved });
          const alt = altMatch ? escapeJsx(altMatch[1]) : '';
          const width = widthMatch ? widthMatch[1] : '100%';
          jsx.push(`      <Box sx={{ width: "${width}", margin: "1.25rem auto", textAlign: "center" }}>`);
          jsx.push(`        <img src={${importName}} alt="${alt}" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "6px" }} />`);
          if (capMatch) {
            jsx.push(`        <Box component="figcaption" sx={{ mt: 1, fontStyle: "italic", color: "#666", fontSize: "0.875rem" }}>${escapeJsx(capMatch[1])}</Box>`);
          }
          jsx.push(`      </Box>`);
        }
      }
      continue;
    }
    // ── Standalone img/figcaption/closing-figure tags (outside figure blocks) ──
    if (/^\s*<(img|figcaption|\/figure|\/figcaption|!--)/.test(line)) {
      continue;
    }

    // ── Orphaned HTML attributes (from stripped <img> tags) ──
    if (/^\s*(alt="|style="|src="|class="|\/\s*>)/.test(line.trim())) {
      continue;
    }

    // ── HTML comment lines ──
    if (/^\s*<!--.*-->\s*$/.test(line.trim())) {
      continue;
    }

    // ── Empty lines ──
    if (line.trim() === '') {
      if (inList) { jsx.push('      </DocList>'); inList = false; }
      continue;
    }

    // ── Headers ──
    const hMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) {
      if (inList) { jsx.push('      </DocList>'); inList = false; }
      if (inTable) {
        jsx.push('        </tbody>');
        jsx.push('      </table>');
        inTable = false;
      }
      const level = hMatch[1].length;
      const rawText = hMatch[2].trim();
      const cleanText = rawText.replace(/[*_`\[\]()]/g, '');
      const id = cleanText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

      if (level >= 2) {
        toc.push({ id, title: cleanText, level });
      }

      jsx.push(`      <DocHeader level={${level}} id="${id}">${parseInline(rawText)}</DocHeader>`);
      continue;
    }

    // ── Tables ──
    if (line.trim().startsWith('|')) {
      if (inList) { jsx.push('      </DocList>'); inList = false; }

      // separator row (|---|---|)
      if (/^\|[\s-:|]+\|$/.test(line.trim()) || line.includes('---')) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaderDone = false;
        jsx.push('      <table style={tableStyle}>');
        jsx.push('        <thead>');
      }

      const cells = line.split('|').map(c => c.trim()).filter(Boolean);

      jsx.push('          <tr>');
      for (const cell of cells) {
        const tag = !tableHeaderDone ? 'th' : 'td';
        const style = !tableHeaderDone ? 'thStyle' : 'tdStyle';
        jsx.push(`            <${tag} style={${style}}>${parseInline(cell)}</${tag}>`);
      }
      jsx.push('          </tr>');

      if (!tableHeaderDone) {
        tableHeaderDone = true;
        jsx.push('        </thead>');
        jsx.push('        <tbody>');
      }
      continue;
    }

    // Close table if we're no longer in one
    if (inTable) {
      jsx.push('        </tbody>');
      jsx.push('      </table>');
      inTable = false;
    }

    // ── Unordered list items ──
    const liMatch = line.trim().match(/^[-*]\s+(.+)$/);
    if (liMatch) {
      if (!inList) { jsx.push('      <DocList>'); inList = true; }
      jsx.push(`        <DocListItem>${parseInline(liMatch[1])}</DocListItem>`);
      continue;
    }

    // ── Ordered list items ──
    const oliMatch = line.trim().match(/^\d+\.\s+(.+)$/);
    if (oliMatch) {
      if (!inList) { jsx.push('      <DocList>'); inList = true; }
      jsx.push(`        <DocListItem>${parseInline(oliMatch[1])}</DocListItem>`);
      continue;
    }

    // If we were in a list, close it since this isn't a list item
    if (inList) { jsx.push('      </DocList>'); inList = false; }

    // ── Continuation indented lines (sub-items like "   Highlighted PDF …") ──
    if (/^\s{2,}/.test(line) && line.trim().length > 0) {
      // treat as a list item if content is there
      jsx.push(`      <DocText>${parseInline(line.trim())}</DocText>`);
      continue;
    }

    // ── Paragraph / plain text ──
    // skip <p> tags
    if (line.trim().startsWith('<p') || line.trim().startsWith('</p')) continue;

    // Blockquote: > text
    const bqMatch = line.trim().match(/^>\s*(.*)$/);
    if (bqMatch) {
      const bqText = bqMatch[1];
      let calloutType = 'info';
      if (/^warning/i.test(bqText)) calloutType = 'warning';
      else if (/^error/i.test(bqText)) calloutType = 'error';
      jsx.push(`      <DocCallout type="${calloutType}">${parseInline(bqText)}</DocCallout>`);
      continue;
    }

    jsx.push(`      <DocText>${parseInline(line.trim())}</DocText>`);
  }

  // Close any open structures
  if (inList) jsx.push('      </DocList>');
  if (inTable) {
    jsx.push('        </tbody>');
    jsx.push('      </table>');
  }

  return { toc, jsx, images: images || [] };
}

// ── Process all files ──────────────────────────────────────────────────────
function processDir(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      // Skip v3.3 — those files are manually written
      if (entry === 'v3.3') continue;
      processDir(full);
      continue;
    }
    if (!entry.endsWith('.tsx')) continue;
    // Skip known backup files
    if (entry.includes(' copy')) continue;

    processFile(full);
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract searchContent template literal (handle both LF and CRLF)
  const scMatch = content.match(/export const searchContent = `\r?\n([\s\S]*?)\r?\n`;/);
  if (!scMatch) {
    console.log(`  SKIP (no searchContent): ${filePath}`);
    return;
  }

  // Normalize CRLF → LF
  const markdown = scMatch[1].replace(/\r\n/g, '\n');

  // Extract component name from the export default function
  const fnMatch = content.match(/export default function (\w+)/);
  if (!fnMatch) {
    console.log(`  SKIP (no default export): ${filePath}`);
    return;
  }
  const componentName = fnMatch[1];

  // Convert markdown → JSX
  const { toc, jsx, images } = markdownToJsx(markdown);

  // Deduplicate images
  const seenImports = new Set();
  const uniqueImages = [];
  for (const img of images) {
    if (!seenImports.has(img.importName)) {
      seenImports.add(img.importName);
      uniqueImages.push(img);
    }
  }

  // Compute the relative path from this file to the photos dir
  const fileDir = path.dirname(filePath);
  const photosRelDir = path.relative(fileDir, photosDir).replace(/\\/g, '/');

  // Build the new file
  const parts = [];

  // Imports (always the same)
  parts.push(`import React from "react";`);
  parts.push(`import { Box } from "@mui/material";`);
  parts.push(`import {`);
  parts.push(`  DocHeader,`);
  parts.push(`  DocText,`);
  parts.push(`  DocLink,`);
  parts.push(`  DocList,`);
  parts.push(`  DocListItem,`);
  parts.push(`  DocInlineCode,`);
  parts.push(`  DocCodeBlock,`);
  parts.push(`  DocCallout`);
  parts.push(`} from "../../components/DocComponents";`);

  // Image imports
  for (const img of uniqueImages) {
    parts.push(`import ${img.importName} from "${photosRelDir}/${img.resolvedPath}";`);
  }
  parts.push(``);

  // TOC
  if (toc.length === 0) {
    parts.push(`export const toc = [];`);
  } else {
    parts.push(`export const toc = [`);
    for (const t of toc) {
      parts.push(`  { id: "${t.id}", title: "${t.title.replace(/"/g, '\\"')}", level: ${t.level} },`);
    }
    parts.push(`];`);
  }
  parts.push(``);

  // searchContent — keep it as-is from the original
  parts.push(`export const searchContent = \``);
  parts.push(markdown);
  parts.push(`\`;`);
  parts.push(``);

  // Style constants
  parts.push(`const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };`);
  parts.push(`const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };`);
  parts.push(`const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };`);
  parts.push(``);

  // Component
  parts.push(`export default function ${componentName}() {`);
  parts.push(`  return (`);
  parts.push(`    <Box>`);
  for (const line of jsx) {
    parts.push(line);
  }
  parts.push(`    </Box>`);
  parts.push(`  );`);
  parts.push(`}`);
  parts.push(``);

  fs.writeFileSync(filePath, parts.join('\n'));
  console.log(`  FIXED: ${filePath} (${toc.length} toc entries, ${jsx.length} jsx lines)`);
}

console.log('Regenerating component bodies from searchContent...\n');
processDir(pagesDir);
console.log('\nDone!');
