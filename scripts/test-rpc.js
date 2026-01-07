const baseUrl = process.env.RPC_URL ?? "rpc.inlang.com";

async function assertOk(response, label) {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `${label} failed: ${response.status} ${response.statusText} ${body}`
    );
  }
}

async function main() {
  console.log(`[test-rpc] base URL: ${baseUrl}`);
  const optionsResponse = await fetch(`${baseUrl}/_rpc`, { method: "OPTIONS" });
  await assertOk(optionsResponse, "rpc options");
  console.log("[test-rpc] options ok");

  // Simple sanity check: ensure the endpoint responds to POST with JSON.
  const rpcResponse = await fetch(`${baseUrl}/_rpc`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  await assertOk(rpcResponse, "rpc post");
  await rpcResponse.json();
  console.log("[test-rpc] post ok");

  const machineTranslatePayload = {
    jsonrpc: "2.0",
    id: "rpc-test",
    method: "machineTranslateBundle",
    params: [
      {
        sourceLocale: "en",
        targetLocales: ["de"],
        bundle: {
          id: "rpc-test-bundle",
          declarations: [],
          messages: [
            {
              id: "rpc-test-message",
              bundleId: "rpc-test-bundle",
              locale: "en",
              selectors: [],
              variants: [
                {
                  id: "rpc-test-variant",
                  messageId: "rpc-test-message",
                  matches: [
                    {
                      type: "catchall-match",
                      key: "name",
                    },
                  ],
                  pattern: [{ type: "text", value: "Hello world" }],
                },
              ],
            },
          ],
        },
      },
    ],
  };

  const translateResponse = await fetch(`${baseUrl}/_rpc`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(machineTranslatePayload),
  });
  await assertOk(translateResponse, "rpc machineTranslateBundle");
  const translateJson = await translateResponse.json();

  if (translateJson?.error) {
    throw new Error(
      `machineTranslateBundle error: ${JSON.stringify(translateJson.error)}`
    );
  }

  const rpcResult = translateJson?.result;
  if (rpcResult?.error) {
    throw new Error(`machineTranslateBundle error: ${rpcResult.error}`);
  }

  console.log("[test-rpc] machineTranslateBundle ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
