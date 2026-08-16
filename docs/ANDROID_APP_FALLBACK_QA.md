# Android App Fallback QA

## Local Android viewport check

The initial Android 15, 412 × 915 viewport capture rendered the main site shell before the fallback’s intentional 850 ms mount delay. A delayed headless render also revealed that Chromium reports no touch points despite an Android mobile user agent. Compatibility detection therefore accepts the mobile Android user-agent signal after excluding TV and automated environments. The final check must wait beyond the mount delay and confirm the sheet, its open-app action, APK route, Orion Store route, dismissal control, and mobile bottom-nav layering.
