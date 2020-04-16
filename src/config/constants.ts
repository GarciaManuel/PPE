import environments from './environments';
//Get all constants form the env file into the code
if (process.env.NODE_ENV !== 'production') {
    const environment = environments;
}

export const SECRET_KEY = process.env.SECRET || 'AnartzMugika';