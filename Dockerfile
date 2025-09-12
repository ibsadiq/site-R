# Stage 1: Base image with pnpm
FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set workdir inside the container
WORKDIR /app

# Copy package files first (better caching)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy rest of the app
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Default command (overridden in docker-compose)
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
