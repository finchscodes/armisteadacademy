const SIZES = {
  sm: { box: "w-8 h-8", text: "text-sm", border: "border", radius: "rounded-md" },
  md: { box: "w-14 h-14", text: "text-xl", border: "border-2", radius: "rounded-lg" },
  lg: { box: "w-24 h-24", text: "text-4xl", border: "border-2", radius: "rounded-lg" },
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
        className={`${s.box} ${s.radius} object-cover ${s.border} border-gunmetal-500/60 shrink-0`}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`${s.box} ${s.radius} ${s.border} border-gunmetal-500/60 bg-gradient-to-br from-claret-600 to-claret-500 flex items-center justify-center shrink-0`}
    >
      <span className={`font-display ${s.text} text-parchment-100`}>{initial}</span>
    </div>
  );
}
