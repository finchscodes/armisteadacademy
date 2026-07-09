export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="text-center mb-6">
        <h1 className="font-display text-3xl text-brass-400">{title}</h1>
        <p className="text-ink-400 text-sm mt-1">{subtitle}</p>
      </div>
      <div className="bg-parchment-100 text-parchment-ink rounded-lg shadow-2xl shadow-black/40 p-6 border border-brass-600/30">
        {children}
      </div>
    </div>
  );
}
