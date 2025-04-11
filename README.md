## Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)
- MongoDB Atlas account (for database)
- CoinGecko API key

There are two repositories you must clone in order to run the project locally, this one, and the front end repository. As of the time of writing this, you can simply access the live site here for easier access and testing: 
https://crypto-app-frontend-ouiis.ondigitalocean.app/

Here is the backend link if you would like to purely test API calls:
https://crypto-app-backend-izkoy.ondigitalocean.app/

If the server isnt up and you would like to clone it:

1. clone the repository into your local files/folder using https, ssh, or the CLI.
2. navigate to the /backend-crypto-app
3. run npm install
4. create .env file in root directory, you would need to contact me in order to have access to the database and email password, but you can set up your own email or database if youd like. The following is the format for your backend .env file

PORT=5000
URI = {mongoDB connection string}
JWT_SECRET= {your own jwt secret}
EMAIL_USER = cryptotrackerteam@gmail.com
EMAIL_PASSWORD = {password}
NODE_ENV = development 
DB_NAME = Crypto_users
CG_API_KEY = {CG api key}
FRONTEND_URL = http://localhost:5173


AI was also used in the creation of this project, namely github's CLAUDE AI in the backend for setting up project folder structure, helping troubleshoot errors in the backend, errors for the API calls, and troubleshooting schema errors. Files that were affected were:

api/models/Crypto.js
api/models/CryptoList.js

/api/routes/crypto.js
/api/routes/user.js
