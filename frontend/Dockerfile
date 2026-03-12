FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build for web
RUN npx expo export -p web

# Install serve to run the static files
RUN npm install -g serve

# Serve the build folder (dist is default for newer Expo, check if web-build is created instead if this fails)
# Serve the build folder (dist or web-build)
CMD ["sh", "-c", "if [ -d 'dist' ]; then serve -s dist -l 3000; else serve -s web-build -l 3000; fi"]
