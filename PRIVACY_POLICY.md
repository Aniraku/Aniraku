# Privacy Policy

**Last updated: July 2026**

Aniraku ("we", "our") operates the Aniraku anime streaming platform at [aniraku.vercel.app](https://aniraku.vercel.app). This Privacy Policy describes how we collect, use, and protect your information.

## Information We Collect

### Account Information
- Email address (via Supabase authentication)
- Username
- Profile preferences and avatar

### Usage Data
- Watch history and playback progress
- Search queries
- Bookmarks
- Browser type and IP address (for rate limiting and abuse protection)

### What We Don't Collect
- We do **not** log which specific anime you watch
- We do **not** use third-party analytics or tracking cookies
- We do **not** sell or share your data with advertisers

## How We Use Information

- Provide and improve the streaming service
- Save your watch progress across devices (local + cloud sync)
- Authenticate your account and protect against abuse
- Sync bookmarks and preferences to your profile

## Data Storage

- **Account data** — stored in Supabase (hosted on AWS, encrypted at rest)
- **Watch progress** — stored both locally in your browser (localStorage) and in our database when signed in
- **Bookmarks** — stored locally in your browser
- **No tracking cookies** — we use no cookies for analytics or tracking purposes

## Third-Party Services

- **[AniList](https://anilist.co/)** — Anime metadata (titles, covers, descriptions, ratings). Queried via their public GraphQL API. We do not send any user data to AniList.
- **[Supabase](https://supabase.com/)** — Authentication, database, and row-level security. Your credentials are managed entirely by Supabase Auth.
- **Streaming Backend** — A separate Go service that resolves streaming sources. We proxy requests through this backend; your IP is not directly exposed to upstream providers.

## Data Retention

- **Account data** — retained until you delete your account
- **Watch history** — retained until you delete it from your profile
- **Local data (localStorage)** — cleared when you clear your browser data

## Your Rights

- Request access to your stored data
- Request deletion of your account and associated data
- Export your watch history
- Delete local data by clearing your browser's site data

## Children's Privacy

Aniraku is not intended for children under 13. We do not knowingly collect data from children under 13. If you believe we have inadvertently collected such data, please open an issue on GitHub and we will promptly remove it.

## Changes to This Policy

We may update this policy from time to time. Continued use of the platform after changes constitutes acceptance of the updated policy.

## Contact

For privacy concerns or data requests, please [open an issue on GitHub](https://github.com/Aniraku/Aniraku/issues) or reach out via our [Discord](https://discord.gg/aniraku).
