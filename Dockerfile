########################################################################################################################
# Base
########################################################################################################################
FROM alpine:latest AS base
LABEL maintainer="jarrett.aiken@achl.fr"

ARG _USER="delacy"
ARG BOT_DIR="/home/${_USER}/bot"

RUN \
  apk -U upgrade --no-cache \
  && apk add --no-cache nodejs-current \
  && wget -qO- https://get.pnpm.io/v6.16.js | node - add -g pnpm \
  && adduser -D ${_USER} ${_USER}

USER ${_USER}
RUN mkdir ${BOT_DIR}
WORKDIR ${BOT_DIR}

########################################################################################################################
# Development
########################################################################################################################
FROM base AS dev

COPY --chown=${_USER}:${_USER} pnpm-lock.yaml ./
RUN pnpm fetch

COPY --chown=${_USER}:${_USER} LICENSE.txt package.json README.md tsconfig.json ./
COPY --chown=${_USER}:${_USER} src src
RUN \
  pnpm i --offline \
  && pnpm run build:prod  \
  && tar -cf archive.tar dist LICENSE.txt package.json README.md

########################################################################################################################
# Production
########################################################################################################################
FROM base AS prod

COPY --from=dev --chown=${_USER}:${_USER} ${BOT_DIR}/pnpm-lock.yaml ./
RUN pnpm fetch --prod

COPY --from=dev --chown=${_USER}:${_USER} ${BOT_DIR}/archive.tar ./
RUN \
  tar -xf archive.tar && rm archive.tar \
  && pnpm i --offline --prod

CMD ["pnpm", "run", "start"]
