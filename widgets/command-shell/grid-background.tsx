export function GridBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-[#05070F]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,210,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,210,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }}
    />
  );
}
