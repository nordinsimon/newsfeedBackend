FROM node:14 as base
WORKDIR /usr/code
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]