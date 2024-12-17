"use server";
import { initializeLanguage } from "@inlang/paraglide-next";
import * as m from "@/paraglide/messages";

initializeLanguage(); //call this before any actions

export async function greet(formData: FormData) {
  const name = formData.get("name") as string;
  console.info(m.hello({ name }));
  return m.hello({ name });
}

export async function fetchData() {
  const data = "this is the data";
  console.info("server response:", data);
  return data;
}
