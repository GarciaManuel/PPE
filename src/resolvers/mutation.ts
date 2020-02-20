import { IResolvers } from "graphql-tools";
import { Datetime } from "../lib/datetime";
import bcryptjs from "bcryptjs";
import JWT from "../lib/jwt";
const mutation: IResolvers = {
  Mutation: {
    async register(_: void, { user }, { db }): Promise<any> {
      const userCheck = await db
        .collection("users")
        .findOne({ email: user.email });

      if (userCheck !== null) {
        return {
          status: false,
          message: `User NOT registered, the user already exists ${user.email}`,
          user: null
        };
      }
      const lastUser = await db
        .collection("users")
        .find()
        .limit(1)
        .sort({ registerDate: -1 })
        .toArray();
      if (lastUser.length === 0) {
        user.id = 1;
      } else {
        user.id = lastUser[0].id + 1;
      }
      user.password = bcryptjs.hashSync(user.password, 10);
      user.registerDate = new Datetime().getCurrentDateTime();
      return await db
        .collection("users")
        .insertOne(user)
        .then((result: any) => {
          return {
            status: true,
            message: `User ${user.name} ${user.lastname} added correctly`,
            user
          };
        })
        .catch((err: any) => {
          return {
            status: false,
            message: `User NOT added correctly`,
            user: null
          };
        });
    },
    async deleteUser(_: void, { userId }, { db, token }): Promise<any> {
      let info: any = new JWT().verify(token);
      if (
        info === "Invalid token. Log in again."
      ) {
        return {
          status: false,
          message: info,
          user: null
        };
      }
      return await db
        .collection("users")
        .deleteOne({ id: userId })
        .then((result: any) => {
          console.log(result.result);
          let done = result.result.n && result.result.ok;
          let deleted = "";
          if (!done) deleted = "NO";
          return {
            status: done,
            message: `User ${deleted} deleted correctly`
          };
        })
        .catch((err: any) => {
          console.log(err);
          return {
            status: false,
            message: `Deleting user failed`
          };
        });
    },
    async uploadCSV(_: void, { csvFile }, { db, token }): Promise<any> {
      const path = require("path");
      const { createWriteStream } = require("fs");

      let info: any = new JWT().verify(token);
      if (
        info ==="Invalid token. Log in again."
      ) {
        return {
          status: false,
          message: info,
        };
      }

      const { createReadStream, filename, mimetype, encoding } = await csvFile;
      console.log(mimetype);
      if(mimetype!=="text/csv"){
        return {
          status: false,
          message: "File type not accepted, only .csv",
        };
      }
      const newPath = path.join(__dirname, `../../uploads/${info.user.id}`, `${info.user.email}_${new Datetime().getCurrentDateTime()}_${filename}`);
      const stream = createReadStream();

      if (
        !(await new Promise((resolve, reject) =>
          stream
            .pipe(createWriteStream(newPath))
            .on("error", (error: any) => reject(error))
            .on("finish", () => resolve({ newPath }))
        ))
      ) {
        return {
          status: false,
          message: "Failed to create stream to store the csv",
        };
      }

      return await db
        .collection("files")
        .insertOne({ name: filename })
        .then((result: any) => {
          return {
            status: true,
            message: `File uploaded succesfully`
          };
        })
        .catch((err: any) => {
          console.log(err);
          return {
            status: false,
            message: `Failed to store correctly the csv`
          };
        });
    }
    // async addMeasure(_: void, { measure }, { db }): Promise<any> {
    //   console.log(measure);
    //   measure.date = new Datetime().getCurrentDateTime();
    //   return await db
    //     .collection("measures")
    //     .insertOne(measure)
    //     .then((result: any) => {
    //       return {
    //         status: true,
    //         message: `Successful addition to measures.`,
    //         measure
    //       };
    //     })
    //     .catch((err: any) => {
    //       return {
    //         status: false,
    //         message: `Failed addition to measures.`,
    //         measure: null
    //       };
    //     });
    // },
    // async deleteMeasure(_: void, { measureId }, { db, token }): Promise<any> {
    //   let info: any = new JWT().verify(token);
    //   if (info === "Invalid token. You need to log in first.") {
    //     return {
    //       status: false,
    //       message: info,
    //       user: null
    //     };
    //   }
    //   return await db
    //     .collection("measures")
    //     .deleteOne({ id: measureId })
    //     .then((result: any) => {
    //       console.log(result.result);
    //       let done = result.result.n && result.result.ok;
    //       let deleted = "";
    //       if (!done) deleted = "NO";
    //       return {
    //         status: done,
    //         message: `Measure ${deleted} successfully deleted.`
    //       };
    //     })
    //     .catch((err: any) => {
    //       console.log(err);
    //       return {
    //         status: false,
    //         message: `Failed attempt to delete measure.`
    //       };
    //     });
    // }
  }
};

export default mutation;
