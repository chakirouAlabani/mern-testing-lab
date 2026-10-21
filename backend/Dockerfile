FROM node:22-bookworm

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 5000
CMD ["npm", "start", "--", "--legacy-watch"]
