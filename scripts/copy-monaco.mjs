import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Copies Monaco's prebuilt AMD bundle into public/ so it is served from our own
 * origin.
 *
 * By default @monaco-editor/loader fetches Monaco from cdn.jsdelivr.net. That
 * breaks under our Content-Security-Policy, which allows scripts from 'self'
 * only, and it is undesirable regardless:
 *
 *   - a self-hostable API client should not require a third-party CDN at runtime
 *   - the loader pins a different version (0.55.1) than the one installed here,
 *     so the audited dependency is not the code that would actually run
 *   - it fails offline, which is the environment developers often test APIs in
 *
 * Serving it from /monaco/vs keeps script-src and worker-src at 'self'.
 *
 * public/monaco is generated, not committed - see .gitignore.
 */

const source = path.join("node_modules", "monaco-editor", "min", "vs");
const destination = path.join("public", "monaco", "vs");

try {
  await stat(source);
} catch {
  console.error(
    `[copy-monaco] ${source} not found. Run "npm install" before building.`
  );
  process.exit(1);
}

await rm(path.join("public", "monaco"), { recursive: true, force: true });
await mkdir(path.dirname(destination), { recursive: true });
await cp(source, destination, { recursive: true });

console.log(`[copy-monaco] ${source} -> ${destination}`);
