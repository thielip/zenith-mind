interface ModuleHeaderProps {
  title: string;
  description: string;
}

export function ModuleHeader({ title, description }: ModuleHeaderProps) {
  return (
    <header className="mb-6">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-400/70">
        作戰中心
      </p>
      <h1 className="mt-1 text-2xl font-bold text-white">{title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-400">{description}</p>
    </header>
  );
}
