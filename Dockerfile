# Dockerfile
FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose the port your app runs on
EXPOSE 10000

# Start the app
CMD [ "node", "app.js" ]
