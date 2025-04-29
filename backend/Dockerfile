FROM golang:1.24.1

WORKDIR /usr/local/go/app
COPY . .
RUN go mod download
RUN go get -d -v ./...
RUN go build -o sandbox
EXPOSE 8080

CMD [ "/usr/local/go/app/sandbox" ]
