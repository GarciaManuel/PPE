import { IResolvers } from "graphql-tools";
import query from "./query";
import mutation from "./mutation";
import { GraphQLUpload } from 'graphql-upload';


const resolvers : IResolvers = {
    Upload: GraphQLUpload,
    ...query,
    ...mutation
}

export default resolvers;