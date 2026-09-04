# Base image — Node.js versi 20 (LTS)
FROM node:20-alpine

# Working directory di dalam container
WORKDIR /app

# Copy package.json dulu (biar Docker bisa cache layer install kalau kode berubah tapi dependencies tidak)
COPY package*.json ./

# Install dependencies (production only, lebih ringan)
RUN npm install --production

# Copy semua source code
COPY . .

# Expose port yang dipakai app (samakan dengan PORT di .env / app.js)
EXPOSE 5000

# Command untuk start container
CMD ["npm", "start"]