'use client';

import { useEffect, useRef } from 'react';
import EditorJS, { ToolConstructable } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import EditorjsList from '@editorjs/list';
import Embed from '@editorjs/embed';
import Quote from '@editorjs/quote';
import Table from '@editorjs/table';
import InlineCode from '@editorjs/inline-code';
import Delimiter from '@coolbytes/editorjs-delimiter';
import ToggleBlock from 'editorjs-toggle-block';
import Alert from 'editorjs-alert';
import Strikethrough from '@sotaproject/strikethrough';
import Annotation from 'editorjs-annotation';
import EditorJSInlineHotkey from 'editorjs-inline-hotkey';
import ImageTool from '@editorjs/image';
import editorjsCodecup from '@calumk/editorjs-codecup';
import EditorForm from '@/components/layout/admin/editor/editor-form';
import { ICategories } from '@/types/types';

const Editor = ({
  authorId,
  maxOrder,
  categories,
}: {
  authorId: string;
  maxOrder: number;
  categories: ICategories[];
}) => {
  const editorRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    const editor = new EditorJS({
      holder: 'editorjs',
      tools: {
        header: {
          class: Header as unknown as ToolConstructable,
          inlineToolbar: true,
          config: {
            placeholder: 'Enter a heading',
            levels: [1, 2, 3],
            defaultLevel: 2,
          },
          shortcut: 'CMD+SHIFT+H',
        },
        list: {
          class: EditorjsList as unknown as ToolConstructable,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered',
          },
        },
        code: {
          class: editorjsCodecup,
          config: {
            forceShowLanguageInput: true,
            languages: {
              bash: 'Bash',
              shell: 'Shell',
              powershell: 'PowerShell',
              git: 'Git',
              markup: 'Markdown',
              html: 'HTML',
              css: 'CSS',
              sass: 'SASS',
              scss: 'SCSS',
              javascript: 'JavaScript',
              typescript: 'TypeScript',
              jsx: 'JSX',
              tsx: 'TSX',
              json: 'JSON',
              mongodb: 'MongoDB',
              sql: 'SQL',
              docker: 'Docker',
              python: 'Python',
              regex: 'RegEx',
              lua: 'Lua',
              none: 'Plain Text',
            },
          },
        },
        inlineCode: {
          class: InlineCode as unknown as ToolConstructable,
          shortcut: 'CMD+SHIFT+M',
        },
        alert: {
          class: Alert as unknown as ToolConstructable,
          inlineToolbar: true,
          shortcut: 'CMD+SHIFT+A',
          config: {
            alertTypes: ['info', 'success', 'warning', 'danger'],
            defaultType: 'info',
            defaultAlign: 'left',
            messagePlaceholder: 'Enter something',
          },
        },
        quote: {
          class: Quote as unknown as ToolConstructable,
          inlineToolbar: true,
          shortcut: 'CMD+SHIFT+O',
          config: {
            quotePlaceholder: 'Enter a quote',
            captionPlaceholder: "Quote's author",
          },
        },
        table: {
          class: Table as unknown as ToolConstructable,
          inlineToolbar: true,
          config: {
            withHeadings: true,
            rows: 2,
            cols: 3,
          },
        },
        image: {
          class: ImageTool,
          config: {
            endpoints: {
              byFile: '/api/vault/image-upload',
            },
            features: {
              caption: 'optional',
              stretch: false,
              background: false,
              border: false,
            },
          },
        },
        delimiter: {
          class: Delimiter as unknown as ToolConstructable,
          config: {
            styleOptions: ['line'],
            defaultStyle: 'line',
            lineWidthOptions: [100],
            defaultLineWidth: 100,
            lineThicknessOptions: [2],
            defaultLineThickness: 2,
          },
        },
        toggle: {
          class: ToggleBlock as unknown as ToolConstructable,
          inlineToolbar: true,
        },
        strikethrough: Strikethrough,
        annotation: Annotation,
        InlineHotkey: EditorJSInlineHotkey,
        embed: {
          class: Embed as unknown as ToolConstructable,
          config: {
            services: {
              facebook: true,
              twitter: true,
              youtube: true,
              github: true,
              codepen: true,
              gfycat: true,
              'twitch-video': true,
            },
          },
        },
      },
    });

    editorRef.current = editor;

    return () => {
      editor.isReady
        .then(() => {
          editor.destroy();
        })
        .catch((e) => console.error('EditorJS cleanup failed:', e));
    };
  }, []);

  const editorOutput = async () => {
    if (!editorRef.current) return;
    try {
      const output = await editorRef.current.save();
      return output;
    } catch (err) {
      console.error('Editor save failed:', err);
    }
  };

  return (
    <section className="border-border bg-background mb-4 flex w-full flex-col items-center justify-center rounded-md border-2 p-4 text-base shadow-sm">
      <div id="editorjs" className="w-[60%]" />
      <EditorForm
        editorOutput={editorOutput}
        authorId={authorId}
        maxOrder={maxOrder}
        categories={categories}
      />
    </section>
  );
};

export default Editor;
