import { SECRET_KEY } from "../config/constants";

const jwt = require('jsonwebtoken');

class JWT {
    private secretKey = SECRET_KEY as string;

    //Sign data based on the secretKey of the project with an expiration and the user 
    sign(data: any): string {
        return jwt.sign({ user: data.user}, this.secretKey, { expiresIn: 24 * 60 * 60});
    }

    //Verify if a token was signed by the project
    verify(token: string): string {
        try {
            return jwt.verify(token, this.secretKey) as string;
        } catch (e) {
            return 'Invalid token. Log in again.';
        }
    }
}

export default JWT;