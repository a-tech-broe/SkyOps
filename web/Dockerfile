# -------- BUILD STAGE --------
    FROM node:22-alpine AS builder

    WORKDIR /app
    
    RUN apk update && apk upgrade --no-cache
    
    COPY package*.json ./
    RUN npm ci
    
    COPY . .
    
    ARG VITE_API_URL
    ENV VITE_API_URL=${VITE_API_URL}
    
    RUN npm run build
    
    
    # -------- PRODUCTION STAGE --------
    FROM nginx:1.27.10-alpine3.21
    
    RUN apk update && apk upgrade --no-cache \
        && apk add --no-cache libcrypto3 libssl3 libxml2
    
    COPY --from=builder /app/dist /usr/share/nginx/html
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]