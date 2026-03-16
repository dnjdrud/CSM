# 셀라 (Cellah) Mobile App

Expo React Native app for the Cellah Korean Christian social network (cellah.co.kr).

Shares the same Supabase backend and web API routes as the Next.js web app.

## Setup

```bash
cd apps/mobile
npm install
```

Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:
- `EXPO_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon/public key
- `EXPO_PUBLIC_API_BASE_URL` — the web backend URL (https://cellah.co.kr in production, or your local tunnel URL for development)

Add asset images to `assets/` (see `assets/README.md`).

## Run

```bash
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with the Expo Go app.

## Auth Flow

1. User enters email on the login screen
2. App calls `POST /api/auth/mobile/request` on the web backend
3. Backend sends an email containing a deep link: `cellah://auth/verify?id=X&token=Y`
4. Tapping the link in the email opens the app (deep link scheme: `cellah://`)
5. The root layout catches the deep link and calls `POST /api/auth/mobile/verify`
6. Backend returns `{ access_token, refresh_token, expires_at }`
7. App calls `supabase.auth.setSession()` — user is now logged in

## Deep Link Scheme

The app uses the `cellah://` URI scheme, configured in `app.json` under `expo.scheme`.

For testing deep links locally:
```bash
# iOS Simulator
xcrun simctl openurl booted "cellah://auth/verify?id=test&token=test"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "cellah://auth/verify?id=test&token=test"
```

## Project Structure

```
apps/mobile/
  app/
    _layout.tsx          # Root layout: auth state, deep link handler
    (auth)/
      _layout.tsx
      login.tsx          # Magic link login screen
    (app)/
      _layout.tsx        # Tab navigator (피드, 글쓰기, 알림, 설정)
      feed/
        index.tsx        # Feed screen
        [id].tsx         # Post detail + comments
      write.tsx          # Write post screen
      notifications.tsx  # Notifications screen
      settings.tsx       # Settings / profile screen
      profile/
        [id].tsx         # User profile screen
  components/
    PostCard.tsx
    UserAvatar.tsx
  lib/
    supabase.ts          # Supabase client (SecureStore persistence)
    api.ts               # Web backend API calls
    types.ts             # Shared domain types
```
