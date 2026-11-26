# InternHive - restructured for learning

Same app as your original, but every feature now has its OWN files, on the backend and the frontend.
Start with **LEARNING-GUIDE.md**.

```
internhive-learn/
  server/                      (Node + Express + MySQL)
    database/  schema.sql  seed.sql
    server.js                  entry point (npm start)
    src/
      app.js                   builds the Express app
      routes/                  URL table:  authRoutes, taskRoutes, studentRoutes, employerRoutes, adminRoutes ...
      controllers/             logic per feature: registerController, loginController, passwordController ...
      models/                  SQL per table:  userModel, taskModel, applicationModel ...
      validators/              input rules (zod) per feature
      middleware/ services/ utils/ config/ socket/
  client/                      (React + Vite)
    src/
      App.jsx                  route table
      features/<feature>/      pages/ + components/ + <feature>Api.js   (auth, tasks, applications, admin ...)
      shared/                  api client, context, hooks, UI components
```

## Run it
```bash
mysql -u root -p < server/database/schema.sql
cd server && cp .env.example .env     # set JWT_SECRET (32+ chars) and DB_PASSWORD
npm install && npm run seed && npm start      # http://localhost:5000
cd ../client && npm install && npm run dev    # http://localhost:5173
```
Demo logins after `npm run seed` (password `Demo@1234`): admin@internhive.local, employer1@demo.com, student1@demo.com.
Without SMTP, e-mails (verification codes) are printed in the server console.
