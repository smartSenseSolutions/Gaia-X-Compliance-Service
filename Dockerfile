FROM node:20-alpine AS development-build-stage

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install glob rimraf

RUN npm install --only=development

COPY . .

RUN BASE_URL=$BASE_URL npm run build
FROM node:20-alpine@sha256:2ffec31a58e85fbcd575c544a3584f6f4d128779e6b856153a04366b8dd01bb0 AS production-build-stage

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

COPY --from=development-build-stage /usr/src/app/dist ./dist

CMD ["node", "dist/src/main"]
