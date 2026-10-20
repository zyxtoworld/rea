import type { TOOL_CONTRACTS } from "./toolContracts.js";

type ToolName = (typeof TOOL_CONTRACTS)[number]["name"];

export type ToolFamily =
  | "session"
  | "native"
  | "artifacts"
  | "data"
  | "web"
  | "mobile"
  | "debug"
  | "workflows";

/** One caller-selectable group of tools sharing a target-family purpose. */
export interface ToolFamilyDefinition {
  readonly id: ToolFamily;
  readonly title: string;
  readonly description: string;
}

/**
 * Complete partition of the public catalog. Every contract belongs to exactly
 * one family; `toolFamilies.test.ts` enforces that invariant against
 * `TOOL_CONTRACTS`, so a new tool cannot enter the catalog unfiled.
 */
export const TOOL_FAMILIES: readonly ToolFamilyDefinition[] = [
  {
    id: "session",
    title: "Session and Evidence",
    description:
      "Target lifecycle, Evidence bundles, residual unknowns, and cross-Evidence comparisons.",
  },
  {
    id: "native",
    title: "Native binaries",
    description:
      "Deep provider analysis, navigation, annotations, and native or managed artifact inspection.",
  },
  {
    id: "artifacts",
    title: "Artifacts and reconstruction",
    description:
      "Artifact inventory and extraction plus managed reconstruction workflows.",
  },
  {
    id: "data",
    title: "Data and formats",
    description:
      "Go, Rust, WASM, EVM, SQLite, firmware, Flutter, packet captures, and signal recordings.",
  },
  {
    id: "web",
    title: "Web and JavaScript",
    description:
      "Browser, Electron, JavaScript bundle, runtime observation, and source recovery tools.",
  },
  {
    id: "mobile",
    title: "Android and mobile",
    description:
      "Android packages, Apktool resources, JEB projects, and ADB device operations.",
  },
  {
    id: "debug",
    title: "Debuggers and instrumentation",
    description:
      "GDB, Rizin, Cutter, Frida, and the reverse-engineering command surface.",
  },
  {
    id: "workflows",
    title: "Application workflows",
    description:
      "Cross-layer application traces, version comparisons, and reconstruction ledgers.",
  },
];

