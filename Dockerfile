FROM node:14-alpine

WORKDIR /app

COPY package.json .

RUN npm install

# if you want to use nodemon as the CMD, needs to be installed
RUN npm i -g nodemon

COPY . .

EXPOSE 3002

# use node for "production" and nodemon for "development"
# CMD [ "node", "coursesdb-app.js" ]
CMD [ "nodemon", "coursesdb-app.js" ]
