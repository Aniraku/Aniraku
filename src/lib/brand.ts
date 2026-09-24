// ---------------------------------------------------------------------------
// Brand logo — SINGLE swap point for every <img> logo on the site
// (Navbar, SideMenu header, SideMenu profile fallback).
//
// The user's designated custom-logo drop path is src/assets/aniraku_logo.png —
// the custom logo HAS LANDED (portrait artwork, rounded-square corners keyed
// to true alpha during conversion). This file imports it for real:
//   import anirakuLogo from '../assets/aniraku_logo.png';
//   export const BRAND_LOGO = anirakuLogo;
// (The footer mask logo is the CSS-side twin: `.app-icon` in
// src/components/global-chrome.css masks with the bundled logo via a relative
// url() so Vite rewrites it to the hashed asset URL.)
// ---------------------------------------------------------------------------

import anirakuLogo from '../assets/aniraku_logo.png';

/** User's custom logo — bundled import (hashed asset URL in the build). */
export const BRAND_LOGO = anirakuLogo;
