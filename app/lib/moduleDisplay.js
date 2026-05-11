export function getModuleDisplayName(module) {
  return String(module?.name || "").trim() || String(module?.code || "").trim() || "Module"
}
