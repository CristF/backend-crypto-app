There are two repositories you must clone in order to run the project locally, this one, and the front end repository. As of the time of writing this, you can simply access the live site here for easier access and testing: 
https://crypto-app-frontend-ouiis.ondigitalocean.app/

If the server isnt up and you would like to clone it:

1. clone the repository into your local files/folder using https, ssh, or the CLI.
2. navigate to the /backend-crypto-app
3. run npm install

setting up the .env you would need to let me know in order to have access to the database and API keys, but the following is the format for your backend .env file

PORT=5000
URI = {mongoDB connection string}
JWT_SECRET= {your own jwt secret}
EMAIL_USER = cryptotrackerteam@gmail.com
EMAIL_PASSWORD = {password}
NODE_ENV = development 
DB_NAME = Crypto_users
CG_API_KEY = {CG api key}
FRONTEND_URL = http://localhost:5173
