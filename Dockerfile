FROM node:23-alpine

ARG SERVICE=api-service
ENV SERVICE=${SERVICE}

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY proto ./proto

EXPOSE 3001
EXPOSE 50051

CMD ["sh", "-c", "npx tsx src/${SERVICE}/index.ts"]
