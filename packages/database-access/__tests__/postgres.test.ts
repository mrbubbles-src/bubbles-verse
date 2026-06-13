import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearCachedBubblesPostgresClientsForTests,
  getBubblesPostgresClientOptions,
  getCachedBubblesPostgresClient,
} from '../src/postgres';

const postgresMock = vi.hoisted(() => {
  return vi.fn(
    (
      databaseUrlOrOptions: string | Record<string, boolean | number>,
      options?: Record<string, boolean | number>
    ): {
      databaseUrlOrOptions: string | Record<string, boolean | number>;
      options?: Record<string, boolean | number>;
    } => {
      return {
        databaseUrlOrOptions,
        options,
      };
    }
  );
});

vi.mock('postgres', () => ({
  default: postgresMock,
}));

describe('database access Postgres client helpers', () => {
  beforeEach(() => {
    postgresMock.mockClear();
    clearCachedBubblesPostgresClientsForTests();
  });

  it('passes shared defaults and option overrides to postgres', () => {
    const client = getCachedBubblesPostgresClient({
      appKey: 'bubblophy',
      databaseUrl: 'postgres://example/bubblophy',
      options: {
        idle_timeout: 15,
      },
    });

    expect(client).toEqual({
      databaseUrlOrOptions: 'postgres://example/bubblophy',
      options: {
        prepare: false,
        idle_timeout: 15,
        connect_timeout: 10,
        max_lifetime: 1800,
      },
    });
    expect(postgresMock).toHaveBeenCalledWith('postgres://example/bubblophy', {
      prepare: false,
      idle_timeout: 15,
      connect_timeout: 10,
      max_lifetime: 1800,
    });
  });

  it('returns the same cached client for the same app key', () => {
    const firstClient = getCachedBubblesPostgresClient({
      appKey: 'dashboard',
      databaseUrl: 'postgres://example/dashboard',
    });
    const secondClient = getCachedBubblesPostgresClient({
      appKey: 'dashboard',
      databaseUrl: 'postgres://example/dashboard',
    });

    expect(firstClient).toBe(secondClient);
    expect(postgresMock).toHaveBeenCalledTimes(1);
  });

  it('keeps cached clients separated by app key', () => {
    const dashboardClient = getCachedBubblesPostgresClient({
      appKey: 'dashboard',
      databaseUrl: 'postgres://example/dashboard',
    });
    const bubblophyClient = getCachedBubblesPostgresClient({
      appKey: 'bubblophy',
      databaseUrl: 'postgres://example/bubblophy',
    });

    expect(dashboardClient).not.toBe(bubblophyClient);
    expect(postgresMock).toHaveBeenCalledTimes(2);
  });

  it('keeps Postgres.js env/default URL behavior when no URL is passed', () => {
    const client = getCachedBubblesPostgresClient({
      appKey: 'dashboard',
      databaseUrl: undefined,
    });

    expect(client).toMatchObject({
      databaseUrlOrOptions: {
        prepare: false,
        idle_timeout: 20,
        connect_timeout: 10,
        max_lifetime: 1800,
      },
    });
    expect(client.options).toBeUndefined();
    expect(postgresMock).toHaveBeenCalledWith({
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
      max_lifetime: 1800,
    });
  });

  it('exposes the merged option defaults for app-local tests', () => {
    expect(
      getBubblesPostgresClientOptions({
        prepare: true,
        connect_timeout: 3,
      })
    ).toEqual({
      prepare: true,
      idle_timeout: 20,
      connect_timeout: 3,
      max_lifetime: 1800,
    });
  });
});
