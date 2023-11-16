# Use the Node.js LTS image as a base
FROM node:lts

# Copy app source
COPY . /src

# Set working directory to /src
WORKDIR /src



# Install app dependencies
RUN npm install

# COPY startup.sh /startup.sh

# RUN chmod +x /startup.sh

# Expose port to outside world
EXPOSE 3000




# Command to execute when the container starts
# CMD ["/startup.sh"]
CMD ["sh", "-c", "node s3.js && npm start"]