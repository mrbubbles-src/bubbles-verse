import { TChecklistItem } from '@/types/types';
import { replaceChecklistLinksWithVaultLinks } from '@/lib/utils';

export function VaultChecklist({
  items,
  spacing: nestedSpacing,
}: {
  items: TChecklistItem[];
  spacing?: string;
}) {
  return (
    <ul className={`list-none space-y-2 pl-5 text-xl ${nestedSpacing || ''}`}>
      {items.map((item, idx) => (
        <li key={idx} className="task-list-item">
          <label className="flex cursor-not-allowed items-start gap-2">
            <input
              type="checkbox"
              checked={item.meta?.checked ?? false}
              readOnly
              className="peer hidden"
            />
            <span className="peer-checked:bg-primary peer-checked:border-checkmark bg-background border-checkmark peer-checked:before:text-checkmark grid h-6 w-6 place-items-center rounded border before:content-[''] peer-checked:before:text-sm peer-checked:before:content-['✔']" />
            <span>{replaceChecklistLinksWithVaultLinks(item.content)}</span>
          </label>
          {item.items && item.items.length > 0 && (
            <VaultChecklist items={item.items} spacing="mt-1" />
          )}
        </li>
      ))}
    </ul>
  );
}
