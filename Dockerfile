FROM node:23-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations

EXPOSE 3001

CMD ["npm", "start"]
