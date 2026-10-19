import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";

/**
 * Run a `package.json` script through whichever package manager started this
 * process.
 *
 * Scripts that forward to another script used to hard-code `npm run`, which
 * requires an `npm` executable on PATH. A Node install that ships only the pnpm
 * launchers has no such shim, and the nested call then fails with
 * `'npm' is not recognized` — including from the `pre*` script that runs before
 * the requested one. Every package manager exports `npm_execpath` for its own
 * entry point, so forwarding through that value removes the dependency:
 *
 * - npm, yarn and corepack expose a JavaScript entry, run through Node.
 * - pnpm and bun expose a native launcher, executed directly.
 *
 * Turborepo is deliberately not handled here: it reads `package.json#packageManager`
 * and resolves that manager's binary from PATH on its own, so orchestrated
 * tasks still need the declared package manager installed.
 */

const [script, ...arguments_] = process.argv.slice(2);

if (script === undefined) {
  process.stderr.write(
    "Usage: node scripts/run-script.mjs <script> [arguments...]\n",
  );
  process.exit(2);
}

/** The npm CLI installed beside the running Node, used when nothing is set. */
const adjacentNpmCli = () =>
  process.platform === "win32"
    ? join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")
    : undefined;

const resolveLauncher = () => {
  const entry = process.env.npm_execpath;
  if (entry === undefined || entry.length === 0) {
    const fallback = adjacentNpmCli();
    if (fallback === undefined) return { command: "npm", prefix: [] };
    return { command: process.execPath, prefix: [fallback] };
  }
  // A JavaScript entry must run through Node; a native launcher (pnpm, bun)
  // must not, because Node cannot execute it.
  return /\.(?:c|m)?js$/u.test(entry)
    ? { command: process.execPath, prefix: [entry] }
    : { command: entry, prefix: [] };
};

const { command, prefix } = resolveLauncher();
const result = spawnSync(
  command,
  [
    ...prefix,
    "run",
    script,
    ...(arguments_.length === 0 ? [] : ["--", ...arguments_]),
  ],
  { stdio: "inherit" },
);

if (result.error !== undefined) throw result.error;
process.exit(result.status ?? 1);
