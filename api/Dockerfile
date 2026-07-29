FROM node:22-alpine AS base
WORKDIR /app

FROM base AS development
COPY package.json ./
COPY api/package.json ./api/package.json
RUN npm --prefix api install
COPY . .
WORKDIR /app/api
CMD ["npm", "run", "dev"]

FROM base AS build
COPY package.json ./
COPY api/package.json ./api/package.json
RUN npm --prefix api install
COPY . .
RUN npm --prefix api run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY api/package.json ./api/package.json
RUN npm --prefix api install --omit=dev
COPY --from=build /app/api/dist ./api/dist
WORKDIR /app/api
CMD ["npm", "run", "start"]
