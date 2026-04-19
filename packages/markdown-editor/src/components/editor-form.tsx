'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

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
import { Controller, useForm, useWatch } from 'react-hook-form';

import type {
  EditorFormProps,
  MarkdownEditorInitialData,
  MarkdownEditorSlugStrategyInput,
  MarkdownEditorSlugStrategyResult,
  MarkdownEditorStatus,
} from '../types/editor';
import { useDraftAutosave } from '../hooks/use-draft-autosave';
import { clearCreateDraft, clearEditDraft } from '../lib/draft-storage';
import { serializeToMdx } from '../lib/serialize-to-mdx';
import {
  generateSlug,
  getHeaderLevelOneTitle,
  joinSlugSegments,
  normalizeSlugPath,
} from '../lib/slug-utils';

type EditorFormValues = {
  description: string;
  slug: string;
  status: MarkdownEditorStatus;
  tagsText: string;
  title: string;
};

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
 * Build the default RHF state from normalized package metadata.
 *
 * @param initialData - Initial metadata envelope passed into the shared editor.
 * @returns Stable default values for the package-level metadata form.
 */
function buildDefaultValues(
  initialData?: MarkdownEditorInitialData
): EditorFormValues {
  return {
    description: initialData?.description ?? '',
    slug: initialData?.slug ?? '',
    status: initialData?.status ?? 'unpublished',
    tagsText: (initialData?.tags ?? []).join(', '),
    title: initialData?.title ?? '',
  };
}

/**
 * Normalize a slug strategy result into the final path string.
 *
 * @param result - Raw strategy result from the app-provided hook.
 * @returns Normalized slug path compatible with package persistence.
 */
function normalizeSlugStrategyResult(
  result: MarkdownEditorSlugStrategyResult
): string {
  if (typeof result === 'string') {
    return normalizeSlugPath(result);
  }

  return joinSlugSegments([...result]);
}

/**
 * Resolve the default-form slug from either the package fallback or an
 * app-provided slug strategy.
 *
 * @param props - Title plus the current package context for slug derivation.
 * @returns Normalized slug or an empty string when no title is available.
 */
function resolveDerivedSlug({
  context,
  editorContent,
  initialData,
  isEditMode,
  slugStrategy,
  title,
}: MarkdownEditorSlugStrategyInput & {
  slugStrategy?: EditorFormProps['slugStrategy'];
}): string {
  if (!title) {
    return '';
  }

  if (!slugStrategy) {
    return generateSlug(title);
  }

  return normalizeSlugStrategyResult(
    slugStrategy({
      context,
      editorContent,
      initialData,
      isEditMode,
      title,
    })
  );
}

/**
 * Default metadata form rendered by `MarkdownEditor` when no `renderForm`
 * override is provided.
 *
 * The form keeps the reference title/slug flow intact while using
 * `react-hook-form` for field state and the current shadcn `Field` building
 * blocks for presentation.
 *
 * @param props - Current editor state, submit callback, and optional slug strategy.
 * @returns Metadata form for the shared markdown editor surface.
 */
