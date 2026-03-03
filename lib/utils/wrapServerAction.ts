/**
 * Wraps a server action to log errors to system_logs. Rethrows so caller can still handle.
 */
import { logError } from "@/lib/logging/systemLogger";

type ServerAction<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>;

/**
 * Wrap a server action: on thrown error, log to system_logs then rethrow.
 * Use: export const myAction = wrapServerAction(async (x) => { ... }, "myAction");
 */
export function wrapServerAction<TArgs extends unknown[], TResult>(
  fn: ServerAction<TArgs, TResult>,
  sourceName: string
): ServerAction<TArgs, TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await fn(...args);
    } catch (err) {
      logError("SERVER_ACTION", sourceName, {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw err;
    }
  };
}
