/**
 * Test double for the Supabase client.
 *
 * Jest maps "@/integrations/supabase/client" to this module (see jest.config.js)
 * so the UI can be exercised without a live Supabase project or credentials.
 *
 * Every query returns an empty, error-free result by default. Individual tests
 * can override behaviour with jest.mock("@/integrations/supabase/client", ...).
 */

type QueryResult<T> = { data: T; error: null; count?: number };

const CHAIN_METHODS = [
  "select",
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "is",
  "in",
  "or",
  "and",
  "not",
  "order",
  "limit",
  "range",
  "match",
  "filter",
  "contains",
  "containedBy",
  "textSearch",
  "returns",
  "insert",
  "update",
  "delete",
  "upsert",
  "throwOnError",
  "abortSignal",
] as const;

function createQueryBuilder<T>(result: QueryResult<T>) {
  const builder: Record<string, unknown> = {};

  const promise = Promise.resolve(result);

  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);

  for (const method of CHAIN_METHODS) {
    builder[method] = () => builder;
  }

  builder.single = () => Promise.resolve(result);
  builder.maybeSingle = () => Promise.resolve(result);

  return builder;
}

const emptyResult: QueryResult<never[]> = { data: [], error: null, count: 0 };

export const supabase = {
  from: () => createQueryBuilder(emptyResult),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => undefined } },
    }),
    signInWithPassword: async () => ({
      data: { session: null, user: null },
      error: null,
    }),
    signUp: async () => ({ data: { session: null, user: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
};

export default supabase;
