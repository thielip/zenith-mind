/** 避免 JSON-LD 內嵌 script 被 `</script>` 截斷 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
