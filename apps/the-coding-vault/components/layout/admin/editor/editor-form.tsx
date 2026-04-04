'use client';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bubbles/ui/shadcn/form';
import { Button } from '@bubbles/ui/shadcn/button';
import { Input } from '@bubbles/ui/shadcn/input';
import { useForm } from 'react-hook-form';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@bubbles/ui/shadcn/select';
import { ICategories } from '@/types/types';
import { OutputData } from '@editorjs/editorjs';
import { toast } from '@bubbles/ui/lib/sonner';
import { Textarea } from '@bubbles/ui/shadcn/textarea';
import Spinner from '@/components/ui/loading/spinner';

interface IEditorFormValues {
  title: string;
  slug: string;
  categoryId: string;
  content: string;
  authorId: string;
  order: number;
  description: string;
  categories: ICategories[];
}

type EditorFormProviderProps = Parameters<typeof Form>[0];

const EditorForm = ({
  editorOutput,
  authorId,
  maxOrder,
  categories = [] as ICategories[],
}: {
  editorOutput: () => Promise<OutputData | undefined>;
  authorId: string;
  maxOrder: number;
  categories: ICategories[];
}) => {
  const form = useForm<IEditorFormValues>({
    defaultValues: {
      title: '',
      slug: '',
      categoryId: '',
      content: '',
      authorId: authorId || 'unknown',
      order: maxOrder + 1 || 0,
      description: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;
  const onSubmit = async (values: IEditorFormValues) => {
    try {
      const content = await editorOutput();
      if (content && content.blocks && content.blocks.length === 0) {
        toast.error('It is required to have at least one block in the editor.');
        return;
      }
      const formData = new FormData();
      formData.append('content', JSON.stringify(content));
      formData.append('title', values.title);
      formData.append('slug', values.slug);
      formData.append('categoryId', values.categoryId);
      formData.append('authorId', values.authorId);
      formData.append('order', values.order.toString());
      formData.append('description', values.description);

      const response = await fetch('/api/vault/save-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      if (!response.ok) {
        const errorText = await response.json();
        console.error(
          'Error saving entry:',
          errorText.message || 'Unknown error',
        );
        toast.error(`${errorText.message || 'Failed to save entry.'}`);
        return;
      }
      const data = await response.json();
      toast.success(`${data.message || 'Entry saved successfully!'}`);
    } catch (error) {
      console.error('Error saving editor content:', error);
      toast.error('An error occurred while saving the entry.');
    }
  };

  return (
    <>
      <Form {...(form as unknown as EditorFormProviderProps)}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <FormField
            control={form.control as never}
            name="title"
            rules={{ required: 'Titel ist erforderlich' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-bold">Titel</FormLabel>
                <FormControl>
                  <Input
                    className="text-lg"
                    placeholder="Titel eingeben"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="min-h-[3rem] text-base font-semibold">
                  Dies ist der Titel deines Eintrags. Er sollte beschreibend und
                  prägnant sein.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as never}
            name="slug"
            rules={{ required: 'Slug ist erforderlich' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-bold">Slug</FormLabel>
                <FormControl>
                  <Input
                    className="text-lg"
                    placeholder="Eintrags-Slug eingeben"
                    {...field}
                    onBlur={(e) => {
                      const value = e.target.value;
                      const slug = value
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, '-') // Leerzeichen in Bindestriche
                        .replace(/-{2,}/g, '-') // doppelte Bindestriche vermeiden
                        .replace(/[^a-z0-9-]/g, '') // nicht erlaubte Zeichen entfernen
                        .replace(/(^-+)|(-+$)/g, ''); // führende/abschließende Bindestriche entfernen
                      form.setValue('slug', slug);
                    }}
                  />
                </FormControl>
                <FormDescription className="min-h-[3rem] text-base font-semibold">
                  Der Slug ist eine URL-freundliche Version des Titels. Zum
                  Beispiel &quot;mein-erster-eintrag&quot;.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as never}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-bold">
                  Sortierreihenfolge
                </FormLabel>
                <FormControl>
                  <Input
                    className="text-lg"
                    placeholder="Sortierreihenfolge eingeben"
                    type="number"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="min-h-[3rem] text-base font-semibold">
                  Aktuell ist{' '}
                  <span className="text-primary font-bold">{maxOrder}</span> der
                  höchste{' '}
                  <span className="text-primary font-bold">Ordnungswert</span>{' '}
                  für die Sortierung von Vault-Einträgen. Wenn du es unverändert
                  lässt, wird es standardmäßig auf{' '}
                  <span className="text-primary font-bold">{maxOrder + 1}</span>{' '}
                  gesetzt.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as never}
            name="categoryId"
            rules={{ required: 'Kategorie ist erforderlich' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-bold">Kategorie</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="cursor-pointer text-lg">
                      <SelectValue
                        className=""
                        placeholder="Wähle eine Kategorie"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem
                        className="cursor-pointer text-lg"
                        key={category.id}
                        value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="min-h-[3rem] text-base font-semibold">
                  Wähle eine Kategorie für deinen Eintrag. Dies hilft bei der
                  Organisation deiner Inhalte.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as never}
            name="description"
            rules={{ required: 'Beschreibung ist erforderlich' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-bold">
                  Beschreibung
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="text-lg"
                    placeholder="Beschreibung eingeben"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="min-h-[3rem] text-base font-semibold">
                  Dies ist die Beschreibung deines Eintrags. Sie sollte mehr
                  Kontext und Details liefern, jedoch auch prägnant sein. Sie
                  wird in den Open Graph Metadaten für Social Media Sharing
                  verwendet.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            size={'lg'}
            className="place-self-start text-lg font-bold">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Spinner />
                <span>Speichern...</span>
              </span>
            ) : (
              'Eintrag speichern'
            )}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default EditorForm;
