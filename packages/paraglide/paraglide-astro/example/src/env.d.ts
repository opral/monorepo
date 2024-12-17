/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    paraglide: {
      lang: string;
      dir: "ltr" | "rtl";
    };
  }
}
