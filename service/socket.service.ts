/**
 * Re-exports the shared socket manager for backward compatibility.
 * All socket connections now go through socketManager.ts which maintains
 * exactly one connection per namespace.
 */
export { acquireNamespace, releaseNamespace, getSocket } from "./socketManager";
