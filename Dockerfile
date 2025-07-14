# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app
COPY . .

# Expose port (default: 5000 or your chosen port)
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