export function EditorForm({
  draftStorageScope,
  editorContent,
  editorOutput,
  editorReady,
  initialData,
  isEditMode,
  onSuccess,
  slugStrategy,
  slugStrategyContext,
}: EditorFormProps) {
  const defaultValues = useMemo(
    () => buildDefaultValues(initialData),
    [initialData]
  );
  const slugManuallyEditedRef = useRef(false);
  const [draftSavingDisabledSessionId, setDraftSavingDisabledSessionId] =
    useState<string | null>(null);
  const statusLabelId = useId();
  const form = useForm<EditorFormValues>({
    defaultValues,
  });
  const {
    control,
    formState: { isSubmitting },
    getValues,
    handleSubmit,
    reset,
    setValue,
  } = form;
  const description = useWatch({ control, name: 'description' }) ?? '';
  const slug = useWatch({ control, name: 'slug' }) ?? '';
  const status = useWatch({ control, name: 'status' }) ?? 'unpublished';
  const tagsText = useWatch({ control, name: 'tagsText' }) ?? '';
  const title = useWatch({ control, name: 'title' }) ?? '';
  const formSessionId = useMemo(
    () => `${isEditMode ? 'edit' : 'create'}:${JSON.stringify(defaultValues)}`,
    [defaultValues, isEditMode]
  );
  const draftSavingDisabled = draftSavingDisabledSessionId === formSessionId;
  const derivedTitle = useMemo(
    () => getHeaderLevelOneTitle(editorContent),
    [editorContent]
  );
  const titleDisplay =
    derivedTitle ?? (title || 'The first H1 block becomes the entry title.');

  useEffect(() => {
    slugManuallyEditedRef.current = false;
    reset(defaultValues);
  }, [defaultValues, reset]);

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

      const nextDerivedTitle = getHeaderLevelOneTitle(content);

      if (nextDerivedTitle) {
        setValue('title', nextDerivedTitle, {
          shouldDirty: false,
          shouldTouch: false,
        });

        const currentSlug = getValues('slug');
        if (!slugManuallyEditedRef.current || currentSlug.length === 0) {
          setValue(
            'slug',
            resolveDerivedSlug({
              context: slugStrategyContext,
              editorContent: content,
              initialData,
              isEditMode,
              slugStrategy,
              title: nextDerivedTitle,
            }),
            {
              shouldDirty: false,
              shouldTouch: false,
            }
          );
        }

        return;
      }

      setValue('title', '', {
        shouldDirty: false,
        shouldTouch: false,
      });

      if (!slugManuallyEditedRef.current) {
        setValue('slug', '', {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    };

    void syncDerivedMetadata();

    return () => {
      cancelled = true;
    };
  }, [
    editorContent,
    editorOutput,
    editorReady,
    getValues,
    initialData,
    isEditMode,
    setValue,
    slugStrategy,
    slugStrategyContext,
  ]);

  useDraftAutosave({
    disabled: draftSavingDisabled,
    draftStorageScope,
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
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!editorReady) {
      return;
    }

    const output = await editorOutput();

    if (!output) {
      return;
    }

    const normalizedTitle = getHeaderLevelOneTitle(output) ?? values.title;
    const normalizedSlug = normalizeSlugPath(values.slug);
    setValue('slug', normalizedSlug, {
      shouldDirty: false,
      shouldTouch: false,
    });

    if (!onSuccess) {
      return;
    }

    setDraftSavingDisabledSessionId(formSessionId);

    try {
      await Promise.resolve(
        onSuccess({
          description: values.description.trim(),
          editorContent: output,
          isEditMode,
          serializedContent: serializeToMdx(output),
          slug: normalizedSlug,
          status: values.status,
          tags: parseTags(values.tagsText),
          title: normalizedTitle,
        })
      );

      if (isEditMode) {
        clearEditDraft(draftStorageScope);
        return;
      }

      clearCreateDraft(draftStorageScope);
    } catch (error) {
      setDraftSavingDisabledSessionId(null);
      throw error;
    }
  });

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          {isEditMode ? 'Edit entry metadata' : 'Entry metadata'}
        </CardTitle>
        <CardDescription>
          Keep the metadata package-level and app-agnostic. Persistence and
          navigation stay in the consuming app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Title</FieldLabel>
              <div className="rounded-md border border-input bg-input/20 px-2 py-2 text-sm">
                {titleDisplay}
              </div>
              <FieldDescription>
                Derived from the first level-1 heading in the editor content.
              </FieldDescription>
            </Field>

            <Controller
              control={control}
              name="slug"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="markdown-editor-slug">Slug</FieldLabel>
                  <Input
                    {...field}
                    id="markdown-editor-slug"
                    placeholder="story-driven-editor"
                    value={field.value ?? ''}
                    onBlur={(event) => {
                      const normalizedSlug = normalizeSlugPath(
                        event.target.value
                      );

                      event.target.value = normalizedSlug;

                      if (normalizedSlug !== field.value) {
                        field.onChange(normalizedSlug);
                      }

                      field.onBlur();
                    }}
                    onChange={(event) => {
                      slugManuallyEditedRef.current = true;
                      field.onChange(event.target.value);
                    }}
                  />
                  <FieldDescription>
                    Auto-generated from the title until du es manuell änderst.
                  </FieldDescription>
                </Field>
              )}
            />

            <Field>
              <FieldLabel htmlFor="markdown-editor-description">
                Description
              </FieldLabel>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="markdown-editor-description"
                    rows={4}
                    value={field.value ?? ''}
                  />
                )}
              />
              <FieldDescription>
                Optional summary used by the consuming app for cards, SEO, or
                previews.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="markdown-editor-tags">Tags</FieldLabel>
              <Controller
                control={control}
                name="tagsText"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="markdown-editor-tags"
                    placeholder="nextjs, mdx, editorjs"
                    value={field.value ?? ''}
                  />
                )}
              />
              <FieldDescription>
                Enter comma-separated tags. The package emits them as a string
                array.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel id={statusLabelId}>Status</FieldLabel>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}>
                    <SelectTrigger
                      aria-labelledby={statusLabelId}
                      id="markdown-editor-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="unpublished">Unpublished</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Keep the workflow intentionally small: published or unpublished
                only.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <div className="flex justify-end">
            <Button disabled={!editorReady || isSubmitting} type="submit">
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
