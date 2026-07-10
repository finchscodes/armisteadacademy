-- Run this in Supabase's SQL Editor. Creates a public storage bucket for
-- faceclaim images/gifs. Public means anyone can VIEW files in it (needed so
-- avatars show up in chat/posts for all visitors) — but nobody can upload
-- directly to it from the browser. All uploads go through the app's server,
-- authenticated with your own login, using the service role key (which never
-- touches the browser). So "public" here is safe: read-only from the outside.
insert into storage.buckets (id, name, public)
values ('faceclaims', 'faceclaims', true)
on conflict (id) do nothing;
