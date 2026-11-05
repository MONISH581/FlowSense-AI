# Stage 1: Build the React 19 Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Unified Python Backend + Static Frontend Host
FROM python:3.13-slim
WORKDIR /app

# Install system build dependencies for C-extensions (PM4Py, SciPy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Create persistent storage directories
RUN mkdir -p /app/data /app/backend/saved_models

# Copy compiled frontend assets from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PORT=8000
ENV FRONTEND_DIST=/app/frontend/dist
ENV DATABASE_URL=sqlite:///./flowsense.db
ENV MODEL_DIR=/app/backend/saved_models

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

CMD ["sh", "-c", "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
