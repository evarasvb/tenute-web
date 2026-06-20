/**
 * Limitador de concurrencia mínimo, compatible con la API de `p-limit`:
 *   const limit = pLimit(5);
 *   await Promise.all(items.map((x) => limit(() => doAsync(x))));
 *
 * Se implementa localmente para evitar la dependencia `p-limit` (que arrastra
 * `yocto-queue`, ESM-only) y el error ERR_REQUIRE_ESM en el runtime serverless.
 */
export function pLimit(concurrency: number) {
  const max = Number.isFinite(concurrency) && concurrency > 0 ? Math.floor(concurrency) : 1;
  const queue: Array<() => void> = [];
  let active = 0;

  const next = () => {
    active--;
    if (queue.length > 0) {
      const run = queue.shift();
      if (run) run();
    }
  };

  return function run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const start = () => {
        active++;
        Promise.resolve()
          .then(fn)
          .then(resolve, reject)
          .finally(next);
      };
      if (active < max) start();
      else queue.push(start);
    });
  };
}

export default pLimit;
