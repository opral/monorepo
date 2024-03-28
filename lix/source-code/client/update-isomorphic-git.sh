# this script expects the isomorphic git repo location to b next to the mono repp:
# at ../../../../isomorphic-git/

isomorphic_git_dir="../../../../isomorphic-git/"
commit_hash=$(git --git-dir="$isomorphic_git_dir".git rev-parse HEAD)


tar -C './vendored/' -xvf '../../../../isomorphic-git/isomorphic-git-0.0.0-development.tgz' package/* 
rm -rf './vendored/isomorphic-git'
mv ./vendored/package ./vendored/isomorphic-git

node -e "const fs = require('fs'); const packageJson = require('./vendored/isomorphic-git/package.json'); packageJson.version = '$commit_hash'; fs.writeFileSync('./vendored/isomorphic-git/package.json', JSON.stringify(packageJson, null, 2));"