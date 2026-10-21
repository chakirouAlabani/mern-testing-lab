FROM node:22-bookworm

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Only the container uses this proxy; local npm start keeps localhost:5000.
RUN node -e "const fs = require('fs'); const p = require('./package.json'); p.proxy = 'http://backend:5000'; fs.writeFileSync('package.json', JSON.stringify(p, null, 2));"

EXPOSE 3000
CMD ["npm", "start"]
