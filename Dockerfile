# Root Dockerfile for Hugging Face monorepo support
FROM node:22-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Create a non-root user for Hugging Face compliance
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy package files from the server directory
COPY --chown=user server/package*.json ./
COPY --chown=user server/prisma ./prisma/

# Install dependencies (only for the server)
RUN npm install

# Copy server application files
COPY --chown=user server/ .

# Generate Prisma client
RUN npx prisma generate

# Expose the port (Hugging Face default is 7860)
EXPOSE 7860

# Ensure the app uses port 7860
ENV PORT=7860

# Start the application
CMD ["npm", "start"]
