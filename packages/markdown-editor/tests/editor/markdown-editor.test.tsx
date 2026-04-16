import { describe, expect, it, vi } from 'vitest';

describe('editor tool helpers', () => {
  class StubTool {
    constructor(..._args: unknown[]) {}

    render() {
      return document.createElement('div');
    }

    save() {
      return {};
    }
  }

  const toolRegistry = {
    Alert: StubTool,
    Annotation: StubTool,
    Delimiter: StubTool,
    EditorJsInlineHotkey: StubTool,
    EditorjsList: StubTool,
    Embed: StubTool,
    Header: StubTool,
    ImageTool: StubTool,
    InlineCode: StubTool,
    Quote: StubTool,
    Strikethrough: StubTool,
    Table: StubTool,
    ToggleBlock: StubTool,
    editorjsCodecup: StubTool,
  } as const;

  it('registers the full 15-tool surface by default', async () => {
    const { DEFAULT_PLUGIN_KEYS, buildEditorTools, resolveDefaultBlock } =
      await import('../../src/lib/editor-tools');

    expect(DEFAULT_PLUGIN_KEYS).toHaveLength(15);
    expect(resolveDefaultBlock(DEFAULT_PLUGIN_KEYS)).toBe('paragraph');
    expect(Object.keys(buildEditorTools(DEFAULT_PLUGIN_KEYS, toolRegistry))).toEqual([
      'header',
      'list',
      'code',
      'inlineCode',
      'alert',
      'quote',
      'table',
      'image',
      'delimiter',
      'toggle',
      'strikethrough',
      'annotation',
      'InlineHotkey',
      'embed',
    ]);
  });

  it('filters the toolbar tools to the requested subset without reordering it', async () => {
    const { buildEditorTools, resolveDefaultBlock, resolvePluginKeys } =
      await import('../../src/lib/editor-tools');
    const pluginKeys = resolvePluginKeys([
      'paragraph',
      'image',
      'list',
      'header',
    ]);

    expect(pluginKeys).toEqual(['paragraph', 'header', 'list', 'image']);
    expect(resolveDefaultBlock(pluginKeys)).toBe('paragraph');
    expect(Object.keys(buildEditorTools(pluginKeys, toolRegistry))).toEqual([
      'header',
      'list',
      'image',
    ]);
  });

  it('keeps the reference image and inline-only tools behind the same registry', async () => {
    const { buildEditorTools, resolveDefaultBlock } = await import(
      '../../src/lib/editor-tools'
    );

    expect(
      Object.keys(
        buildEditorTools(
          ['image', 'annotation', 'inlineHotkey', 'embed'],
          toolRegistry
        )
      )
    ).toEqual(['image', 'annotation', 'InlineHotkey', 'embed']);
    expect(resolveDefaultBlock(['annotation', 'inlineHotkey', 'strikethrough'])).toBe(
      'paragraph'
    );
  });

  it('wires the app-provided image uploader into the image tool config', async () => {
    const { buildEditorTools } = await import('../../src/lib/editor-tools');
    const uploadByFile = vi.fn(async () => ({
      file: { url: 'https://cdn.example.com/image.png' },
      success: 1 as const,
    }));
    const tools = buildEditorTools(['image'], toolRegistry, uploadByFile);
    const imageTool = tools.image as {
      config: {
        uploader?: {
          uploadByFile?: typeof uploadByFile;
        };
      };
    };

    expect(imageTool.config.uploader?.uploadByFile).toBe(uploadByFile);
  });

});

describe('editor content helpers', () => {
  it('normalizes string and wrapped content into EditorJS output data', async () => {
    const { normalizeInitialEditorData } = await import(
      '../../src/lib/editor-content'
    );

    expect(
      normalizeInitialEditorData({
        content: JSON.stringify({
          blocks: [{ type: 'paragraph', data: { text: 'Hello' } }],
          time: '42',
        }),
      })
    ).toEqual({
      blocks: [{ type: 'paragraph', data: { text: 'Hello' } }],
      time: 42,
      version: '2.31.0',
    });
  });

  it('falls back to an empty starter payload when content is invalid', async () => {
    const { normalizeInitialEditorData } = await import(
      '../../src/lib/editor-content'
    );
    const result = normalizeInitialEditorData('{not-json}');

    expect(result.blocks).toEqual([]);
    expect(result.version).toBe('2.31.0');
    expect(typeof result.time).toBe('number');
  });
});
