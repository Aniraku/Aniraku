# Android App Fallback

## Purpose

Offer the native Aniraku Android application to visitors who can actually use it without treating the web experience as a hostile fallback. The prompt is an optional, app-styled invitation—not an automatic redirect or an interstitial that blocks site access.

## Eligibility

The prompt appears only when all conditions are true: the visitor is on Android 9 or later, has a coarse-pointer mobile viewport, is not an Android TV or known automated browser, and has not previously chosen to continue on the web. Desktop visitors, iOS visitors, low-version Android visitors, TV browsers, bot user agents, authentication flows, legal routes, and the admin route never receive the prompt.

## Choices

| Choice | Behavior |
| --- | --- |
| **Use Aniraku app** | Opens the `aniraku://` app scheme through Android’s package-targeted intent for `aniraku.anime.app`. |
| **Get Android app** | Opens the current public GitHub APK release in a new browser context. |
| **Orion Store** | Opens the established Orion Store listing. |
| **Continue on web** | Closes the sheet and stores a local dismissal for 30 days. |

The sheet can also be closed with its explicit close button, the Escape key, or its backdrop. It never opens during an active authentication or legal-information flow, and it respects reduced-motion preferences.

## Package and distribution

The Android package is `aniraku.anime.app`; Android’s minimum supported version is 9 / API 28. A visitor moving from `aniraku.anine.app` receives the package-migration reminder from the app site and release notes rather than from this first-use fallback.
