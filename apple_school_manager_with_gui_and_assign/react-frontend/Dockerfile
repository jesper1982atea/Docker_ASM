# # ---------- Byggfas ----------
# FROM node:18 AS build

# WORKDIR /app

# # Installera beroenden
# COPY package.json package-lock.json ./
# RUN npm install

# # Kopiera källkod och bygg appen
# COPY . .
# RUN npm run build


# # ---------- Produktionsserver ----------
# FROM nginx:alpine

# # Ta bort default-konfig och html
# RUN rm -rf /usr/share/nginx/html/*

# # Kopiera byggd React-app från build-steget
# COPY --from=build /app/dist /usr/share/nginx/html

# # Anpassad nginx.conf med fallback för client-side routing
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Exponera port 80
# EXPOSE 80

# # Default CMD från nginx används

# Build stage
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80