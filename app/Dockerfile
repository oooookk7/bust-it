FROM node:14.16.0-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock /app/
RUN yarn install

ENV PATH /app/node_modules/.bin:$PATH
ARG SERVER_PROTOCOL
ARG SERVER_HOSTNAME
ARG SERVER_PORT

COPY . /app
RUN yarn prod:build

FROM nginx:1.19.7-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template