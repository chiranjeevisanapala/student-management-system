# ==============================================================================
# Multi-stage Dockerfile for Loco.rs Rust Backend
# ==============================================================================
# Build Stage
FROM rust:1.80-slim-bookworm AS builder

WORKDIR /usr/src/app

# Install build prerequisites for compiling C dependencies and PostgreSQL support
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    libpq-dev \
    gcc \
    libc6-dev \
    make \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests
COPY Cargo.toml Cargo.lock* ./
COPY migration/Cargo.toml ./migration/

# Copy full source tree
COPY . .

# Build release binary
RUN cargo build --release --bin backend-cli

# ==============================================================================
# Production Runtime Stage
# ==============================================================================
FROM debian:bookworm-slim AS runner

WORKDIR /app

# Install runtime libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 \
    libpq5 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -s /bin/sh -m appuser

# Copy built binary from builder
COPY --from=builder /usr/src/app/target/release/backend-cli /usr/local/bin/backend-cli

# Copy configuration and migration assets
COPY config ./config
COPY migration ./migration

# Set ownership
RUN chown -R appuser:appuser /app

USER appuser

# Expose Loco HTTP port
EXPOSE 5150

ENV LOCO_ENV=production
ENV RUST_LOG=info

# Default command: run migrations and start server
CMD ["sh", "-c", "backend-cli db migrate && backend-cli start"]
