FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
# Use npm install instead of npm ci to handle lockfile version/platform differences
RUN npm install --omit=dev --ignore-scripts

FROM node:20-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

RUN mkdir -p uploads && chown -R node:node /usr/src/app

USER node

EXPOSE 4000

CMD ["npm", "start"]
