-- Adds persistent comment media and spoiler disclosure fields.
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS gif_url text;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_spoiler boolean NOT NULL DEFAULT false;

-- Preserve text comments while permitting GIF-only comments.
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS cm_content_len;
ALTER TABLE public.comments ADD CONSTRAINT cm_content_or_gif
  CHECK (length(content) <= 2000 AND (length(btrim(content)) >= 1 OR gif_url IS NOT NULL));

-- Only the application-selected GIPHY media hosts are accepted as persisted GIF URLs.
ALTER TABLE public.comments ADD CONSTRAINT cm_gif_url_length
  CHECK (gif_url IS NULL OR length(gif_url) <= 2048);
ALTER TABLE public.comments ADD CONSTRAINT cm_gif_url_trusted_host
  CHECK (gif_url IS NULL OR gif_url ~ '^https://(media[0-9]*|i)\\.giphy\\.com/');
