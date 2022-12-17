FROM gitpod/workspace-full

# install doppler
RUN brew install gnupg
RUN brew install dopplerhq/cli/doppler 
RUN echo $DOPPLER_DEVELOPMENT_SERVICE_KEY | doppler configure set token
