/**
 * Recursive checklist node rendered inside markdown content.
 *
 * Use this shape for checklist-style MDX blocks produced by the serializer.
 */
export type ChecklistItem = {
  content: string;
  meta?: {
    checked?: boolean;
  };
  items?: ChecklistItem[];
};
