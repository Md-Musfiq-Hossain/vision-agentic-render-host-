FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_FASTAPI_URL=http://localhost:8001
ARG VITE_DJANGO_URL=http://localhost:8000

ENV VITE_FASTAPI_URL=$VITE_FASTAPI_URL
ENV VITE_DJANGO_URL=$VITE_DJANGO_URL

COPY package*.json ./
RUN npm install

COPY . .

ENV NITRO_PRESET=node-server
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "./.output/server/index.mjs"]