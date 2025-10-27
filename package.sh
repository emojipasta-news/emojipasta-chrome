#!/bin/bash

# package.sh - Create distribution ZIP for Chrome Web Store

VERSION=$(cat manifest.json | grep version | cut -d'"' -f4)
PACKAGE_NAME="emojipasta-generator-v${VERSION}.zip"

echo "Creating package: $PACKAGE_NAME"

# Remove old package if exists
rm -f *.zip

# Create ZIP with only necessary files
zip -r "$PACKAGE_NAME" \
  manifest.json \
  popup.html \
  popup.css \
  popup.js \
  background.js \
  content.js \
  content.css \
  icons/ \
  -x "*.DS_Store" "*.git*"

echo "Package created: $PACKAGE_NAME"
echo "Ready for Chrome Web Store upload!"