const FAMILY_MEMBERS: Record<ToolFamily, readonly ToolName[]> = {
  session: [
    "binary_session",
    "build_call_path",
    "capture_process_scenario",
    "close_binary",
    "compare_artifacts",
    "compare_bundles",
    "compare_functions",
    "compare_process_captures",
    "correlate_static_and_runtime",
    "export_evidence_bundle",
    "find_changed_behavior",
    "get_evidence_bundle",
    "get_navigation_context",
    "import_evidence_bundle",
    "inspect_address_context",
    "list_unknowns",
    "match_native_functions",
    "open_binary",
    "record_unknown",
    "update_unknown",
    "verify_reconstruction",
    "verify_unknown_resolution",
  ],
  native: [
    "address_name",
    "address_to_file_offset",
    "analyze_function",
    "analyze_swift_types",
    "annotate_native_function",
    "batch_decompile",
    "binary_overview",
    "capture_native_ui_scenario",
    "comment",
    "current_address",
    "current_document",
    "current_procedure",
    "demangle_swift",
    "find_xrefs_to_name",
    "get_call_graph",
    "get_objc_classes",
    "get_objc_protocols",
    "goto_address",
    "inline_comment",
    "inspect_analysis_view",
    "inspect_binary_layout",
    "inspect_macho",
    "inspect_managed_artifact",
    "inspect_managed_members",
    "inspect_managed_native_boundaries",
    "inspect_native_api",
    "inspect_native_data_type",
    "inspect_native_dispatch_metadata",
    "inspect_native_instruction",
    "inspect_native_load_image",
    "inspect_pe_resources",
    "inspect_plist",
    "inspect_recorded_crash",
    "inspect_signature",
    "list_architectures",
    "list_bookmarks",
    "list_documents",
    "list_names",
    "list_procedures",
    "list_segments",
    "list_strings",
    "next_address",
    "observe_native_calls",
    "observe_native_ui",
    "prev_address",
    "procedure_address",
    "procedure_assembly",
    "procedure_callees",
    "procedure_callers",
    "procedure_info",
    "procedure_pseudo_code",
    "procedure_references",
    "read_bytes",
    "read_function_instructions",
    "resolve_containing_procedure",
    "resolve_native_call_targets",
    "search_bytes",
    "search_procedures",
    "search_strings",
    "set_address_name",
    "set_addresses_names",
    "set_bookmark",
    "set_comment",
    "set_inline_comment",
    "trace_call_path",
    "trace_feature",
    "trace_native_ui_action",
    "trace_native_values",
    "unset_bookmark",
    "xrefs",
  ],
  artifacts: [
    "compare_managed_members",
    "decode_interface_builder",
    "extract_artifact",
    "import_managed_reconstruction",
    "inspect_artifact",
    "inspect_asset_catalog",
    "inspect_keyed_archive",
    "project_managed_application_graph",
    "trace_dylib_resolution",
    "verify_managed_native_boundaries",
  ],
  data: [
    "compare_wasm_interfaces",
    "decode_signal_recording",
    "extract_firmware",
    "identify_flutter_build",
    "inspect_dart_aot",
    "inspect_evm_interface",
    "inspect_firmware_regions",
    "inspect_go_binary",
    "inspect_il2cpp_metadata",
    "inspect_packet_capture",
    "inspect_packet_fields",
    "inspect_pcap_capture",
    "inspect_pcap_client",
    "inspect_rust_binary",
    "inspect_signal_decoders",
    "inspect_sqlite_database",
    "inspect_wasm_artifact",
  ],
  web: [
    "analyze_javascript_application",
    "analyze_web_bundle",
    "capture_browser_scenario",
    "capture_electron_scenario",
    "capture_web_screenshot",
    "compare_web_captures",
    "compare_web_screenshots",
    "discover_webmcp_tools",
    "export_web_scripts",
    "inspect_desktop_application",
    "inspect_electron_fuses",
    "inspect_electron_page",
    "inspect_web_event_listeners",
    "inspect_web_network_capture",
    "inspect_web_page",
    "list_browser_targets",
    "list_electron_targets",
    "list_javascript_runtime_targets",
    "observe_javascript_runtime",
    "observe_web_execution",
    "observe_web_session",
    "reconcile_javascript_runtime",
    "recover_javascript_sources",
    "trace_web_module_imports",
    "trace_web_source_location",
  ],
  mobile: [
    "capture_adb_screen",
    "collect_adb_bugreport",
    "decode_android_resources",
    "decompile_jeb_item",
    "inspect_adb_client",
    "inspect_adb_device",
    "inspect_adb_display",
    "inspect_adb_package",
    "inspect_adb_window",
    "inspect_android_class",
    "inspect_android_method",
    "inspect_android_package",
    "inspect_apktool_client",
    "inspect_jeb_client",
    "install_adb_package",
    "list_adb_devices",
    "list_adb_directory",
    "list_adb_features",
    "list_adb_packages",
    "list_adb_processes",
    "list_adb_services",
    "list_jeb_units",
    "open_jeb_project",
    "pull_adb_file",
    "pull_adb_package",
    "push_adb_file",
    "read_adb_logcat",
    "read_adb_setting",
    "resolve_adb_packages",
    "search_android_classes",
    "start_adb_activity",
    "start_adb_app",
    "stop_adb_app",
    "trace_android_references",
    "uninstall_adb_package",
  ],
  debug: [
    "close_frida_session",
    "close_gdb_session",
    "close_rizin_debug_session",
    "cutter_command",
    "execute_rizin_command",
    "frida_session_status",
    "gdb_console",
    "gdb_session_status",
    "inspect_with_objdump",
    "instrument_with_frida",
    "list_cutter_sessions",
    "list_frida_devices",
    "list_frida_processes",
    "load_frida_script",
    "resume_frida_session",
    "rizin_debug_command",
    "rizin_debug_session_status",
    "start_frida_session",
    "start_gdb_session",
    "start_rizin_debug_session",
    "unload_frida_script",
  ],
  workflows: [
    "build_reconstruction_obligation_ledger",
    "compare_application_versions",
    "compare_javascript_export_shapes",
    "compare_source_to_bundle",
    "evaluate_reconstruction_coverage",
    "project_android_application_graph",
    "project_apple_application_graph",
    "project_harmony_application_graph",
    "trace_application_feature",
    "trace_javascript_semantics",
  ],
};

/** Contract names owned by each family. */
export const TOOL_FAMILY_MEMBERS = FAMILY_MEMBERS;

/** Every family identifier in declaration order. */
export const TOOL_FAMILY_IDS: readonly ToolFamily[] = TOOL_FAMILIES.map(
  ({ id }) => id,
);

/** Families mounted by the `core` profile: lifecycle plus deep binary analysis. */
export const CORE_TOOL_FAMILIES: readonly ToolFamily[] = [
  "session",
  "native",
  "artifacts",
];

const FAMILY_BY_TOOL_NAME: Record<string, ToolFamily> = Object.fromEntries(
  TOOL_FAMILY_IDS.flatMap((family) =>
    FAMILY_MEMBERS[family].map((name) => [name, family]),
  ),
);

/** Family that owns one tool name, or undefined for a name outside the catalog. */
export const toolFamilyOf = (name: string): ToolFamily | undefined =>
  FAMILY_BY_TOOL_NAME[name];
