# student-management-nodeJS-

npm init -y
npm install express
npm i nodemon
npm i dotenv
npm install pg
npm install jsonwebtoken

app.js
1 express config
2 middleware
3 routes
4 error handler

server.js
1 server start

index.js
1 internal routing

Flow
server.js
↓
app.js
↓
index.js
↓
module routes
↓
controller
↓
service
↓
database

Semi-generic architecture

reusable utilities
reusable query builder
reusable pagination
reusable search/filter
BUT
separate services per module

Shared query utils folder (Search,Filter,Pagination)
MULTIPLE SEARCH + FILTER

imple table sorting and relational query sorting (array, object mapping)

DUAL COUNT SYSTEM for pagination. 1 FAST COUNT (Speed Priority) simple query, 2 ACCURATE COUNT (Correct result) search/filter JOIN table
