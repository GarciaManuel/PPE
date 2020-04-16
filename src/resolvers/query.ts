import { IResolvers } from "graphql-tools";
import JWT from "../lib/jwt";
var bcryptjs = require('bcryptjs');

//Queries of the app
const query: IResolvers = {
  Query: {
    //Return all users from MongoDB
    async users(_: void, __: any, { db }): Promise<any> {
      return await db
        .collection("users")
        .find()
        .toArray();
    },
    //Log an user
    async login(_: void, { email, password }, { db }): Promise<any> {
      //Get the user
      const user = await db.collection("users").findOne({ email });
      if (user === null) {
        return {
          status: false,
          message: "FAILED to log in. User not found.",
          token: null,
          user: null
        };
      }
      //Hash password and compare to the one stored
      if (!bcryptjs.compareSync(password, user.password)) {
        return {
          status: false,
          message: "FAILED to log in. Incorrect password.",
          token: null,
          user: null
        };
      }
      delete user.password;
      //If logged in correctly signa  token and return the user info without password
      return {
        status: true,
        message: "Correct token.",
        token: new JWT().sign({ user }),
        user: user
      };
    },
    //Get my current information when logged in by token
    me(_: void, __: any, { token }) {
      let info: any = new JWT().verify(token);
      if (info === "Invalid token. Log in again.") {
        return {
          status: false,
          message: info,
          user: null
        };
      }
      return {
        status: true,
        message: "Correct token.",
        user: info.user
      };
    },
    //Get all measures from the database based on the patient id
    async getMeasures(_: void, { patient }, { db, token }): Promise<any> {
      return await db
        .collection("measures")
        .find({ patientId: patient })
        .toArray();
    },
    //Get all patients from a podiatrist
    async getPacients(_: void, { podiatrist }, { db, token }): Promise<any> {
      let info: any = new JWT().verify(token);
      //Check if it is authorized
      if (info === "Invalid token. Log in again.") {
        return {
          status: false,
          message: info
        };
      }
      //Get the patients of the current podiatrist
      let pacients = await db
        .collection("users")
        .find({ podiatrist: false, currentPodiatrist: podiatrist })
        .toArray();

      return {
        status: true,
        message: "Pacients retrieved",
        pacients: pacients
      };
    },
    //Get all unasigned patients
    async getFreePacients(_: void, {}, { db, token }): Promise<any> {
      let info: any = new JWT().verify(token);
      if (info === "Invalid token. Log in again.") {
        return {
          status: false,
          message: info
        };
      }
      //Return the ones without a podiatrist
      let pacients = await db
        .collection("users")
        .find({ podiatrist: false, currentPodiatrist: null })
        .toArray();

      return {
        status: true,
        message: "Pacients retrieved",
        pacients: pacients
      };
    },
    //Gt specific patient of a podiatrist
    async getPacient(
      _: void,
      { podiatrist, patient },
      { db, token }
    ): Promise<any> {
      let info: any = new JWT().verify(token);
      if (info === "Invalid token. Log in again.") {
        return {
          status: false,
          message: info
        };
      }
      let pacient = await db.collection("users").find({
        podiatrist: false,
        currentPodiatrist: podiatrist,
        id: patient
      });

      return {
        status: true,
        message: "Pacient retrieved",
        patient: pacient
      };
    }
  }
};

export default query;
