import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema: { ...schema, ...relations } });

// import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';
// import * as schema from './schema';
// import * as relations from './relations';

// declare global {
//   interface GlobalThis {
//     db?: ReturnType<typeof drizzle>;
//   }
// }

// const queryClient = postgres(process.env.DATABASE_URL!, {
//   max: 5,
// });

// const drizzleDb = drizzle(queryClient, {
//   schema: {
//     ...schema,
//     ...relations,
//   },
// });

// const globalDb = (globalThis as GlobalThis).db ?? drizzleDb;
// export const db = {
//   ...globalDb,
//   $client: queryClient,
// } as PostgresJsDatabase<typeof schema & typeof relations> & {
//   $client: typeof queryClient;
// };

// if (process.env.NODE_ENV !== 'production') {
//   (globalThis as GlobalThis).db = db;
// }

// DO NOT DELETE THIS FOR THE TIME BEING!
// import { drizzle } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';
// import * as schema from './schema';
// import * as relations from './relations';

// const client = postgres(process.env.DATABASE_URL!);
// export const db = drizzle(client, {
//   schema: {
//     ...schema,
//     ...relations,
//   },
// });
