FROM node:14-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3002

CMD [ "node", "coursesdb-app.js" ]
