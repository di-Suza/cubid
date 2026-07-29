FROM node:22-alpine AS base
WORKDIR /app

FROM base AS development
COPY package.json ./
COPY web/package.json ./web/package.json
RUN npm --prefix web install
COPY . .
WORKDIR /app/web
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS build
COPY package.json ./
COPY web/package.json ./web/package.json
RUN npm --prefix web install
COPY . .
RUN npm --prefix web run build

FROM node:22-alpine AS production
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/web/dist ./dist
CMD ["serve", "-s", "dist", "-l", "5173"]
