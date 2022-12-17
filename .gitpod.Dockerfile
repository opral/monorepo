FROM gitpod/workspace-full

# install doppler
RUN brew install gnupg
RUN brew install dopplerhq/cli/doppler 

