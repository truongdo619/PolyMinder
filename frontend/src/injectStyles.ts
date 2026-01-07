// pdf_highlighter/utils/injectStyles.ts

interface EntityType {
  type: string;
  bgColor: string;
}

interface RelationType {
  type: string;
  color: string;
}

interface Setting {
  entity_types: EntityType[];
  relation_types: RelationType[];
}

export function injectDynamicCSS(setting: Setting) {
  const rules: string[] = [];

  // Entity types (e.g., POLYMER, INORGANIC)
  for (const { type, bgColor } of setting.entity_types) {
    rules.push(`
      .${type} {
        background: ${bgColor};
        border-color: ${bgColor};
        color: #fff;
      }
      .${type}_COLOR {
        color: ${bgColor} !important;
      }
    `);
  }

  // Relation types (e.g., has_property, refers_to)
  for (const { type, color } of setting.relation_types) {
    rules.push(`
      .${type}_COLOR {
        color: ${color} !important;
        border: 2px solid gray;
        border-radius: 5px;
      }
    `);
  }

  // Inject into <head>
  const style = document.createElement('style');
  style.textContent = rules.join('\n');
  document.head.appendChild(style);
}
