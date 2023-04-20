########################################################################################################################
# Base
########################################################################################################################
FROM alpine:3 AS base
LABEL \
  fr.achl.delacy.description="A spiritual successor to AceBot." \
  fr.achl.delacy.license="AGPL-3.0-or-later" \
  fr.achl.delacy.maintainer="Jarrett Aiken <jarrett.aiken@achl.fr> (https://achl.fr)" \
  fr.achl.delacy.source="https://github.com/Aceheliflyer/DeLacy.git" \
  fr.achl.delacy.version="1.0.0"

ARG _USER="delacy"
ARG _WORKDIR="/home/${_USER}/bot"

RUN \
  echo "@edge https://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories \
  && apk add --no-cache nodejs-current@edge=20.0.0-r0 \
  && corepack enable \
  && corepack prepare pnpm@latest --activate \
  && adduser -D ${_USER} ${_USER}

RUN mkdir ${_WORKDIR}
WORKDIR ${_WORKDIR}

########################################################################################################################
# Development
########################################################################################################################
FROM base AS dev

COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY LICENSE.txt package.json README.md tsconfig.json ./
COPY src src
RUN \
  pnpm i --offline \
  && pnpm run build:prod  \
  && tar -cf archive.tar dist LICENSE.txt package.json README.md

########################################################################################################################
# Production
########################################################################################################################
FROM base AS prod

COPY --from=dev --chown=root:${_USER} ${_WORKDIR}/pnpm-lock.yaml ./
RUN pnpm fetch --prod

COPY --from=dev ${_WORKDIR}/archive.tar ./
RUN \
  tar -xof archive.tar && rm archive.tar \
  && pnpm i --offline --prod

USER ${_USER}
ENTRYPOINT ["pnpm", "run"]
CMD ["start"]
