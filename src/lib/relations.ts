/**
 * Relation types. Most are symmetric — the label is the same on both sides
 * of the relation. Two pairs are directional: whoever sends "Parent of"
 * shows as "Parent of X" on their own side, while X sees "Child of [sender]"
 * on theirs (and vice versa) — see inverseOf below.
 *
 * To add a new relation type later: add one entry here. No migration needed
 * — the column is plain text, not a fixed database enum, specifically so
 * this list can grow without a schema change.
 */
export type RelationType =
  | "married_to"
  | "engaged_to"
  | "dating"
  | "sibling_to"
  | "related_to"
  | "colleague_of"
  | "dormmate_of"
  | "enemy_of"
  | "parent_of"
  | "child_of"
  | "godparent_of"
  | "godchild_of";

type RelationMeta = {
  label: string;
  /** If set, this is a directional type and the other side sees this type/label instead. */
  inverseOf?: RelationType;
};

export const RELATION_META: Record<RelationType, RelationMeta> = {
  married_to: { label: "Married to" },
  engaged_to: { label: "Engaged to" },
  dating: { label: "Dating" },
  sibling_to: { label: "Sibling to" },
  related_to: { label: "Related to" },
  colleague_of: { label: "Colleague of" },
  dormmate_of: { label: "Dormmate of" },
  enemy_of: { label: "Enemy of" },
  parent_of: { label: "Parent of", inverseOf: "child_of" },
  child_of: { label: "Child of", inverseOf: "parent_of" },
  godparent_of: { label: "Godparent of", inverseOf: "godchild_of" },
  godchild_of: { label: "Godchild of", inverseOf: "godparent_of" },
};

export const RELATION_TYPES = Object.keys(RELATION_META) as RelationType[];

export function relationLabel(type: string): string {
  return RELATION_META[type as RelationType]?.label ?? type;
}

/** The type to show on the OTHER character's side of this relation. */
export function inverseRelationType(type: string): RelationType {
  const meta = RELATION_META[type as RelationType];
  if (!meta) return type as RelationType;
  return meta.inverseOf ?? (type as RelationType);
}
