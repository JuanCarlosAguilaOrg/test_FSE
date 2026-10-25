FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm install
COPY prisma prisma
COPY apps/api apps/api
RUN npm run db:generate -w apps/api
WORKDIR /repo/apps/api
EXPOSE 3000
CMD ["npm", "run", "dev"]
