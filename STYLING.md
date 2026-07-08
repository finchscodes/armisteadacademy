# Styling Armistead yourself

You don't need to ask me to change colors, spacing, or fonts — most of it lives
in a few predictable places. Here's the map.

## The color theme (the fastest thing to change)

**File: `src/app/globals.css`**

Near the top you'll see a `:root { ... }` block full of lines like:

```css
--ink-950: #0d0f18;      /* darkest background */
--ink-900: #12141f;      /* card backgrounds */
--brass-500: #c9a227;    /* the gold accent (buttons, links) */
--claret-500: #8a2439;   /* the red accent */
--parchment-100: #f6efdc;/* main text color */
```

Change any hex value and the whole site updates — every button, border, and
heading references these, so you never hunt through individual files. Want a
blue theme instead of gold? Change `--brass-500` (and the `-400`/`-600`
shades near it) and reload.

The names are just labels — "brass" is gold, "claret" is dark red, "ink" is
the dark navy, "parchment" is the cream text. Rename them if you like, but then
you'd have to update the references, so easier to just change the colors and
keep the names.

## Job colors (the colored names)

**File: `src/lib/roles.ts`** — find `JOB_META`. Each job has a `color:` hex.
Change those to recolor names in chat and on the Job List.

## Major colors

**File: `src/lib/majors.ts`** — each major has a `color:` field. (Not currently
shown in chat, but used elsewhere and reserved for later.)

## Layout width

**File: `src/app/layout.tsx`** — the `max-w-[1400px]` on `<main>` controls how
wide the whole site is. Bigger number = wider. `src/components/nav-bar.tsx` has
a matching one to keep the nav aligned.

## Individual components

Everything visual is a component in `src/components/`. The styling is
Tailwind CSS — those `className="..."` strings. A few common tokens:

- `p-4` / `px-4` / `py-2` = padding (4 = 1rem, 2 = 0.5rem)
- `text-sm` / `text-lg` / `text-3xl` = font size
- `rounded-lg` = corner rounding
- `bg-ink-900` = background using your `--ink-900` color
- `text-brass-400` = text in your brass color
- `gap-4` = space between flex/grid items

So if you want the chat font bigger, open `src/components/chat-sidebar.tsx`,
find the message line (`className="text-sm ..."`), and change `text-sm` to
`text-base` or `text-lg`.

Tailwind's full cheat sheet: https://tailwindcss.com/docs — the search box
there is the fastest way to find the class for whatever you're trying to do.

## The safest way to experiment

1. Change one value
2. Save the file
3. If it's deployed on Vercel, push to GitHub and it redeploys; or run
   `npm run dev` locally to see changes instantly
4. If something looks wrong, undo that one change — you can't break the
   database from styling, only the appearance

Start with `globals.css` — it's the highest-leverage file and the hardest to
break.
