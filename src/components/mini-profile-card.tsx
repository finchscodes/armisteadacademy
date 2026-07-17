"use client";

import Link from "next/link";
import type { MiniProfile } from "@/actions/mini-profile";
import { getMajorColor } from "@/lib/majors";

/**
 * The actual hover-card popup content — pulled out of CharacterHoverCard so
 * the same visual can be triggered from plain DOM hover targets too (e.g.
 * @mentions inside rendered rich text, which aren't React elements).
 */
export function MiniProfileCard({
  profile,
  slug,
  top,
  left,
}: {
  profile: MiniProfile;
  slug: string;
  top: number;
  left: number;
}) {
  const hoverMajorColor = getMajorColor(profile.major) ?? "#d9b64a";

  return (
    <div
      style={{ position: "fixed", top, left }}
      className="z-50 w-64 bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 p-2 flex items-start gap-2.5 text-left"
    >
      <Link href={`/c/${slug}`} className="shrink-0 relative block w-20 h-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl ?? undefined}
          alt={`${profile.firstName} ${profile.lastName}`}
          className="w-20 h-20 rounded-md object-cover border border-gunmetal-500/50 bg-ink-800"
          style={{ display: profile.avatarUrl ? "block" : "none" }}
        />
        {!profile.avatarUrl && (
          <div
            className="w-20 h-20 rounded-md border border-gunmetal-500/50 bg-gradient-to-br from-claret-600 to-claret-500 flex items-center justify-center"
            style={{ color: profile.nameColor ?? undefined }}
          >
            <span className="font-display text-2xl text-parchment-100">{profile.firstName.charAt(0)}</span>
          </div>
        )}
        <span
          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-ink-900 ${
            profile.presence === "online"
              ? "bg-green-500"
              : profile.presence === "away"
                ? "bg-yellow-500"
                : "bg-claret-600"
          }`}
          data-tooltip={profile.presence === "online" ? "Online" : profile.presence === "away" ? "Away" : "Offline"}
        />
      </Link>
      <div className="text-xs space-y-0.5 py-0.5 min-w-0 flex-1">
        {profile.statuses.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {profile.statuses.map((s) => (
              <span
                key={s}
                className="text-[10px] rounded px-1.5 py-0.5 border"
                style={{
                  color: hoverMajorColor,
                  backgroundColor: `${hoverMajorColor}26`,
                  borderColor: `${hoverMajorColor}4d`,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <p>
          <span className="text-ink-400">Age: </span>
          <span className="text-parchment-100">{profile.age}</span>
        </p>
        <p>
          <span className="text-ink-400">Year: </span>
          <span className="text-parchment-100">{profile.year}</span>
        </p>
        {profile.hallLabel && (
          <p className="break-words">
            <span className="text-ink-400">Hall: </span>
            <span style={{ color: profile.hallColor ?? undefined }}>{profile.hallLabel}</span>
          </p>
        )}
        <p className="leading-snug break-words">
          <span className="text-ink-400">Major: </span>
          <span style={{ color: getMajorColor(profile.major) ?? undefined }}>{profile.major}</span>
        </p>
      </div>
    </div>
  );
}
