interface CloudflareEnv {
  HYPERDRIVE?: { connectionString: string };
  ASSETS: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
}
