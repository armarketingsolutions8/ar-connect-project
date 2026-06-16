FROM ghcr.io/puppeteer/puppeteer:24.43.1

USER root

RUN apt-get update && apt-get install -y \
    libgbm-dev \
    libasound2 \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]