# Android app updates

The public version endpoint is `GET /api/app-updates/android?currentVersionCode=<installed versionCode>`. The endpoint remains available without APK settings, but reports no actionable update until both an HTTPS APK URL and its SHA-256 checksum are configured.

For a release, build a signed APK with application ID `com.mavo.app`, a higher integer `versionCode`, and the same compatible signing key as the installed app. Upload it as a public **Raw** asset to the Cloudinary account already used by this backend, then use its HTTPS delivery URL. Generate the checksum with `Get-FileHash -Algorithm SHA256 .\app-release.apk`.

Set these Render environment variables for each release:

- `ANDROID_LATEST_VERSION` — displayed version name, such as `1.0.1`.
- `ANDROID_LATEST_VERSION_CODE` — positive integer matching the APK.
- `ANDROID_APK_DOWNLOAD_URL` — public HTTPS URL for the APK.
- `ANDROID_APK_SHA256` — 64-character hexadecimal SHA-256 checksum.
- `ANDROID_UPDATE_MANDATORY` — `true` or `false` (optional; defaults to `false`).
- `ANDROID_RELEASE_NOTES` — optional release notes.

If either the URL or checksum is missing, the endpoint deliberately suppresses the download details and does not advertise an update. No APK URL or hosting credentials are embedded in the application.
