declare module "*.gen.json" {
  const data: {
    generatedAt: string;
    data: Record<string, number | null>;
  };
  export default data;
}
