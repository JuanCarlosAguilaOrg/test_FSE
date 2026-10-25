FROM node:20-bookworm-slim
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm install
COPY apps/web apps/web
WORKDIR /repo/apps/web
EXPOSE 5173
CMD ["npm", "run", "dev"]
