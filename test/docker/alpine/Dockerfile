FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache wget
RUN wget https://github.com/Sultepronit/du-tree/releases/download/v0.2.0/du-tree
RUN chmod +x ./du-tree

EXPOSE 51202

CMD ["./du-tree", "-p", "51202"]