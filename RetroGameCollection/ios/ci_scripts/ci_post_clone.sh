#!/bin/sh
set -e

# Xcode Cloud post-clone hook for a React Native + CocoaPods project.
# Runs after the repo is cloned, before xcodebuild. Installs node, JS deps,
# and the Pods so the Xcode workspace can build.

echo "→ Installing node + cocoapods via brew"
brew install node
brew install cocoapods

echo "→ Installing JS dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH/RetroGameCollection"
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
