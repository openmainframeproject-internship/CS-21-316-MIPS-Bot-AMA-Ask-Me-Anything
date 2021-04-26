# syntax=docker/dockerfile:1

FROM node:15-alpine

RUN mkdir -p /src/app

WORKDIR /src/app

COPY ["package.json", "package-lock.json*", "./"]

COPY . .

RUN npm install

EXPOSE 3000

CMD [ "node", "server.js" ]
