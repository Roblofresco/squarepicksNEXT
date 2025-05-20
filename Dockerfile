# Dockerfile for Next.js App on Cloud Run

# ---- Base Stage ----
# Use an official Node.js runtime as a parent image. Choose a version compatible with your project.
# Using LTS (Long Term Support) version is generally recommended. Check your package.json "engines" field if specified.
FROM node:20-slim AS base

# Set the working directory in the container
WORKDIR /app

# Install OS dependencies needed for Next.js builds (e.g., python, make, g++ for node-gyp)
# You might need fewer or more depending on your specific project dependencies.
# Using --no-install-recommends reduces image size.
RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 && rm -rf /var/lib/apt/lists/*

# Copy package.json and lock file
COPY package.json package-lock.json* ./

# ---- Dependencies Stage ----
# Install dependencies using npm ci for faster, reproducible builds
FROM base AS deps
RUN npm ci

# ---- Builder Stage ----
# Build the Next.js application
FROM base AS builder
# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .
# Build the application
# Set NEXT_TELEMETRY_DISABLED=1 to disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runner Stage ----
# Final, smaller image for running the application
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install necessary runtime packages (if any, usually minimal for Node.js)
# RUN apt-get update && apt-get install -y --no-install-recommends some-runtime-package && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary artifacts from the builder stage
COPY --from=builder /app/public ./public
# Copy standalone output (recommended for optimized Cloud Run deployment)
# This includes only necessary files for running the built app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Change ownership of the working directory
# RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on (Next.js default is 3000)
EXPOSE 3000

# Define the command to run the application
# Using the standalone output server.js
CMD ["node", "server.js"]