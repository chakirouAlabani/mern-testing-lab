FROM node:22-bookworm
WORKDIR /release/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY backend/dist ./dist
WORKDIR /release
COPY frontend/build ./frontend/build
COPY ci/runtime.cjs ./ci/runtime.cjs
COPY REVISION ./REVISION
EXPOSE 3000
CMD ["node", "ci/runtime.cjs"]
