import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createTestBinarySession } from "../../fixtures/binarySession.js";
import { observed } from "../../fixtures/analysisExecution.js";
import { ok as resultOk } from "../../../src/domain/result.js";
import type { AnalysisProvider } from "../../../src/application/AnalysisProvider.js";
import {
  TOOL_CONTRACTS,
  toolContractsForFamilies,
} from "../../../src/contracts/toolContracts.js";
import {
  CORE_TOOL_FAMILIES,
  TOOL_FAMILY_MEMBERS,
} from "../../../src/contracts/toolFamilies.js";
import {
  expandToolAvailability,
  sessionProvider,
} from "../../../src/contracts/toolOutputSchemaPrimitives.js";
import { createServer } from "../../../src/server/createServer.js";
import { parseMcpToolProfile } from "../../../src/config/mcpToolProfile.js";

const coreContracts = toolContractsForFamilies(CORE_TOOL_FAMILIES);
const coreNames = coreContracts.map(({ name }) => name).sort();

const availabilityProvider = (): AnalysisProvider => {
  const identity = { id: "fixture", name: "Fixture", version: "1" };
  return {
    identity: () => identity,
    capabilities: () => [],
    createClient: () => ({
      health: () => Promise.resolve(),
      execute: () => Promise.resolve(observed(null)),
      close: () => Promise.resolve(resultOk(null)),
    }),
  };
};

const connect = async (environment: Record<string, string>) => {
  const session = createTestBinarySession(availabilityProvider());
  const server = createServer({ kind: "session", session }, { environment });
  const client = new Client({ name: "tool-profile-test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    server,
    client,
    close: async () => {
      await Promise.allSettled([
        client.close(),
        server.close(),
        session.close(),
      ]);
    },
  };
};

describe("MCP tool profile", () => {
  it("advertises the complete catalog by default", async () => {
    const live = await connect({});
    try {
      const listed = await live.client.listTools();
      expect(listed.tools).toHaveLength(TOOL_CONTRACTS.length);
      expect(live.server.advertisedToolNames).toBeUndefined();
      expect(live.server.catalogIdentity.counts.mcp_tools).toBe(
        TOOL_CONTRACTS.length,
      );
    } finally {
      await live.close();
    }
  });

  it("advertises only the core families and keeps the inventory consistent", async () => {
    const live = await connect({ REA_MCP_TOOL_PROFILE: "core" });
    try {
      const listed = await live.client.listTools();
      expect(listed.tools.map(({ name }) => name).sort()).toEqual(coreNames);
      expect(listed.tools.map(({ name }) => name)).not.toContain(
        "inspect_web_page",
      );

      // binary_session stays mounted: it is how callers discover the selection.
      const status = z.object({ result: sessionProvider }).parse(
        (
          await live.client.callTool({
            name: "binary_session",
            arguments: {},
          })
        ).structuredContent,
      ).result;
      const inventoryNames = expandToolAvailability(
        status.tool_availability,
      ).map(({ name }) => name);
      expect(inventoryNames.sort()).toEqual(coreNames);

      expect(status.server_identity.catalog.counts.mcp_tools).toBe(
        coreNames.length,
      );
      expect(status.server_identity.catalog).toEqual(
        live.server.catalogIdentity,
      );
    } finally {
      await live.close();
    }
  });

  it("keeps the digest tied to the advertised subset", async () => {
    const live = await connect({ REA_MCP_TOOL_PROFILE: "core" });
    try {
      const response = await live.client.callTool({
        name: "binary_session",
        arguments: {
          expected_catalog_digest:
            live.server.catalogIdentity.digests.combined_sha256,
        },
      });
      const status = z
        .object({ result: sessionProvider })
        .parse(response.structuredContent).result;
      expect(status.server_identity.alignment).toMatchObject({
        state: "aligned",
        reasons: [],
      });
    } finally {
      await live.close();
    }
  });

  it("rejects a tool the selected profile does not advertise", async () => {
    const live = await connect({ REA_MCP_TOOL_PROFILE: "core" });
    try {
      const hidden = await live.client
        .callTool({
          name: "inspect_web_page",
          arguments: { url: "https://example.test" },
        })
        .then(
          (result) => ({ ok: true as const, result }),
          (cause: unknown) => ({ ok: false as const, cause }),
        );
      if (hidden.ok)
        expect(
          hidden.result.isError === true ||
            JSON.stringify(hidden.result).includes("inspect_web_page"),
        ).toBe(true);
      else expect(String(hidden.cause)).toMatch(/disabled|not found/i);
    } finally {
      await live.close();
    }
  });

  it("mounts exactly the requested families for a custom selection", async () => {
    const live = await connect({ REA_MCP_TOOL_PROFILE: "debug,session" });
    try {
      const names = (await live.client.listTools()).tools
        .map(({ name }) => name)
        .sort();
      expect(names).toEqual(
        [...TOOL_FAMILY_MEMBERS.debug, ...TOOL_FAMILY_MEMBERS.session].sort(),
      );
    } finally {
      await live.close();
    }
  });

  it("always adds session to an explicit family list", () => {
    const parsed = parseMcpToolProfile("debug");
    expect(parsed.ok && parsed.value?.families).toEqual(["debug", "session"]);
    expect(parsed.ok && parsed.value?.profile).toBe("custom");
    const invalid = parseMcpToolProfile("debug,nope");
    expect(invalid.ok).toBe(false);
  });
});
