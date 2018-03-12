FROM node:9.8.0-alpine

WORKDIR /src

# Build packages
ADD package*.json ./
RUN npm i

# Add all the other files
ADD . .