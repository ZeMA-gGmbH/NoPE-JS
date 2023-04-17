FROM node:latest

RUN mkdir /nope
COPY . /nope/

# Create a Volume containg the configuration
WORKDIR /nope

# Install Binaries
RUN npm install

# Execute the Kernel
CMD ["node","./dist/lib/cli/runNopeBackend.js", "-c","io-server","-l","info","-f","./config/settings_wamo_ips.json"]
