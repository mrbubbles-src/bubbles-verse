import { JWTPayload } from 'jose';

export type TRole = 'SUPERADMIN' | 'MODERATOR' | 'GUEST';

export interface IJWT {
  id: string;
  username: string;
  role: TRole;
}

export interface IInputs {
  username: string;
  password: string;
}
export interface IAuthorInfo {
  name?: string;
  email?: string;
  avatar?: string;
  authorSocials?: {
    website?: string;
    github?: string;
    linkedin?: string;
    codepen?: string;
    stackoverflow?: string;
    youtube?: string;
    twitter?: string;
    twitch?: string;
    discord?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
  };
}
export type TContent = {
  time: number;
  blocks: TEditorBlock[];
  version: string;
};
export interface IVaultEntry {
  id?: string;
  numericId?: number;
  title: string;
  slug?: string;
  content: TContent;
  description?: string;
  order?: number;
  categoryId?: string;
  category?: string;
  authorId?: string;
  author: IAuthorInfo | string;
  published?: boolean;
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface IVaultEntrySidebar {
  id: string;
  title: string;
  slug: string;
  published?: boolean;
  isFeatured?: boolean;
  order?: number;
}
export type TIconKey =
  | 'git'
  | 'github'
  | 'node'
  | 'html'
  | 'css'
  | 'js'
  | 'react'
  | 'backend'
  | 'database'
  | 'default';

export interface ICategories {
  id: string;
  name: string;
  slug: string;
  iconKey: TIconKey;
  order: number;
  vaultEntries?: IVaultEntrySidebar[];
}

export type TUserResult =
  | { user: IJWT & JWTPayload }
  | { error: 'no-token' | 'invalid-token' | 'server-error' };

type TParagraphBlock = {
  id: string;
  type: 'paragraph';
  data: { text: string };
};

type THeaderBlock = {
  id: string;
  type: 'header';
  data: { text: string; level: number };
};

type TListBlock = {
  id: string;
  type: 'list';
  data: { style: 'ordered' | 'unordered'; items: string[] };
};

type TImageBlock = {
  id: string;
  type: 'image';
  data: { file: { url: string }; caption?: string };
};

type TCodeBlock = {
  id: string;
  type: 'code' | 'codeBox';
  data: { code: string; language?: string };
};

type TUnknownBlock = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

export type TEditorBlock =
  | TParagraphBlock
  | THeaderBlock
  | TListBlock
  | TImageBlock
  | TCodeBlock
  | TUnknownBlock;

export interface IEditorRendererProps {
  blocks: TEditorBlock[];
}
export type TEditorJsListItem = {
  content: string;
  text?: string;
  meta?: { checked?: boolean };
  items?: TEditorJsListItem[];
};
export type TChecklistItem = {
  content: string;
  meta?: { checked?: boolean };
  items?: TChecklistItem[];
};
export type TSocialIcons =
  | 'website'
  | 'github'
  | 'linkedin'
  | 'codepen'
  | 'stackoverflow'
  | 'youtube'
  | 'twitter'
  | 'twitch'
  | 'discord'
  | 'instagram'
  | 'tiktok'
  | 'facebook';
