# Stage 1: Dependencies
FROM node:22-alpine AS build-stage

WORKDIR /app

# Install bun globally
RUN npm install -g bun

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Explicitly disable telemetry during build to prevent network timeouts
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build:docker


# Stage 2: Runtime
FROM node:22-alpine AS build-stage

WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Explanation of environment variables:
# NODE_ENV=production - Enables production optimizations in Next.js
# NEXT_TELEMETRY_DISABLED=1 - Disables Next.js telemetry for cleaner logs and no unnecessary network calls
# PORT - Port for Next.js server to listen on
# HOSTNAME - Bind to all interfaces for container networking

RUN apk add --no-cache dumb-init

# Copy standalone output from build-stage
# Standalone output includes only production dependencies
COPY --from=build-stage /app/.next/standalone ./
COPY --from=build-stage /app/.next/static ./.next/static
COPY --from=build-stage /app/public ./public

# Copy entrypoint script and set permissions as root
COPY --from=build-stage /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh \
    && chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose application port
EXPOSE 8080 

CMD ["dumb-init", "sh", "-c", "./entrypoint.sh"]
