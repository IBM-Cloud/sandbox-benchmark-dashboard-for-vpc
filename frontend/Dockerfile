# Stage 1: Build the React app
FROM node:20.8.1 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install 
COPY . .
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# Stage 2: Create the production image
FROM nginx:latest
COPY --from=builder /app/build /usr/share/nginx/html
RUN chmod -R 777 /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
