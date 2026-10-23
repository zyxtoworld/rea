import type {
  Icon,
  Implementation,
  McpServerOptions,
  RegisteredTool,
  ScopeChallengeHandler,
  StandardSchemaWithJSON,
  ToolAnnotations,
  ToolCallback,
} from "@modelcontextprotocol/server";
import type { ToolContract } from "../contracts/toolContractTypes.js";
import type { EvidenceWriter } from "../application/investigation/InvestigationRecordPort.js";
import {
  FULL_CATALOG_IDENTITY,
  createCatalogIdentity,
} from "../catalogIdentity.js";
import type { ToolResultDelivery } from "./toolResult.js";
import {
  EvidenceMcpServerCore,
  type CompactInputSchemaPresentation,
} from "./EvidenceMcpServerCore.js";

export {
  currentMcpRequestSignal,
  forgetPendingMcpRequest,
  type CompactInputSchemaPresentation,
} from "./EvidenceMcpServerCore.js";

/** Canonical composition retains the constructor's existing identity defaults. */
export class EvidenceMcpServer extends EvidenceMcpServerCore {
  constructor(
    info: Implementation,
    options: McpServerOptions,
    recordEvidence: EvidenceWriter["recordEvidence"] | undefined,
    delivery: ToolResultDelivery,
    compactPresentation: CompactInputSchemaPresentation | undefined = undefined,
    omitOutputSchemas = false,
    advertisedContracts: readonly ToolContract[] | undefined = undefined,
  ) {
    super(
      info,
      options,
      recordEvidence,
      delivery,
      compactPresentation,
      omitOutputSchemas,
      advertisedContracts === undefined &&
        compactPresentation === undefined &&
        !omitOutputSchemas
        ? FULL_CATALOG_IDENTITY
        : createCatalogIdentity(
            compactPresentation,
            omitOutputSchemas ? "off" : "full",
            advertisedContracts,
          ),
    );
    this.advertisedToolNames =
      advertisedContracts === undefined
        ? undefined
        : new Set(advertisedContracts.map(({ name }) => name));
  }

  /**
   * Register every canonical contract while disabling tools outside a selected
   * profile so tools/list and explicit calls share one SDK registry.
   */
  override registerTool<
    OutputArgs extends StandardSchemaWithJSON,
    InputArgs extends StandardSchemaWithJSON | undefined = undefined,
  >(
    name: string,
    config: {
      title?: string;
      description?: string;
      inputSchema?: InputArgs;
      outputSchema?: OutputArgs;
      annotations?: ToolAnnotations;
      icons?: Icon[];
      scopeChallenge?: ScopeChallengeHandler;
      _meta?: Record<string, unknown>;
    },
    callback: ToolCallback<InputArgs>,
  ): RegisteredTool {
    const registered = super.registerTool(name, config, callback);
    if (
      this.advertisedToolNames !== undefined &&
      !this.advertisedToolNames.has(name)
    )
      registered.disable();
    return registered;
  }
}
