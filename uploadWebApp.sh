# 使用 node 来 serve web页面
cd ./web
npm run build
cp -r ./web/build ./server/public
export PUBLIC_URL=/bible-robot
npm run build
cd ../
rm -rf docs
cp -r ./web/build/ ./docs
# 提交 git
git add ./server/public
git add ./docs
git commit -m 'release-web-app'
git push origin