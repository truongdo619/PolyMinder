export interface EntityType {
  type: string;
  labels: string[];
  bgColor: string;
  borderColor: string;
}

export interface RelationType {
  type: string;
  dashArray: string;
  color: string;
  labels: string[];
  args: { role: string; targets: string[] }[];
}

export interface EventType {
  type: string;
  labels: string[];
  bgColor: string;
  borderColor: string;
  arcs?: { type: string; labels: string[]; color: string }[];
}


export const collData: {
  entity_types: EntityType[];
  relation_types: RelationType[];
  event_types: EventType[];
} = {
  entity_types: [
    {
      type: "POLYMER",
      labels: ["POLYMER"],
      bgColor: "#ff4500",
      borderColor: "darken",
    },
    {
      type: "POLYMER_FAMILY",
      labels: ["POLYMER_FAMILY"],
      bgColor: "#00ff00",
      borderColor: "darken",
    },
    {
      type: "PROP_VALUE",
      labels: ["PROP_VALUE"],
      bgColor: "#ffd700",
      borderColor: "darken",
    },
    {
      type: "PROP_NAME",
      labels: ["PROP_NAME"],
      bgColor: "#1e90ff",
      borderColor: "darken",
    },
    {
      type: "MONOMER",
      labels: ["MONOMER"],
      bgColor: "#B8BDD3",
      borderColor: "darken",
    },
    {
      type: "ORGANIC",
      labels: ["ORGANIC"],
      bgColor: "#ff00ff",
      borderColor: "darken",
    },
    {
      type: "INORGANIC",
      labels: ["INORGANIC"],
      bgColor: "#00ffff",
      borderColor: "darken",
    },
    {
      type: "MATERIAL_AMOUNT",
      labels: ["MATERIAL_AMOUNT"],
      bgColor: "#a0522d",
      borderColor: "darken",
    },
    {
      type: "CONDITION",
      labels: ["CONDITION"],
      bgColor: "#ffe000",
      borderColor: "darken",
    },
    {
      type: "REF_EXP",
      labels: ["REF_EXP"],
      bgColor: "#bd0ea5",
      borderColor: "darken",
    },
    {
      type: "OTHER_MATERIAL",
      labels: ["OTHER_MATERIAL"],
      bgColor: "#1976d2",
      borderColor: "darken",
    },
    {
      type: "COMPOSITE",
      labels: ["COMPOSITE"],
      bgColor: "#00ff88",
      borderColor: "darken",
    },
    {
      type: "SYN_METHOD",
      labels: ["SYN_METHOD"],
      bgColor: "#f09bc5",
      borderColor: "darken",
    },
    {
      type: "CHAR_METHOD",
      labels: ["CHAR_METHOD"],
      bgColor: "#f3e9e3",
      borderColor: "darken",
    },
  ],
  relation_types: [
    {
      type: "<OVERLAP>",
      dashArray: "3,3",
      color: "black",
      labels: ["<OVERLAP>", "O"],
      args: [
        { role: "Arg1", targets: ["<ENTITY>"] },
        { role: "Arg2", targets: ["<ENTITY>"] },
      ],
    },
    {
      type: "has_property",
      labels: ["has_property", "has_p"],
      dashArray: "3,3",
      color: "purple",
      args: [
        {
          role: "Arg1",
          targets: [
            "POLYMER",
            "POLYMER_FAMILY",
            "MONOMER",
            "ORGANIC",
            "INORGANIC",
            "COMPOSITE",
            "OTHER_MATERIAL",
            "REF_EXP",
          ],
        },
        {
          role: "Arg2",
          targets: ["PROP_NAME", "REF_EXP"],
        },
      ],
    },
    {
      type: "has_value",
      labels: ["has_value", "has_v"],
      dashArray: "3,3",
      color: "green",
      args: [
        {
          role: "Arg1",
          targets: [
            "POLYMER",
            "POLYMER_FAMILY",
            "MONOMER",
            "ORGANIC",
            "INORGANIC",
            "COMPOSITE",
            "OTHER_MATERIAL",
            "PROP_NAME",
            "REF_EXP",
          ],
        },
        {
          role: "Arg2",
          targets: ["PROP_VALUE"],
        },
      ],
    },
    {
      type: "has_amount",
      labels: ["has_amount", "has_a"],
      dashArray: "3,3",
      color: "red",
      args: [
        {
          role: "Arg1",
          targets: [
            "POLYMER",
            "POLYMER_FAMILY",
            "MONOMER",
            "ORGANIC",
            "INORGANIC",
            "COMPOSITE",
            "OTHER_MATERIAL",
            "REF_EXP",
          ],
        },
        {
          role: "Arg2",
          targets: ["MATERIAL_AMOUNT"],
        },
      ],
    },
    {
      type: "has_condition",
      labels: ["has_condition", "has_c"],
      dashArray: "3,3",
      color: "gray",
      args: [
        {
          role: "Arg1",
          targets: ["PROP_NAME", "PROP_VALUE", "REF_EXP"],
        },
        {
          role: "Arg2",
          targets: ["CONDITION"],
        },
      ],
    },
    {
      type: "abbreviation_of",
      labels: ["abbreviation_of", "abbre"],
      dashArray: "3,3",
      color: "blue",
      args: [
        {
          role: "Arg1",
          targets: [
            "POLYMER",
            "POLYMER_FAMILY",
            "MONOMER",
            "ORGANIC",
            "INORGANIC",
            "COMPOSITE",
            "OTHER_MATERIAL",
            "PROP_NAME",
            "SYN_METHOD",
            "CHAR_METHOD",
          ],
        },
        {
          role: "Arg2",
          targets: [
            "POLYMER",
            "POLYMER_FAMILY",
            "MONOMER",
            "ORGANIC",
            "INORGANIC",
            "COMPOSITE",
            "OTHER_MATERIAL",
            "PROP_NAME",
            "SYN_METHOD",
            "CHAR_METHOD",
          ],
        },
      ],
    },
    {
      type: "refers_to",
      labels: ["refers_to", "refer"],
      dashArray: "3,3",
      color: "purple",
      args: [
        {
          role: "Arg1",
          targets: ["REF_EXP"],
        },
        {
          role: "Arg2",
          targets: [
            "POLYMER",
            "POLYMER_FAMILY",
            "MONOMER",
            "ORGANIC",
            "INORGANIC",
            "COMPOSITE",
            "OTHER_MATERIAL",
            "PROP_NAME",
            "SYN_METHOD",
            "CHAR_METHOD",
            "REF_EXP",
          ],
        },
      ],
    },
    {
      type: "synthesised_by",
      labels: ["synthesised_by", "synth"],
      dashArray: "3,3",
      color: "red ",
      args: [
        {
          role: "Arg1",
          targets: [
            "POLYMER",
            "POLYMER_FAMILY",
            "MONOMER",
            "ORGANIC",
            "INORGANIC",
            "COMPOSITE",
            "OTHER_MATERIAL",
            "REF_EXP",
          ],
        },
        {
          role: "Arg2",
          targets: ["SYN_METHOD"],
        },
      ],
    },
    {
      type: "characterized_by",
      labels: ["characterized_by", "chara"],
      dashArray: "3,3",
      color: "black",
      args: [
        {
          role: "Arg1",
          targets: [
            "POLYMER",
            "POLYMER_FAMILY",
            "MONOMER",
            "ORGANIC",
            "INORGANIC",
            "COMPOSITE",
            "OTHER_MATERIAL",
            "REF_EXP",
            "PROP_NAME",
          ],
        },
        {
          role: "Arg2",
          targets: ["CHAR_METHOD"],
        },
      ],
    },
  ],
  event_types: [ {
    type   : 'PropertyInfo',
    labels : ['PropertyInfo', 'PropInfo'],
    bgColor: '#32CD32',
    borderColor: 'darken',
    /* Unlike relations, events originate from a span of text and can take
        several arguments */
    arcs   : [
        {type: 'Polymer', labels: ['Polymer','Polymer'], color: '#b22222' },
        // Just like the event itself, its arguments can be styled
        {type: 'Value', labels: ['Value','Value'], color: '#cd6600'},
        {type: 'Condition', labels: ['Condition','Condition'], color: '#ffe000' },
        {type: 'Char_method', labels: ['Char_method','Char_method'], color: '#696969' }
    ]
} ]
};