import type { ToolConstructable, ToolSettings } from '@editorjs/editorjs';

import type {
  MarkdownEditorImageUploader,
  PluginKey,
} from '../types/editor';

type EditorToolMap = Record<string, ToolConstructable | ToolSettings>;
type LoadedEditorToolRegistry = {
  Alert?: ToolConstructable;
  Annotation?: ToolConstructable;
  Delimiter?: ToolConstructable;
  EditorJsInlineHotkey?: ToolConstructable;
  EditorjsList?: ToolConstructable;
  Embed?: ToolConstructable;
  Header?: ToolConstructable;
  ImageTool?: ToolConstructable;
  InlineCode?: ToolConstructable;
  Quote?: ToolConstructable;
  Strikethrough?: ToolConstructable;
  Table?: ToolConstructable;
  ToggleBlock?: ToolConstructable;
  editorjsCodecup?: ToolConstructable;
};

/**
 * Canonical tool order shared by the reference implementations.
 *
 * Preserve this order when subsetting so the toolbar stays predictable across
 * every consuming app.
 */
export const DEFAULT_PLUGIN_KEYS: readonly PluginKey[] = [
  'paragraph',
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
  'inlineHotkey',
  'embed',
];

/**
 * EditorJS tool keys for plugin keys that differ from the public package API.
 */
export const TOOL_NAME_BY_PLUGIN_KEY: Readonly<
  Record<Exclude<PluginKey, 'paragraph'>, string>
> = {
  alert: 'alert',
  annotation: 'annotation',
  code: 'code',
  delimiter: 'delimiter',
  embed: 'embed',
  header: 'header',
  image: 'image',
  inlineCode: 'inlineCode',
  inlineHotkey: 'InlineHotkey',
  list: 'list',
  quote: 'quote',
  strikethrough: 'strikethrough',
  table: 'table',
  toggle: 'toggle',
};

const DEFAULT_BLOCK_PLUGIN_KEYS: readonly PluginKey[] = [
  'paragraph',
  'header',
  'list',
  'code',
  'alert',
  'quote',
  'table',
  'image',
  'delimiter',
  'toggle',
  'embed',
] as const;

/**
 * Keep the reference CodeCup language list intact.
 */
const CODE_BLOCK_LANGUAGES = {
  bash: 'Bash',
  css: 'CSS',
  docker: 'Docker',
  git: 'Git',
  html: 'HTML',
  javascript: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  lua: 'Lua',
  markup: 'Markdown',
  mongodb: 'MongoDB',
  none: 'Plain Text',
  powershell: 'PowerShell',
  python: 'Python',
  regex: 'RegEx',
  sass: 'SASS',
  scss: 'SCSS',
  shell: 'Shell',
  sql: 'SQL',
  tsx: 'TSX',
  typescript: 'TypeScript',
} as const;

/**
 * Normalize a requested plugin subset against the canonical reference order.
 *
 * `undefined` means "all tools", while a provided array acts as an allowlist.
 *
 * @param plugins - Optional plugin subset requested by the app.
 * @returns Active plugin keys in canonical toolbar order.
 */
export function resolvePluginKeys(
  plugins?: readonly PluginKey[]
): PluginKey[] {
  if (!plugins) {
    return [...DEFAULT_PLUGIN_KEYS];
  }

  const requestedPlugins = new Set(plugins);

  return DEFAULT_PLUGIN_KEYS.filter((pluginKey) =>
    requestedPlugins.has(pluginKey)
  );
}

/**
 * Pick the default EditorJS block from the active plugin subset.
 *
 * Prefer `paragraph` when available, otherwise fall back to the first active
 * block tool so EditorJS does not silently re-enable paragraph by default.
 *
 * @param pluginKeys - Active plugin keys in toolbar order.
 * @returns EditorJS `defaultBlock` key.
 */
export function resolveDefaultBlock(pluginKeys: readonly PluginKey[]): string {
  const blockPluginKey = DEFAULT_BLOCK_PLUGIN_KEYS.find((pluginKey) =>
    pluginKeys.includes(pluginKey)
  );

  if (!blockPluginKey || blockPluginKey === 'paragraph') {
    return 'paragraph';
  }

  return TOOL_NAME_BY_PLUGIN_KEY[blockPluginKey];
}

/**
 * Load the browser-only EditorJS tools required by the active plugin subset.
 *
 * Import only the requested tools so server-side imports of the package stay
 * safe while the editor still preserves the reference runtime setup.
 *
 * @param pluginKeys - Active plugin keys in canonical order.
 * @returns Tool constructors keyed by the reference names used in config.
 */
