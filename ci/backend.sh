#!/bin/sh
# Run from the repository root. Every platform calls this same file.
set -eu
cd backend
echo 'BACKEND 1/5: clean dependency installation'
npm ci --no-audit --no-fund
echo 'BACKEND 2/5: wait for the isolated test database'
node ../ci/wait-for-mongo.cjs
echo 'BACKEND 3/5: TypeScript checks'
npm run typecheck
echo 'BACKEND 4/5: unit, mock, and real database integration tests'
npm run test:ci
echo 'BACKEND 5/5: compile application JavaScript'
npm run build
