FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3306
CMD ["npm", "prepare"]
ENTRYPOINT ["node", "build/index.js"]
