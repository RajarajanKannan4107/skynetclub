FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY src/ ./src/

# Expose backend port
EXPOSE 5001

# Start server
CMD ["node", "src/server.js"]
