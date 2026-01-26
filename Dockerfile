# Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# RUN npm run build # Skipping build for now to allow dev in container if needed, but normally we build

# Production Stage
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 3000
CMD ["npm", "run", "dev"]
