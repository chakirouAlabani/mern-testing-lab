#!/bin/sh
set -eu
test -f backend/dist/server.js
test -f frontend/build/index.html
mkdir -p release/backend release/frontend release/ci
cp -R backend/dist release/backend/
cp backend/package.json backend/package-lock.json release/backend/
cp -R frontend/build release/frontend/
cp ci/runtime.cjs release/ci/
cp ci/Runtime.Dockerfile release/Dockerfile
printf '%s\n' "${BUILD_REVISION:?BUILD_REVISION must identify the tested source}" > release/REVISION
echo 'Release candidate assembled. This does not deploy anything.'
