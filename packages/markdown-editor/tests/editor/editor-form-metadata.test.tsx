import type { OutputData } from '@editorjs/editorjs';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EditorForm } from '../../src/index';

const FIRST_OUTPUT: OutputData = {
  blocks: [
    {
      id: 'intro-heading',
      type: 'header',
      data: {
        level: 1,
        text: 'Story Driven Editor',
      },
    },
  ],
  time: 123,
  version: '2.31.0',
};

const SECOND_OUTPUT: OutputData = {
  blocks: [
    {
      id: 'updated-heading',
      type: 'header',
      data: {
        level: 1,
        text: 'Second Title',
      },
    },
  ],
  time: 124,
  version: '2.31.0',
};

/**
 * Render the package metadata form with explicit editor state props.
 *
 * @param editorContent - Current EditorJS content snapshot to derive metadata from.
 * @returns Testing-library helpers for rerendering the same form instance.
 */
function renderEditorForm(editorContent: OutputData) {
  const editorOutput = vi.fn(async () => editorContent);

  return render(
    <EditorForm
      editorContent={editorContent}
      editorOutput={editorOutput}
      editorReady
      isEditMode={false}
    />
  );
}

describe('EditorForm metadata derivation', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('derives title and slug from the first H1 block', async () => {
    renderEditorForm(FIRST_OUTPUT);

    await waitFor(() => {
      expect(screen.getByText('Story Driven Editor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('story-driven-editor')).toBeInTheDocument();
    });
  });

  it('updates the derived slug when the H1 title changes', async () => {
    const { rerender } = render(
      <EditorForm
        editorContent={FIRST_OUTPUT}
        editorOutput={vi.fn(async () => FIRST_OUTPUT)}
        editorReady
        isEditMode={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('story-driven-editor')).toBeInTheDocument();
    });

    rerender(
      <EditorForm
        editorContent={SECOND_OUTPUT}
        editorOutput={vi.fn(async () => SECOND_OUTPUT)}
        editorReady
        isEditMode={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Second Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('second-title')).toBeInTheDocument();
    });
  });

  it('preserves a manually edited slug after later H1 changes', async () => {
    const { rerender } = render(
      <EditorForm
        editorContent={FIRST_OUTPUT}
        editorOutput={vi.fn(async () => FIRST_OUTPUT)}
        editorReady
        isEditMode={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('story-driven-editor')).toBeInTheDocument();
    });

    const slugInput = screen.getByLabelText('Slug');
    fireEvent.change(slugInput, { target: { value: 'Custom Path' } });
    fireEvent.blur(slugInput, { target: { value: 'Custom Path' } });

    await waitFor(() => {
      expect(screen.getByLabelText('Slug')).toHaveAttribute(
        'value',
        'custom-path'
      );
    });

    rerender(
      <EditorForm
        editorContent={SECOND_OUTPUT}
        editorOutput={vi.fn(async () => SECOND_OUTPUT)}
        editorReady
        isEditMode={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Second Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Slug')).toHaveAttribute(
        'value',
        'custom-path'
      );
    });
  });

  it('resets manual slug overrides when a new initial session is loaded', async () => {
    const { rerender } = render(
      <EditorForm
        editorContent={FIRST_OUTPUT}
        editorOutput={vi.fn(async () => FIRST_OUTPUT)}
        editorReady
        initialData={{
          content: FIRST_OUTPUT,
          slug: 'story-driven-editor',
          title: 'Story Driven Editor',
        }}
        isEditMode={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('story-driven-editor')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'Custom Path' },
    });
    fireEvent.blur(screen.getByLabelText('Slug'), {
      target: { value: 'Custom Path' },
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Slug')).toHaveAttribute(
        'value',
        'custom-path'
      );
    });

    rerender(
      <EditorForm
        editorContent={SECOND_OUTPUT}
        editorOutput={vi.fn(async () => SECOND_OUTPUT)}
        editorReady
        initialData={{
          content: SECOND_OUTPUT,
          slug: 'second-title',
          title: 'Second Title',
        }}
        isEditMode={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Slug')).toHaveAttribute(
        'value',
        'second-title'
      );
    });
  });
});
