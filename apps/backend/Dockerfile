FROM node:18

WORKDIR /app

COPY . .

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN pnpm install

CMD ["pnpm", "start:dev"]
