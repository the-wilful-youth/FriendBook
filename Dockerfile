FROM node:18-alpine
WORKDIR /app
COPY web/package*.json ./
RUN npm install --production
COPY web/ ./
EXPOSE 3000
CMD ["npm", "start"]
