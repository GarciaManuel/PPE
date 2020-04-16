import express from 'express';
var compression = require('compression');
import cors from 'cors';
import schema from './schema';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import environments from './config/environments';
import Database from './config/database';
import expressPlayground from 'graphql-playground-middleware-express';
import { graphqlUploadExpress } from 'graphql-upload'

// Run the server as production
if (process.env.NODE_ENV !== 'production') {
    const envs = environments;
    // console.log(envs);
}
//Initiate the server
async function init() {
    //Permit upload files on the server
    const app = express().use(
        graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 })
    );

    app.use('*', cors());

    app.use(compression());
    
    //Create instance of DB
    const database = new Database();
    const db = await database.init();
    
    //Get the context, obatin the token to Authorize access
    const context: any = async({req,connection}: any) => {
        const token = req ? req.headers.authorization : connection.authorization;
        return { db, token };
    };
    const server = new ApolloServer({
        schema,
        context,
        introspection: true,
        uploads: false
    });

    server.applyMiddleware({ app });

    app.use('/', expressPlayground({
        endpoint: '/graphql'
    }));
    
    const PORT = process.env.PORT || 5300;
    const httpServer = createServer(app);
    httpServer.listen(
        { port: PORT },
        () => console.log(`Authentication systems JWT API GraphQL http://localhost:${PORT}/graphql`)
    );
}

init();