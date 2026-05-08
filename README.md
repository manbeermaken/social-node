# social-node

## Development
```sh
git clone https://github.com/manbeermaken/social-node.git
cd social-node/
cp .env.example .env
npm install
npm run dev
```

## Docker
```sh
docker run -d --name social-node --env-file .env -p 8000:8000 ghcr.io/manbeermaken/social-node:latest

# docker compose
docker compose up -d
```