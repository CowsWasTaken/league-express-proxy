FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3306
ENTRYPOINT ["node", "start"]
