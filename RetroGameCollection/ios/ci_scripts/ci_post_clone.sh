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

echo "✓ ci_post_clone done"
