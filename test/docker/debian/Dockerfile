FROM debian:latest

WORKDIR /app

RUN apt-get update && apt-get install -y wget
RUN wget https://github.com/Sultepronit/du-tree/releases/download/v0.1.0/du-tree
RUN chmod +x ./du-tree

EXPOSE 51204
CMD ["./du-tree", "-p", "51204"]

