# DEV
Fråga Oscar eller Simon om .env fil och klona ner repot gren main. Sen följ dessa steg för att starta servern: 
1. Ställ dig i repot
2. Kör "npm i"
3. Kör "docker-compose build" - bygg docker containers
4. Kör "docker-compose up -d" - starta docker containers
5. Kör "docker-compose down" - för att stänga containers
6. För att skapa en user och admin användare samt rollerna som hör till så kör ett GET anrop emot: http://localhost:3000/api/routerReCreateDB/setup

För test kör kommando: 
- npm run test
