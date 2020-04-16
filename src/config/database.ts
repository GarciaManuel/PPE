let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
import chalk from 'chalk';

//Database class for sigelton aproach
class Database {

    //Init the database by reaching the mongoDB and the path on the env file
    async init() {
        const MONGODB = String(process.env.DATABASE);
        const client = await MongoClient.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true});

        //Wait for the connection
        const db = await client.db();

        if ( client.isConnected() ) {
            console.log('==========DATABASE==========');
            console.log(`STATUS: ${chalk.greenBright('ONLINE')}`);
            console.log(`DATABASE: ${chalk.greenBright(db.databaseName)}`);
        }

        return db;
    }
}

export default Database;
