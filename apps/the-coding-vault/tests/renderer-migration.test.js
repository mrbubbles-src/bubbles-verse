import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

/**
 * Read a Vault app file for migration-source assertions.
 *
 * @param {...string} segments - Path parts relative to the app root.
 * @returns {string} UTF-8 source contents.
 */
function readAppFile(...segments) {
  return readFileSync(path.join(appRoot, ...segments), 'utf8');
}

test('vault entry page uses the shared markdown renderer package', () => {
  const pageSource = readAppFile(
    'app',
    '(vault)',
    'vault',
    '[slug]',
    'page.tsx',
  );

  expect(pageSource).toContain(
    "import { MdxRenderer } from '@bubbles/markdown-renderer';",
  );
  expect(pageSource).toContain(
    '<MdxRenderer content={mdx} components={components} />',
  );
  expect(pageSource).not.toContain('next-mdx-remote-client');
});

test('vault layout imports renderer.css before app globals consume its vars', () => {
  const layoutSource = readAppFile('app', '(vault)', 'layout.tsx');

  expect(layoutSource).toContain(
    "import '@bubbles/markdown-renderer/styles/renderer';",
  );
});

test('vault globals no longer define local shiki token variables', () => {
  const globalsSource = readAppFile('app', 'globals.css');

  expect(globalsSource).not.toContain('--sh-class:');
  expect(globalsSource).not.toContain('--code-bg:');
});

test('vault package declares the shared renderer workspace dependency', () => {
  const packageJson = JSON.parse(readAppFile('package.json'));

  expect(packageJson.dependencies['@bubbles/markdown-renderer']).toBe(
    'workspace:*',
  );
  expect(packageJson.dependencies['next-mdx-remote-client']).toBeUndefined();
});
