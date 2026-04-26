rm ./dist -r
npm run build:prod
rm -R ../w3booster-master/dist/app/public/client
cp ./dist/browser ../w3booster-master/dist/app/public/client -r
