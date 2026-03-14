FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ARG VITE_API_URL=http://localhost:8000
ARG VITE_PARENT_BOT_USERNAME=davomad_parent_bot
ARG VITE_MANAGEMENT_BOT_USERNAME=davomad_management_bot
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PARENT_BOT_USERNAME=$VITE_PARENT_BOT_USERNAME
ENV VITE_MANAGEMENT_BOT_USERNAME=$VITE_MANAGEMENT_BOT_USERNAME
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
