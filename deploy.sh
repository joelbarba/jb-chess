#!/usr/bin/env bash

export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;
nvm use

echo "Deploying the Site to https://jb-chess.netlify.app/"
echo ""
ng build
echo "------------------------------------------------------"
echo "New dist generated"
rm -rf ../Netlify/jbChessPublic/*
mv ./dist/jbChess/* ../Netlify/jbChessPublic/
cd ../Netlify/jbChessPublic
git add -A
echo "------------------------------------------------------"
git log -1
echo "New version staged on /Netlify/jbChessPublic"
echo "What version?"
read x
git commit -m $x
git push
cd ../../JB-CHESS

echo ""
echo "App successfully deployed on: https://jb-chess.netlify.app/"
