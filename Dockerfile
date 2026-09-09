# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Vite substitutes public browser variables while building. Deliberate markers
# keep the image reusable; the runner replaces them from the container's runtime
# environment before starting the application.
ARG VITE_SUPABASE_URL=https://runtime-supabase-config.invalid
ARG VITE_SUPABASE_PUBLISHABLE_KEY=__AGHANIMS_SUPABASE_PUBLISHABLE_KEY__
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}

# Install dependencies
COPY package*.json ./
RUN npm install --force

# Copy application source code
COPY . .

# Build TanStack Start production server
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9999
ENV HOST=0.0.0.0

# Copy necessary production build outputs and package files
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts/inject-public-env.mjs ./scripts/inject-public-env.mjs

EXPOSE 9999

# Inject browser-safe public configuration, then run the standalone server.
CMD ["sh", "-c", "node ./scripts/inject-public-env.mjs && exec node .output/server/index.mjs"]
