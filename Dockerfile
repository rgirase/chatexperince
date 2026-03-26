# Use Node.js for building
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Use Nginx to serve the static files
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Default Nginx port
EXPOSE 80

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]
