import { describe, expect, it } from "vitest";

import { TOOL_CONTRACTS } from "./toolContracts.js";
import {
  CORE_TOOL_FAMILIES,
  TOOL_FAMILIES,
  TOOL_FAMILY_IDS,
  TOOL_FAMILY_MEMBERS,
  toolContractsForFamilies,
  toolFamilyOf,
} from "./toolFamilies.js";

const catalogNames = TOOL_CONTRACTS.map(({ name }) => name);

describe("tool families", () => {
  it("partitions the complete public catalog exactly once", () => {
    const assigned = TOOL_FAMILY_IDS.flatMap(
      (family) => TOOL_FAMILY_MEMBERS[family],
    );
    expect(assigned.filter((name) => !catalogNames.includes(name))).toEqual([]);
    expect(new Set(assigned).size).toBe(assigned.length);
    expect([...assigned].sort()).toEqual([...catalogNames].sort());
    expect(assigned.length).toBe(catalogNames.length);
  });

  it("declares one definition per family identifier", () => {
    expect(TOOL_FAMILIES.map(({ id }) => id)).toEqual(TOOL_FAMILY_IDS);
    expect(new Set(TOOL_FAMILY_IDS).size).toBe(TOOL_FAMILY_IDS.length);
  });

  it("resolves families in catalog order without duplicating contracts", () => {
    for (const family of TOOL_FAMILY_IDS) {
      const resolved = toolContractsForFamilies([family]).map(
        ({ name }) => name,
      );
      expect([...resolved].sort()).toEqual(
        [...TOOL_FAMILY_MEMBERS[family]].sort(),
      );
      // Selection preserves catalog order, so registration stays deterministic.
      expect(resolved).toEqual(
        catalogNames.filter((name) => resolved.includes(name)),
      );
    }
    const all = toolContractsForFamilies(TOOL_FAMILY_IDS);
    expect(all.map(({ name }) => name)).toEqual(catalogNames);
    expect(new Set(selectAll(TOOL_FAMILY_IDS, all)).size).toBe(all.length);
  });

  it("files every catalog tool under exactly one family", () => {
    for (const name of catalogNames) {
      const families = TOOL_FAMILY_IDS.filter((family) =>
        TOOL_FAMILY_MEMBERS[family].includes(name as never),
      );
      expect(families).toHaveLength(1);
      expect(toolFamilyOf(name)).toBe(families[0]);
    }
    expect(toolFamilyOf("not_a_tool")).toBeUndefined();
  });

  it("mounts the core profile as session, native, and artifacts", () => {
    expect(CORE_TOOL_FAMILIES).toEqual(["session", "native", "artifacts"]);
    const core = toolContractsForFamilies(CORE_TOOL_FAMILIES);
    expect(core).toHaveLength(
      CORE_TOOL_FAMILIES.reduce(
        (total, family) => total + TOOL_FAMILY_MEMBERS[family].length,
        0,
      ),
    );
    expect(core.map(({ name }) => name)).toContain("open_binary");
    expect(core.map(({ name }) => name)).not.toContain("inspect_web_page");
  });
});

const selectAll = (
  families: readonly (typeof TOOL_FAMILY_IDS)[number][],
  contracts: readonly { readonly name: string }[],
): readonly string[] =>
  contracts
    .filter(({ name }) =>
      families.some((family) =>
        TOOL_FAMILY_MEMBERS[family].includes(name as never),
      ),
    )
    .map(({ name }) => name);
