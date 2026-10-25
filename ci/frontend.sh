#!/bin/sh
set -eu
cd frontend
echo 'FRONTEND 1/4: clean dependency installation'
npm ci --no-audit --no-fund
echo 'FRONTEND 2/4: TypeScript checks'
npm run typecheck
echo 'FRONTEND 3/4: component and API client tests'
npm run test:ci
echo 'FRONTEND 4/4: production build'
npm run build
