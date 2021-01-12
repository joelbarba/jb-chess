#!/bin/bash

echo "Internal copy from 'jb-ui-lib' to ----> ./node_modules"
here=`pwd`
cd /home/barba/DEV/jb-ui-lib
npm run pack_all
cd ${here}
rm -rf ./node_modules/jb-ui-lib
cp -rf /home/barba/DEV/jb-ui-lib/dist/jb-ui-lib ./node_modules/jb-ui-lib
