export interface EntityTypeDef {
  type: string;
  labels?: string[];
  bgColor: string;
  borderColor: string;
}

export interface RelationArg {
  role: string;
  targets: string[];
}

export interface RelationTypeDef {
  type: string;
  labels?: string[];
  color?: string;
  dashArray?: string;
  args: RelationArg[];
}

export interface Relation {
  type: string;
  arg_id: string;
  arg_type: string;
  arg_text: string;
  [key: string]: string;
}

export interface EntityEditSaveData {
  entityType: string;
  userComment: string;
  headPos: number;
  tailPos: number;
  relations: Relation[];
}

export function getContrastColor(bgColor: string): string {
  const hex = bgColor.replace('#', '');
  if (hex.length !== 6) return '#000000';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function getRelationTypesForSource(
  relationTypes: RelationTypeDef[],
  sourceEntityType: string
): RelationTypeDef[] {
  return relationTypes.filter(rt =>
    rt.args.some(a =>
      a.role === 'Arg1' &&
      (a.targets.includes(sourceEntityType) || a.targets.includes('<ENTITY>'))
    )
  );
}

export function getValidTargetTypesForRelation(
  relationTypes: RelationTypeDef[],
  relationType: string
): string[] {
  const rt = relationTypes.find(r => r.type === relationType);
  if (!rt) return [];
  return rt.args.find(a => a.role === 'Arg2')?.targets ?? [];
}

export function toRelations(relations: Array<Object>): Relation[] {
  return relations as unknown as Relation[];
}
