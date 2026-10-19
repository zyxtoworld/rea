import { z } from "zod";

import { ConfigurationError } from "../domain/configurationErrors.js";
import { err, ok, type Result } from "../domain/result.js";
import {
  CORE_TOOL_FAMILIES,
  TOOL_FAMILIES,
  TOOL_FAMILY_IDS,
  type ToolFamily,
} from "../contracts/toolFamilies.js";
import { compareUnicodeCodePoints } from "../domain/unicodeCodePointOrder.js";

const FAMILY_LIST = TOOL_FAMILIES.map(({ id }) => id).join(", ");

/** Constraint text shared by environment validation and startup parsing. */
export const MCP_TOOL_PROFILE_CONSTRAINT = `REA_MCP_TOOL_PROFILE must be "full" (default), "core", or a comma-separated list of tool families (${FAMILY_LIST}). Full advertises every tool. Core advertises ${CORE_TOOL_FAMILIES.join(", ")}. A family list advertises exactly those families plus session, which stays mounted so callers can open targets and read binary_session.`;

export type McpToolProfile = "full" | "core" | "custom";

/** Resolved advertisement selection: either every family or an explicit subset. */
export interface ToolCatalogSelection {
  readonly profile: McpToolProfile;
  readonly families: readonly ToolFamily[];
}

/** Every family, in declaration order. */
export const FULL_TOOL_FAMILIES: readonly ToolFamily[] = TOOL_FAMILY_IDS;

const requestedFamilies = (
  value: string,
):
  | { readonly ok: true; readonly names: readonly ToolFamily[] }
  | { readonly ok: false; readonly unknown: readonly string[] } => {
  const requested = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const unknown = requested.filter(
    (entry) => !TOOL_FAMILY_IDS.includes(entry as ToolFamily),
  );
  if (unknown.length > 0) return { ok: false, unknown };
  return {
    ok: true,
    names: [...new Set(requested as ToolFamily[])].sort(
      compareUnicodeCodePoints,
    ),
  };
};

/** Raw advertisement selection accepted at the environment boundary. */
export const mcpToolProfileSchema = z.string().refine((value) => {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "full" || trimmed === "core"
    ? true
    : requestedFamilies(trimmed).ok;
}, MCP_TOOL_PROFILE_CONSTRAINT);

/**
 * Parse the advertised tool-family selection. The default keeps the complete
 * catalog; selecting families bounds what the server advertises without
 * changing any canonical contract or server-side validation. The session
 * family is always advertised so lifecycle and discovery stay reachable.
 */
export const parseMcpToolProfile = (
  value: string | undefined,
): Result<ToolCatalogSelection | undefined, ConfigurationError> => {
  if (value === undefined) return ok(undefined);
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "full")
    return ok({ profile: "full", families: FULL_TOOL_FAMILIES });
  if (trimmed === "core")
    return ok({ profile: "core", families: CORE_TOOL_FAMILIES });
  const selected = requestedFamilies(trimmed);
  if (!selected.ok)
    return err(
      new ConfigurationError(MCP_TOOL_PROFILE_CONSTRAINT, {
        settings: [
          {
            setting: "REA_MCP_TOOL_PROFILE",
            constraint: `${MCP_TOOL_PROFILE_CONSTRAINT} Unknown: ${selected.unknown.join(", ")}.`,
          },
        ],
      }),
    );
  return ok({
    profile: "custom",
    families: [...new Set(["session", ...selected.names] as ToolFamily[])].sort(
      compareUnicodeCodePoints,
    ),
  });
};
