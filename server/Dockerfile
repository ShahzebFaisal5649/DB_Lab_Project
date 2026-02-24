# server/Dockerfile
FROM node:22-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Create a non-root user for Hugging Face compliance
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy package files and change ownership
COPY --chown=user package*.json ./
COPY --chown=user prisma ./prisma/

# Install dependencies
RUN npm install

# Copy application files and change ownership
COPY --chown=user . .

# Generate Prisma client
RUN npx prisma generate

# Expose the port (Hugging Face default is 7860)
EXPOSE 7860

# Ensure the app uses port 7860
ENV PORT=7860

# Start the application
CMD ["npm", "start"]
