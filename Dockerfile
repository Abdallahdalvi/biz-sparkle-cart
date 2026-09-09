# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Vite substitutes these public browser values while building. They are public
# project identifiers (not the server service-role secret) and may be overridden
# with Docker build arguments when the Supabase project changes.
ARG VITE_SUPABASE_URL=https://supabase.dalvi.cloud
ARG VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwNTE2MDU5LCJleHAiOjQxMDI0NDQ4MDB9.pnle16TS5HXFkORp9nrU5GMbTU3BaNf8XzLfguweAUg
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

EXPOSE 9999

# Run the standalone TanStack Start server
CMD ["node", ".output/server/index.mjs"]
