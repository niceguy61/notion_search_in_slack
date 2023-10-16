FROM node:20.8-alpine3.18

WORKDIR /app

COPY package.json .

RUN npm i

COPY . .

EXPOSE 3000

CMD ["node","index.js"]