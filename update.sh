#!/bin/bash
cd /home/admin/depth
git pull origin dd
npm i
npm run prod
pm2 restart dd
exit
