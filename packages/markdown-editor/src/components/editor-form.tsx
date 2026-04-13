'use client';

import { Button } from '@bubbles/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@bubbles/ui/shadcn/field';
import { Input } from '@bubbles/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bubbles/ui/shadcn/select';
import { Textarea } from '@bubbles/ui/shadcn/textarea';
import type { FormEvent } from 'react';
import { useEffect, useId, useState } from 'react';

import { useDraftAutosave } from '../hooks/use-draft-autosave';
import { clearCreateDraft, clearEditDraft } from '../lib/draft-storage';
import { serializeToMdx } from '../lib/serialize-to-mdx';
import { generateSlug, getHeaderLevelOneTitle } from '../lib/slug-utils';
import type { EditorFormProps, MarkdownEditorStatus } from '../types/editor';

/**
 * Convert a comma-separated tags field into the package payload shape.
 *
 * @param value - Raw input value from the tags text field.
 * @returns Trimmed tag list without empty entries.
 */
function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Default metadata form rendered by `MarkdownEditor` when no `renderForm`
 * override is provided.
 *
 * The form mirrors the reference package surface: title is derived from the
 * first H1 block, slug auto-follows until manually edited, and submit returns
 * serialized MDX through `onSuccess`.
 *
 * @param props - Current editor state plus optional submit callback.
 * @returns Metadata form for the shared markdown editor surface.
 */
export function EditorForm({
  editorContent,
  editorOutput,
  editorReady,
  initialData,
  isEditMode,
  onSuccess,
}: EditorFormProps) {
  const [draftSavingDisabled, setDraftSavingDisabled] = useState(false);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [tagsText, setTagsText] = useState((initialData?.tags ?? []).join(', '));
  const [status, setStatus] = useState<MarkdownEditorStatus>(
    initialData?.status ?? 'unpublished'
  );
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [autoTitle, setAutoTitle] = useState<string | undefined>(
    initialData?.title
  );
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const statusLabelId = useId();

  useEffect(() => {
    setDraftSavingDisabled(false);
    setDescription(initialData?.description ?? '');
    setTagsText((initialData?.tags ?? []).join(', '));
    setStatus(initialData?.status ?? 'unpublished');
    setTitle(initialData?.title ?? '');
    setAutoTitle(initialData?.title);
    setSlug(initialData?.slug ?? '');
    setSlugManuallyEdited(false);
  }, [initialData]);

  useEffect(() => {
    let cancelled = false;

    if (!editorReady) {
      return () => {
        cancelled = true;
      };
    }

    const syncDerivedMetadata = async () => {
      const content = editorContent ?? (await editorOutput());

      if (cancelled || !content) {
        return;
      }

      const derivedTitle = getHeaderLevelOneTitle(content);

      if (derivedTitle) {
        setAutoTitle(derivedTitle);
        setTitle(derivedTitle);
        setSlug((currentSlug) => {
          if (!slugManuallyEdited || currentSlug.length === 0) {
            return generateSlug(derivedTitle);
          }

          return currentSlug;
        });
        return;
      }

      setAutoTitle(undefined);
      setTitle('');

      if (!slugManuallyEdited) {
        setSlug('');
      }
    };

    void syncDerivedMetadata();

    return () => {
      cancelled = true;
    };
  }, [editorContent, editorOutput, editorReady, slugManuallyEdited]);

  useDraftAutosave({
    editorContent,
    formValues: {
      description,
      slug,
      status,
      tags: parseTags(tagsText),
      title,
    },
    initialData,
    isEditMode,
    disabled: draftSavingDisabled,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editorReady) {
      return;
    }

    const output = await editorOutput();

    if (!output) {
      return;
    }

    const normalizedTitle = getHeaderLevelOneTitle(output) ?? title;
    const normalizedSlug = generateSlug(slug);
    setSlug(normalizedSlug);

    if (!onSuccess) {
      return;
    }

    setDraftSavingDisabled(true);

    try {
      await Promise.resolve(
        onSuccess({
          description: description.trim(),
          editorContent: output,
          isEditMode,
          serializedContent: serializeToMdx(output),
          slug: normalizedSlug,
          status,
          tags: parseTags(tagsText),
          title: normalizedTitle,
        })
      );

      if (isEditMode) {
        clearEditDraft();
        return;
      }

      clearCreateDraft();
    } catch (error) {
      setDraftSavingDisabled(false);
      throw error;
    }
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit entry metadata' : 'Entry metadata'}</CardTitle>
        <CardDescription>
          Keep the metadata package-level and app-agnostic. Persistence and
          navigation stay in the consuming app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Title</FieldLabel>
              <div className="rounded-md border border-input bg-input/20 px-2 py-2 text-sm">
                {autoTitle ||
                  title ||
                  'The first H1 block becomes the entry title.'}
              </div>
              <FieldDescription>
                Derived from the first level-1 heading in the editor content.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="markdown-editor-slug">Slug</FieldLabel>
              <Input
                id="markdown-editor-slug"
                placeholder="story-driven-editor"
                value={slug}
                onBlur={(event) => {
                  setSlug(generateSlug(event.target.value));
                }}
                onChange={(event) => {
                  setSlugManuallyEdited(true);
                  setSlug(event.target.value);
                }}
              />
              <FieldDescription>
                Auto-generated from the title until you edit it manually.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="markdown-editor-description">
                Description
              </FieldLabel>
              <Textarea
                id="markdown-editor-description"
                rows={4}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                }}
              />
              <FieldDescription>
                Optional summary used by the consuming app for cards, SEO, or
                previews.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="markdown-editor-tags">Tags</FieldLabel>
              <Input
                id="markdown-editor-tags"
                placeholder="nextjs, mdx, editorjs"
                value={tagsText}
                onChange={(event) => {
                  setTagsText(event.target.value);
                }}
              />
              <FieldDescription>
                Enter comma-separated tags. The package emits them as a string
                array.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel id={statusLabelId}>Status</FieldLabel>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as MarkdownEditorStatus);
                }}
              >
                <SelectTrigger
                  aria-labelledby={statusLabelId}
                  id="markdown-editor-status"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="unpublished">Unpublished</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Keep the workflow intentionally small: published or unpublished
                only.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <div className="flex justify-end">
            <Button disabled={!editorReady} type="submit">
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
