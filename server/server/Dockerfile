FROM node:18

WORKDIR /home/server

COPY ./ /home/server/
RUN npm install -g typescript
RUN npm install
RUN npm run build
RUN mv ./node_modules ../build
RUN mv ./templates ../build
RUN mv ./public ../build

CMD npm run start
