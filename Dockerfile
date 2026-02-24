# Root Dockerfile for Hugging Face monorepo support
FROM node:22

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Use the existing 'node' user (UID 1000) for Hugging Face compliance
# instead of creating a new one, as node:22 already has it.
USER node
WORKDIR /home/node/app

# Copy package files from the server directory
COPY --chown=node:node server/package*.json ./
COPY --chown=node:node server/prisma ./prisma/

# Install dependencies (only for the server)
RUN npm install

# Copy server application files
COPY --chown=node:node server/ .

# Generate Prisma client
RUN npx prisma generate

# Expose the port (Hugging Face default is 7860)
EXPOSE 7860

# Ensure the app uses port 7860
ENV PORT=7860

# Start the application
CMD ["node", "server.js"]
