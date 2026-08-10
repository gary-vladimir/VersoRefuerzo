// A minimal stand-in for the Drizzle client, enough to drive an API route
// under test without a Postgres connection.
//
// Every builder method (`select`, `from`, `where`, `limit`, `orderBy`,
// `set`, `values`, `returning`, ...) returns the same chainable object. The
// chain is thenable, so awaiting it shifts the next queued result off
// `results`. That means a test declares what the route's queries return, in
// the order the route awaits them, and nothing has to mirror Drizzle's real
// builder surface.
//
// `batch` shifts a single entry, which should be the array of per-statement
// results the route destructures.

export type FakeDbCall = { method: string; args: unknown[] };

export class FakeDb {
  // Results handed out, in await order. Missing entries resolve to [].
  results: unknown[] = [];
  // Every builder method invoked, for assertions about what was written.
  calls: FakeDbCall[] = [];

  constructor(results: unknown[] = []) {
    this.results = results;
  }

  // Records and returns the payload passed to the first matching call.
  argsFor(method: string): unknown[] | null {
    return this.calls.find((c) => c.method === method)?.args ?? null;
  }

  private next(): unknown {
    return this.results.length > 0 ? this.results.shift() : [];
  }

  private chain(): Record<string, unknown> {
    const record = (method: string, args: unknown[]) => {
      this.calls.push({ method, args });
    };
    const next = () => this.next();

    const proxy: Record<string, unknown> = new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === "then") {
            return (
              onFulfilled?: (v: unknown) => unknown,
              onRejected?: (e: unknown) => unknown,
            ) => Promise.resolve(next()).then(onFulfilled, onRejected);
          }
          if (typeof prop === "symbol") return undefined;
          return (...args: unknown[]) => {
            record(prop, args);
            return proxy;
          };
        },
      },
    );
    return proxy;
  }

  select = (...args: unknown[]) => {
    this.calls.push({ method: "select", args });
    return this.chain();
  };
  insert = (...args: unknown[]) => {
    this.calls.push({ method: "insert", args });
    return this.chain();
  };
  update = (...args: unknown[]) => {
    this.calls.push({ method: "update", args });
    return this.chain();
  };
  delete = (...args: unknown[]) => {
    this.calls.push({ method: "delete", args });
    return this.chain();
  };
  batch = async (statements: unknown[]) => {
    this.calls.push({ method: "batch", args: [statements] });
    return this.next() as unknown[];
  };
}
