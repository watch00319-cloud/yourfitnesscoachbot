FROM node:20-bullseye-slim

WORKDIR /app

# Copy and install Node packages
COPY package*.json ./
RUN npm install

# Copy bot code
COPY . .

# Run bot
CMD ["node", "whatsapp.js"]
