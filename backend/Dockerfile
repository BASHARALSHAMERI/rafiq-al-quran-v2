FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy Prisma schema before npm ci because postinstall runs prisma generate
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Generate client explicitly for the build layer
RUN npx prisma generate

# Copy source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
