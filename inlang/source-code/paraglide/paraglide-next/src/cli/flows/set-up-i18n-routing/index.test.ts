import { describe, it, expect } from "vitest";
import { replaceNextLinkImports, replaceNextNavigationImports } from "./index";

describe("replaceNextLinkImports", () => {
  it("replaces a normal Link import", () => {
    const code = `import Link from "next/link"`;

    const newCode = replaceNextLinkImports(code);
    expect(newCode).includes(`import { Link } from "@/lib/i18n"`);
    expect(newCode).not.includes("next/link");
  });

  it("replaces an aliased Link import", () => {
    const code = `import L from "next/link"`;

    const newCode = replaceNextLinkImports(code);
    expect(newCode).includes(`import { Link as L } from "@/lib/i18n"`);
    expect(newCode).not.includes("next/link");
  });
});

describe("replaceNextNavigationImports", () => {
  it("replaces the next/navigation imports", () => {
    const code = `import { usePathname, useRouter } from "next/navigation"`;
    const newCode = replaceNextNavigationImports(code);
    expect(newCode).includes(
      `import { usePathname, useRouter } from "@/lib/i18n"`,
    );
    expect(newCode).not.includes("next/navigation");
  });

  it("replaces aliased next/navigation imports", () => {
    const code = `import { usePathname as p, useRouter as r } from "next/navigation"`;
    const newCode = replaceNextNavigationImports(code);
    expect(newCode).includes(
      `import { usePathname as p, useRouter as r } from "@/lib/i18n"`,
    );
    expect(newCode).not.includes("next/navigation");
  });

  it("keeps non-translated next/navigation imports", () => {
    const code = `import { useSearchParams as uSP, usePathname } from "next/navigation"`;
    const newCode = replaceNextNavigationImports(code);
    expect(newCode).includes(
      `import { useSearchParams as uSP } from "next/navigation"`,
    );
    expect(newCode).includes(`import { usePathname } from "@/lib/i18n"`);
  });
});
