# Use a small Node.js image as the base
FROM node:slim

# Set the timezone to UTC+8 (Asia/Shanghai)
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Set the working directory to /app
WORKDIR /app

# Copy all files to the container
COPY . .

# Install dependencies
RUN npm install

# Expose the port that the app will run on
EXPOSE 80

# Start the app using the start script from package.json
CMD ["npm", "start"]
