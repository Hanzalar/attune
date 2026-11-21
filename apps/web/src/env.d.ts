declare const __BUILD_SHA__: string;

interface ImportMetaEnv {
  /** Origin of the connector gateway's hub when it isn't proxied under the app's own origin. */
  readonly VITE_GATEWAY_URL?: string;
  /** Public base URL of the MCP connector (e.g. a tunnel) shown to the patient. */
  readonly VITE_CONNECTOR_BASE?: string;
}
