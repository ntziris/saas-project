# Use the official Node.js image as a parent image
FROM node:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY src/ .

# Make port 3005 available outside the container
EXPOSE 3005

# Define the command to run the app
CMD ["node", "--trace-warnings", "server.js"]