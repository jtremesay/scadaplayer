FROM node as build
WORKDIR /code
COPY package.json package-lock.json ./
RUN npm install
COPY tsconfig.json ./
COPY index.html ./
COPY src/ src/
RUN npm run build

FROM nginx
COPY --from=build /code/dist/ /usr/share/nginx/html/
EXPOSE 8000