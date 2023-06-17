FROM node:alpine

COPY . /apps/hp

WORKDIR /apps/hp

RUN npm install

ENV LCL_DB_HOST=${LCL_DB_HOST}
ENV LCL_DB_PORT=${LCL_DB_PORT}
ENV LCL_DB_USER=${LCL_DB_USER}
ENV LCL_DB_PASS=${LCL_DB_PASS}

CMD ["npm" , "start"]