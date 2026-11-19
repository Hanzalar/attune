declare const __BUILD_SHA__: string;

interface ImportMetaEnv {
  /** Origin of the assistant gateway when it isn't proxied under the app's own origin. */
  readonly VITE_ASSISTANT_URL?: string;
  /** Public base URL of the MCP connector (e.g. a tunnel) shown to the patient. */
  readonly VITE_CONNECTOR_BASE?: string;
}
