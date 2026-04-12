declare module '@calumk/editorjs-codecup' {
  import type { ToolConstructable } from '@editorjs/editorjs';

  const CodeCup: ToolConstructable;
  export default CodeCup;
}

declare module '@coolbytes/editorjs-delimiter' {
  import type { BlockTool } from '@editorjs/editorjs';

  const Delimiter: BlockTool;
  export default Delimiter;
}

declare module 'editorjs-alert' {
  import type { BlockTool } from '@editorjs/editorjs';

  const Alert: BlockTool;
  export default Alert;
}

declare module 'editorjs-annotation' {
  import type { InlineTool } from '@editorjs/editorjs';

  const Annotation: InlineTool;
  export default Annotation;
}

declare module 'editorjs-inline-hotkey' {
  import type { InlineTool } from '@editorjs/editorjs';

  const EditorJsInlineHotkey: InlineTool;
  export default EditorJsInlineHotkey;
}

declare module 'editorjs-toggle-block' {
  import type { BlockTool } from '@editorjs/editorjs';

  const ToggleBlock: BlockTool;
  export default ToggleBlock;
}

declare module '@sotaproject/strikethrough' {
  import type { InlineTool } from '@editorjs/editorjs';

  const Strikethrough: InlineTool;
  export default Strikethrough;
}
