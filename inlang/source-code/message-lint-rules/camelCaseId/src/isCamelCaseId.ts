export const isCamelCaseId = (id: string) => {
  return /^[a-z]+((\d)|([A-Z0-9][a-z0-9]+))*([A-Z])?$/.test(id);
};
