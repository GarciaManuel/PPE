import { IResolvers } from "graphql-tools";
import JWT from "../lib/jwt";
import bcryptjs from "bcryptjs";

const query: IResolvers = {
  Query: {
    async users(_: void, __: any, { db }): Promise<any> {
      return await db
        .collection("users")
        .find()
        .toArray();
    },
    async login(_: void, { email, password }, { db }): Promise<any> {
      const user = await db.collection("users").findOne({ email });
      if (user === null) {
        return {
          status: false,
          message: "FAILED to log in. User not found.",
          token: null
        };
      }

      if (!bcryptjs.compareSync(password, user.password)) {
        return {
          status: false,
          message: "FAILED to log in. Incorrect password.",
          token: null
        };
      }
      delete user.password;
      return {
        status: true,
        message: "Correct token.",
        token: new JWT().sign({ user })
      };
    },
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
    async getMeasures(_: void, { patient }, { db,token }): Promise<any> {
      console.log(patient);
      return await db
        .collection("measures")
        .find({ patientId: patient })
        .toArray();
    },
    async getPacients(_: void, { podiatrist }, { db, token }): Promise<any> {
      let info: any = new JWT().verify(token);
      if (info === "Invalid token. Log in again.") {
        return {
          status: false,
          message: info
        };
      }
      let pacients = await db
      .collection("users")
      .find({podiatrist: false, currentPodiatrist:podiatrist})
      .toArray();

      return {
        status:true,
        message: "Pacients retrieved",
        pacients: pacients
      }

    },
    async getPacient(_: void, { podiatrist, patient }, { db, token }): Promise<any> {
      let info: any = new JWT().verify(token);
      if (info === "Invalid token. Log in again.") {
        return {
          status: false,
          message: info
        };
      }
      let pacient = await db
      .collection("users")
      .find({podiatrist: false, currentPodiatrist:podiatrist, id:patient})

      return {
        status:true,
        message: "Pacient retrieved",
        patient: pacient
      }

    }
  }
};

export default query;
