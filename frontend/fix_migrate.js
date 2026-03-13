const fs = require('fs');
let c = fs.readFileSync('scripts/docs-migration/migrate.js', 'utf8');

c = c.replace(/'const tableStyle:.+?\\n' \+/, "`const tableStyle: React.CSSProperties = { borderCollapse: \"collapse\", width: \"100%\", marginBottom: \"24px\", fontFamily: \"'Inter', sans-serif\", fontSize: \"0.875rem\", border: \"1px solid #e5e7eb\" };\\n` +");
c = c.replace(/'const thStyle:.+?\\n' \+/, "`const thStyle: React.CSSProperties = { borderBottom: \"2px solid #e5e7eb\", padding: \"12px 16px\", textAlign: \"left\", backgroundColor: \"#f9fafb\", color: \"#374151\", fontWeight: 600 };\\n` +");
c = c.replace(/'const tdStyle:.+?\\n' \+/, "`const tdStyle: React.CSSProperties = { borderBottom: \"1px solid #e5e7eb\", padding: \"12px 16px\", color: \"#4b5563\" };\\n\\n` +");

fs.writeFileSync('scripts/docs-migration/migrate.js', c);
