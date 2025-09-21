FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src
COPY public ./public

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node","src/server.js"]
