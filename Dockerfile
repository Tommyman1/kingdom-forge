FROM node:22-alpine AS dependencies
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
RUN apk add --no-cache bash curl coreutils
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN chmod +x /app/scripts/*.sh
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libstdc++
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server ./server
EXPOSE 3000
RUN mkdir -p /app/.wrangler /data
VOLUME ["/data"]
CMD ["npm", "run", "start"]
