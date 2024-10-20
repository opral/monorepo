import { it, describe, expect } from "vitest";
import * as auth from "./implementation.js";

describe("auth service", () => {
  const mockSecret = "bWmlgSgQLZgoZv+0dh/Y7NNtsowIfh7y2phtEz0EIME=";

  it("should be able to encrypt and decrypt", async () => {
    const jwe = await auth.encryptAccessToken({
      accessToken: "test",
      JWE_SECRET_KEY: mockSecret,
    });
    const decrypted = await auth.decryptAccessToken({
      JWE_SECRET_KEY: mockSecret,
      jwe,
    });
    expect(decrypted).toBe("test");
  });
  it("should fail if the secret is wrong", async () => {
    const jwe = await auth.encryptAccessToken({
      accessToken: "test",
      JWE_SECRET_KEY: mockSecret,
    });
    expect(
      async () =>
        await auth.decryptAccessToken({
          // changing the last character of the secret
          JWE_SECRET_KEY: mockSecret.slice(0, -2) + "s",
          jwe,
        })
    ).rejects.toThrowError();
  });
});
