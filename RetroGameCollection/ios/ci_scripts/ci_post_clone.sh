#!/bin/sh
set -e

# Xcode Cloud post-clone hook for a React Native + CocoaPods project.
# Runs after the repo is cloned, before xcodebuild. Installs node, JS deps,
# the Pods, and generates src/config.ts from environment variables so the
# Metro bundle phase can resolve imports.

echo "→ Installing node + cocoapods via brew"
brew install node
brew install cocoapods

echo "→ Generating src/config.ts from Xcode Cloud environment variables"
cd "$CI_PRIMARY_REPOSITORY_PATH/RetroGameCollection"

# Fail loudly if any required var is missing — the app won't function without them.
: "${SUPABASE_URL:?missing}"
: "${SUPABASE_ANON_KEY:?missing}"
: "${POSTHOG_API_KEY:?missing}"
: "${POSTHOG_HOST:?missing}"
: "${RC_API_KEY_IOS:?missing}"
: "${RC_API_KEY_ANDROID:?missing}"
: "${ADMOB_BANNER_IOS:?missing}"
: "${ADMOB_BANNER_ANDROID:?missing}"

cat > src/config.ts <<EOF
export const SUPABASE_URL = '${SUPABASE_URL}';
export const SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';

export const POSTHOG_API_KEY = '${POSTHOG_API_KEY}';
export const POSTHOG_HOST = '${POSTHOG_HOST}';

export const RC_API_KEY_IOS = '${RC_API_KEY_IOS}';
export const RC_API_KEY_ANDROID = '${RC_API_KEY_ANDROID}';

export const ADMOB_BANNER_IOS = '${ADMOB_BANNER_IOS}';
export const ADMOB_BANNER_ANDROID = '${ADMOB_BANNER_ANDROID}';
EOF

echo "→ Installing JS dependencies"
npm install

echo "→ Installing CocoaPods"
cd ios
pod install

echo "→ Writing .xcode.env.local with NODE_BINARY path"
# Xcode build phases (e.g. "Bundle React Native code and images") run in a
# shell that doesn't have /opt/homebrew/bin in PATH, so `command -v node`
# fails. .xcode.env.local is sourced by Xcode before each phase script.
echo "export NODE_BINARY=$(command -v node)" > .xcode.env.local

echo "✓ ci_post_clone done"