export async function loadEditorToolRegistry(
  pluginKeys: readonly PluginKey[]
): Promise<LoadedEditorToolRegistry> {
  const activePluginKeys = new Set(pluginKeys);
  const registry: LoadedEditorToolRegistry = {};

  if (activePluginKeys.has('header')) {
    registry.Header = (await import('@editorjs/header'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('list')) {
    registry.EditorjsList = (await import('@editorjs/list'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('code')) {
    registry.editorjsCodecup = (await import('@calumk/editorjs-codecup'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('inlineCode')) {
    registry.InlineCode = (await import('@editorjs/inline-code'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('alert')) {
    registry.Alert = (await import('editorjs-alert'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('quote')) {
    registry.Quote = (await import('@editorjs/quote'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('table')) {
    registry.Table = (await import('@editorjs/table'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('image')) {
    registry.ImageTool = (await import('@editorjs/image'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('delimiter')) {
    registry.Delimiter = (await import('@coolbytes/editorjs-delimiter'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('toggle')) {
    registry.ToggleBlock = (await import('editorjs-toggle-block'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('strikethrough')) {
    registry.Strikethrough = (await import('@sotaproject/strikethrough'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('annotation')) {
    registry.Annotation = (await import('editorjs-annotation'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('inlineHotkey')) {
    registry.EditorJsInlineHotkey = (await import('editorjs-inline-hotkey'))
      .default as unknown as ToolConstructable;
  }

  if (activePluginKeys.has('embed')) {
    registry.Embed = (await import('@editorjs/embed'))
      .default as unknown as ToolConstructable;
  }

  return registry;
}

/**
 * Build the EditorJS tool map while preserving the reference configuration.
 *
 * Only requested tools are passed into EditorJS so subsetted editors do not
 * register unused toolbar entries.
 *
  * @param pluginKeys - Active plugin keys in canonical order.
 * @param toolRegistry - Loaded tool constructors for the active subset.
 * @param imageUploader - Optional file uploader for the image tool.
 * @returns Tool map ready for `new EditorJS({ tools })`.
 */
export function buildEditorTools(
  pluginKeys: readonly PluginKey[],
  toolRegistry: LoadedEditorToolRegistry,
  imageUploader?: MarkdownEditorImageUploader
): EditorToolMap {
  const activePluginKeys = new Set(pluginKeys);
  const tools: EditorToolMap = {};

  if (activePluginKeys.has('header') && toolRegistry.Header) {
    tools.header = {
      class: toolRegistry.Header,
      config: {
        defaultLevel: 1,
        levels: [1, 2, 3],
        placeholder: 'Enter a heading',
      },
      inlineToolbar: true,
      shortcut: 'CMD+SHIFT+H',
    };
  }

  if (activePluginKeys.has('list') && toolRegistry.EditorjsList) {
    tools.list = {
      class: toolRegistry.EditorjsList,
      config: {
        defaultStyle: 'unordered',
      },
      inlineToolbar: true,
    };
  }

  if (activePluginKeys.has('code') && toolRegistry.editorjsCodecup) {
    tools.code = {
      class: toolRegistry.editorjsCodecup,
      config: {
        forceShowLanguageInput: true,
        languages: CODE_BLOCK_LANGUAGES,
      },
    };
  }

  if (activePluginKeys.has('inlineCode') && toolRegistry.InlineCode) {
    tools.inlineCode = {
      class: toolRegistry.InlineCode,
      shortcut: 'CMD+SHIFT+M',
    };
  }

  if (activePluginKeys.has('alert') && toolRegistry.Alert) {
    tools.alert = {
      class: toolRegistry.Alert,
      config: {
        alertTypes: ['info', 'success', 'warning', 'danger'],
        defaultAlign: 'left',
        defaultType: 'info',
        messagePlaceholder: 'Enter something',
      },
      inlineToolbar: true,
      shortcut: 'CMD+SHIFT+A',
    };
  }

  if (activePluginKeys.has('quote') && toolRegistry.Quote) {
    tools.quote = {
      class: toolRegistry.Quote,
      config: {
        captionPlaceholder: "Quote's author",
        quotePlaceholder: 'Enter a quote',
      },
      inlineToolbar: true,
      shortcut: 'CMD+SHIFT+O',
    };
  }

  if (activePluginKeys.has('table') && toolRegistry.Table) {
    tools.table = {
      class: toolRegistry.Table,
      config: {
        cols: 3,
        rows: 2,
        withHeadings: true,
      },
      inlineToolbar: true,
    };
  }

  if (activePluginKeys.has('image') && toolRegistry.ImageTool) {
    tools.image = {
      class: toolRegistry.ImageTool,
      config: {
        features: {
          background: false,
          border: false,
          caption: 'optional',
          stretch: false,
        },
        ...(imageUploader
          ? {
              uploader: {
                uploadByFile: imageUploader,
              },
            }
          : {}),
      },
    };
  }

  if (activePluginKeys.has('delimiter') && toolRegistry.Delimiter) {
    tools.delimiter = {
      class: toolRegistry.Delimiter,
      config: {
        defaultLineThickness: 2,
        defaultLineWidth: 100,
        defaultStyle: 'line',
        lineThicknessOptions: [2],
        lineWidthOptions: [100],
        styleOptions: ['line'],
      },
    };
  }

  if (activePluginKeys.has('toggle') && toolRegistry.ToggleBlock) {
    tools.toggle = {
      class: toolRegistry.ToggleBlock,
      inlineToolbar: true,
    };
  }

  if (activePluginKeys.has('strikethrough') && toolRegistry.Strikethrough) {
    tools.strikethrough = toolRegistry.Strikethrough;
  }

  if (activePluginKeys.has('annotation') && toolRegistry.Annotation) {
    tools.annotation = toolRegistry.Annotation;
  }

  if (
    activePluginKeys.has('inlineHotkey') &&
    toolRegistry.EditorJsInlineHotkey
  ) {
    tools.InlineHotkey = toolRegistry.EditorJsInlineHotkey;
  }

  if (activePluginKeys.has('embed') && toolRegistry.Embed) {
    tools.embed = {
      class: toolRegistry.Embed,
      config: {
        services: {
          youtube: true,
        },
      },
    };
  }

  return tools;
}
