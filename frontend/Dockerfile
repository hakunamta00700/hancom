FROM node:20-alpine

WORKDIR /app

# lock 파일이 없어서 npm install 사용
COPY package.json /app/package.json
RUN npm install

COPY . /app

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
