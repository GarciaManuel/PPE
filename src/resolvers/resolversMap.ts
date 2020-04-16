import { IResolvers } from "graphql-tools";
import query from "./query";
import mutation from "./mutation";
import { GraphQLUpload } from 'graphql-upload';

//Get all querys and mutations to set GraphQL Server
const resolvers : IResolvers = {
    Upload: GraphQLUpload,
    ...query,
    ...mutation
}

export default resolvers;