import { sanitizeRichTextEdge } from "@/lib/sanitize/html-edge";

describe("sanitizeRichTextEdge", () => {
  it("removes script and iframe blocks", () => {
    const dirty =
      '<p>ok</p><script>alert(1)</script><iframe src="https://evil.com"></iframe>';
    const clean = sanitizeRichTextEdge(dirty);
    expect(clean).not.toMatch(/script|iframe/i);
    expect(clean).toContain("<p>ok</p>");
  });

  it("strips event handlers and javascript: URLs", () => {
    const dirty = '<p onclick="alert(1)">x</p><a href="javascript:alert(1)">y</a>';
    const clean = sanitizeRichTextEdge(dirty);
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("javascript:");
  });

  it("removes svg and unknown tags", () => {
    const dirty =
      '<svg onload="alert(1)"><circle /></svg><custom>text</custom><p>safe</p>';
    const clean = sanitizeRichTextEdge(dirty);
    expect(clean).not.toMatch(/svg|custom/i);
    expect(clean).toContain("<p>safe</p>");
  });

  it("keeps allowed tags and adds rel on external links", () => {
    const dirty =
      '<a href="https://example.com" target="_blank">link</a><img src="https://cdn.example.com/a.jpg" alt="a" />';
    const clean = sanitizeRichTextEdge(dirty);
    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('rel="noopener noreferrer"');
    expect(clean).toContain("<img");
  });
});
