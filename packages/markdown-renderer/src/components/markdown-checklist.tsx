import type { ChecklistItem } from '../types/checklist';

import { replaceChecklistLinksWithMarkdownLinks } from '../lib/utils';

export type MarkdownChecklistProps = {
  items: ChecklistItem[];
  spacing?: string;
};

/**
 * Render nested readonly checklist items with the reference checkbox styling.
 *
 * @param props - Checklist tree and optional spacing override for nested lists.
 * @returns Checklist markup suitable for rendered MDX blocks.
 */
export function MarkdownChecklist({
  items,
  spacing: nestedSpacing,
}: MarkdownChecklistProps) {
  return (
    <ul className={`list-none space-y-2 pl-5 text-xl ${nestedSpacing ?? ''}`}>
      {items.map((item, index) => (
        <li key={index} className="task-list-item">
          <label className="flex cursor-not-allowed items-start gap-2">
            <input
              type="checkbox"
              checked={item.meta?.checked ?? false}
              readOnly
              className="peer hidden"
            />
            <span className="peer-checked:bg-primary peer-checked:border-checkmark bg-background border-checkmark peer-checked:before:text-checkmark grid h-6 w-6 place-items-center rounded border before:content-[''] peer-checked:before:text-sm peer-checked:before:content-['✔']" />
            <span>{replaceChecklistLinksWithMarkdownLinks(item.content)}</span>
          </label>
          {item.items && item.items.length > 0 ? (
            <MarkdownChecklist items={item.items} spacing="mt-1" />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
