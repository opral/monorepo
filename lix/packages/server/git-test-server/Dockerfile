FROM nginx
RUN apt-get update && apt-get install -y git fcgiwrap sudo htop

RUN mkdir /home/git && mkdir /home/git/opral && mkdir /home/git/janfjohannes
RUN cd /home/git/opral && git clone --bare https://github.com/opral/example.git
RUN cd /home/git/opral && git clone --bare https://github.com/opral/ci-test-repo.git
RUN cd /home/git/janfjohannes && git clone --bare https://github.com/janfjohannes/cal.com.git
RUN cd /home/git/opral && git clone --bare http://github.com/opral/isomorphic-git.git


RUN echo '[http]  \n receivepack = true \n' >> /home/git/janfjohannes/cal.com.git/config
RUN echo '[http]  \n receivepack = true \n' >> /home/git/opral/example.git/config
RUN echo '[http]  \n receivepack = true \n' >> /home/git/opral/ci-test-repo.git/config
RUN echo '[http]  \n receivepack = true \n' >> /home/git/opral/isomorphic-git.git/config

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./start.sh /start.sh
