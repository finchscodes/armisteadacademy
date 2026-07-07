export function CharacterBadge({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className="w-14 h-14 rounded-full object-cover border-2 border-brass-500/60"
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="w-14 h-14 rounded-full border-2 border-brass-500/60 bg-gradient-to-br from-claret-600 to-claret-500 flex items-center justify-center">
      <span className="font-display text-xl text-parchment-100">{initial}</span>
    </div>
  );
}
