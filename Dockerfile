FROM node:12-alpine

WORKDIR /usr/src/app
RUN apk add git
COPY package*.json /usr/src/app/
RUN yarn

COPY . /usr/src/app

EXPOSE 3000
CMD yarn start
