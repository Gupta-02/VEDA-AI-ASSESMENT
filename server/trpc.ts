import { initTRPC } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import superjson from "superjson";

/** The public assessment prototype deliberately has no sign-in requirement. */
export type AppContext = Pick<CreateExpressContextOptions, "req" | "res">;

const t = initTRPC.context<AppContext>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export function createContext({ req, res }: CreateExpressContextOptions): AppContext {
  return { req, res };
}
