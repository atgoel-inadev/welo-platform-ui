# Multi-stage build for Welo Platform UI
# Stage 1: Build the React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build-time env vars — point to nginx gateway on host port 8080
# These get baked into the JS bundle at build time
ARG VITE_AUTH_SERVICE_URL=http://localhost:8080/auth/api/v1
ARG VITE_TASK_MANAGEMENT_URL=http://localhost:8080/tasks/api/v1
ARG VITE_PROJECT_MANAGEMENT_URL=http://localhost:8080/projects/api/v1
ARG VITE_WORKFLOW_ENGINE_URL=http://localhost:8080/workflows/api/v1
ARG VITE_ANNOTATION_QA_URL=http://localhost:8080/annotation-qa/api/v1
ARG VITE_API_URL=http://localhost:8080/projects/api/v1

# Build
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location /assets {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
