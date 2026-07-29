# Privacy Policy

Last updated July 2026.

We run Aniraku at [aniraku.vercel.app](https://aniraku.vercel.app). Here's what happens with your data.

## What we collect

If you make an account:

- Your email (handled by Supabase — we never see the password)
- A username
- Whatever avatar you set

As you use the site:

- Watch history and progress (what episode, how far in)
- Bookmarks you save
- Search terms you type

## What we don't

- We don't track *which* anime you watch. We know you watched episode 5 of *something*, but we don't keep a "this person watched Naruto" kind of log.
- No analytics. No tracking cookies. No ads.
- Your data isn't sold to anyone, shared with advertisers, or used to build profiles.

## Where stuff lives

- Account info is in Supabase. It sits on AWS, encrypted at rest.
- Watch progress lives in two places — your browser's localStorage, and in Supabase if you're signed in. The local copy means your progress works even offline or when the backend is down.
- Bookmarks are local-only for now, saved in your browser.

## Third parties

- **AniList** — we grab anime metadata (titles, artwork, descriptions) from their public GraphQL API. We don't send them anything about you.
- **Supabase** — handles auth and stores user data. Your password never touches our servers.
- **Streaming backend** — a separate service resolves where video files actually come from. Your requests go through it as a proxy; the upstream sources don't see your IP.

## How long we keep things

- Account data? Until you delete your account.
- Watch history? Until you clear it.
- Local browser data? Until you clear your site data in browser settings.

## If you're under 13

This site isn't meant for kids under 13. We don't knowingly collect data from anyone that young. If you think we accidentally have, open a GitHub issue and we'll take care of it.

## Your rights

- Ask us what data we have on you
- Ask us to delete it
- Export your watch history
- Delete local data anytime by clearing your browser's site data

## Changes

If we update this policy, we'll note it here. Using the site after changes means you're okay with them.

## Questions?

Open an issue on [GitHub](https://github.com/Aniraku/Aniraku/issues) or find us on [Discord](https://discord.gg/aniraku).
