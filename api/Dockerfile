FROM node:10.19.0

COPY . /app
WORKDIR /app

RUN yarn install
RUN yarn build

CMD [ "yarn", "start" ]