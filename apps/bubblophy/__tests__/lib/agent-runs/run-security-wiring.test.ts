import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const humanTransitionPath = 'lib/agent-runs/human-transition-database-write.ts';
const agentUpdatePath = 'lib/agent-runs/agent-update-database-write.ts';

describe('run security query wiring', () => {
  it('binds human approval to the assigned token project', () => {
    const source = readFileSync(
      resolve(process.cwd(), humanTransitionPath),
      'utf8'
    );

    expect(source).toContain(
      'eq(bubblophyAgentTokens.id, bubblophyAgentRuns.agentTokenId)'
    );
    expect(source).toContain(
      'eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)'
    );
  });

  it.each([humanTransitionPath, agentUpdatePath])(
    'compares the persisted prior state in %s',
    (relativePath) => {
      const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8');

      expect(source).toContain(
        'eq(bubblophyAgentRuns.state, currentRun.state)'
      );
    }
  );
});
