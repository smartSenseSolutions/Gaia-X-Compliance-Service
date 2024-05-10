FROM node:20-alpine as development-build-stage

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install rimraf
RUN npm ci
COPY . .
RUN BASE_URL=$BASE_URL npm run build

FROM node:20-alpine@sha256:2ffec31a58e85fbcd575c544a3584f6f4d128779e6b856153a04366b8dd01bb0 as production-build-stage

ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY . .
COPY --from=development-build-stage /usr/src/app/dist ./dist

FROM node:20-bookworm as production-stage

RUN useradd compliance
ENV NODE_ENV=production
WORKDIR /usr/app
COPY --chown=compliance --from=production-build-stage /usr/src/app/package.json package.json
COPY --chown=compliance --from=production-build-stage /usr/src/app/node_modules node_modules
COPY --chown=compliance --from=production-build-stage /usr/src/app/dist dist
COPY --chown=compliance --from=production-build-stage /usr/src/app/src/static src/static
USER compliance

CMD ["node", "dist/src/main"]
