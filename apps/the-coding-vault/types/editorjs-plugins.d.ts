declare module '@editorjs/embed' {
  import { ToolConstructable } from '@editorjs/editorjs';
  const Embed: ToolConstructable;
  export default Embed;
}
declare module '@editorjs/inline-code' {
  import { InlineTool } from '@editorjs/editorjs';
  const InlineCode: InlineTool;
  export default InlineCode;
}

declare module '@editorjs/attaches' {
  import { BlockTool } from '@editorjs/editorjs';
  const AttachesTool: BlockTool;
  export default AttachesTool;
}

declare module '@coolbytes/editorjs-delimiter' {
  import { BlockTool } from '@editorjs/editorjs';
  const Delimiter: BlockTool;
  export default Delimiter;
}

declare module 'editorjs-toggle-block' {
  import { BlockTool } from '@editorjs/editorjs';
  const ToggleBlock: BlockTool;
  export default ToggleBlock;
}

declare module 'editorjs-alert' {
  import { BlockTool } from '@editorjs/editorjs';
  const Alert: BlockTool;
  export default Alert;
}

declare module '@sotaproject/strikethrough' {
  import { InlineTool } from '@editorjs/editorjs';
  const Strikethrough: InlineTool;
  export default Strikethrough;
}

declare module 'editorjs-annotation' {
  import { InlineTool } from '@editorjs/editorjs';
  const Annotation: InlineTool;
  export default Annotation;
}

declare module 'editorjs-inline-hotkey' {
  import { InlineTool } from '@editorjs/editorjs';
  const EditorJSInlineHotkey: InlineTool;
  export default EditorJSInlineHotkey;
}

declare module '@calumk/editorjs-codecup';
