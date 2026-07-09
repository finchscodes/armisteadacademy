const SIZES = {
  sm: { box: "w-8 h-8", text: "text-sm", border: "border" },
  md: { box: "w-14 h-14", text: "text-xl", border: "border-2" },
} as const;

export function CharacterBadge({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${s.box} rounded-full object-cover ${s.border} border-brass-500/60`}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`${s.box} rounded-full ${s.border} border-brass-500/60 bg-gradient-to-br from-claret-600 to-claret-500 flex items-center justify-center shrink-0`}
    >
      <span className={`font-display ${s.text} text-parchment-100`}>{initial}</span>
    </div>
  );
}
