import { IResolvers } from "graphql-tools";
import { Datetime } from "../lib/datetime";
var bcryptjs = require("bcryptjs");
import JWT from "../lib/jwt";
const mutation: IResolvers = {
  Mutation: {
    //Register a user
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
      //Get the last user so we can generate an ID for the next one
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
      //Hash pasword
      user.password = bcryptjs.hashSync(user.password, 10);
      //Add registerDate
      user.registerDate = new Datetime().getCurrentDateTime();
      
      //If not a podiatrist then set the sensors as default
      if (user.podiatrist == false) {
        user.anomaly = false;
        user.anomaly_threshold = 20;
        user.sensor_1_top_position = 454;
        user.sensor_2_top_position = 454;
        user.sensor_3_top_position = 454;
        user.sensor_4_top_position = 454;
        user.sensor_5_top_position = 454;
        user.sensor_1_left_position = 412;
        user.sensor_2_left_position = 452;
        user.sensor_3_left_position = 492;
        user.sensor_4_left_position = 532;
        user.sensor_5_left_position = 572;
      }
      return await db
        .collection("users")
        .insertOne(user)
        .then((result: any) => {
          delete user.password;
          return {
            status: true,
            message: `User ${user.name} ${user.lastname} added correctly`,
            token: new JWT().sign({ user }),
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
    //Delete a user
    async deleteUser(_: void, { userId }, { db, token }): Promise<any> {
      let info: any = new JWT().verify(token);
      if (info === "Invalid token. Log in again.") {
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
          //If mongoDB confirmed the deleting of the item then return true
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
    //Add a measure 
    async addMeasure(_: void, { measure }, { db }): Promise<any> {
      measure.date = new Datetime().getCurrentDateTime();
      return await db
        .collection("measures")
        .insertOne(measure)
        .then((result: any) => {
          return {
            status: true,
            message: `Successful addition to measures.`,
            measure
          };
        })
        .catch((err: any) => {
          return {
            status: false,
            message: `Failed addition to measures.`,
            measure: null
          };
        });
    },

    //Upload a CSV file
    async uploadCSV(_: void, { csvFile, token }, { db }): Promise<any> {
      const path = require("path");
      //Create a stream to write in the server
      const { createWriteStream } = require("fs");

      //Check if logged in
      let info: any = new JWT().verify(token);
      if (info === "Invalid token. Log in again.") {
        return {
          status: false,
          message: info,
          fileCompleteName: null
        };
      }

      //Read the uploaded csv file
      const { createReadStream, filename, mimetype, encoding } = await csvFile;
      //Check the type 
      if (mimetype !== "text/csv") {
        return {
          status: false,
          message: "File type not accepted, only .csv",
          fileCompleteName: null
        };
      }
      //Create a unique name for the file based on current datetime, email and the name of the uploaded file
      const fileCompleteName = `${
        info.user.email
      }_${new Datetime().getCurrentDateTime()}_${filename}`;
      const newPath = path.join(__dirname, `../`, fileCompleteName);
      const stream = createReadStream();
      
      //Pass the stream readed into another to put all the information
      if (
        !(await new Promise((resolve, reject) =>
          stream
            .pipe(createWriteStream(newPath))
            .on("error", (error: any) => {
              console.log(error);
              reject(error);
            })
            .on("finish", () => resolve({ newPath }))
        ))
      ) {
        return {
          status: false,
          message: "Failed to create stream to store the csv",
          fileCompleteName: null
        };
      }

      //If there were no errors then add the filename to MongoDB and return true
      return await db
        .collection("files")
        .insertOne({ name: filename })
        .then((result: any) => {
          return {
            status: true,
            message: `File uploaded succesfully`,
            fileCompleteName: fileCompleteName
          };
        })
        .catch((err: any) => {
          console.log(err);
          return {
            status: false,
            message: `Failed to store correctly the csv`,
            fileCompleteName: null
          };
        });
    },

    //Get the measures from a patient
    async getMeasures(_: void, { patient }, { db, token }): Promise<any> {
      return await db
        .collection("measures")
        .find({ patientId: patient })
        .toArray();
    },
    //Log a podiatrist into a system, only podiatrist (Made for WEB APP)
    async loginPodiatrist(_: void, { email, password }, { db }): Promise<any> {
      const user = await db.collection("users").findOne({ email });
      if (user === null) {
        return {
          status: false,
          message: "FAILED to log in. User not found.",
          token: null
        };
      }
      //Compare the hash
      if (!bcryptjs.compareSync(password, user.password)) {
        return {
          status: false,
          message: "FAILED to log in. Incorrect password.",
          token: null
        };
      }
      if (!user.podiatrist) {
        return {
          status: false,
          message: "FAILED to log in. Only podiatrist allowed on the system.",
          token: null
        };
      }
      delete user.password;
      //Return the token an the info without the password
      return {
        status: true,
        message: "Correct token.",
        token: new JWT().sign({ user }),
        user: user
      };
    },
    //Add a group of patients to a podiatrist
    async addPatientsArray(
      _: void,
      { podiatrist, patients },
      { db, token }
    ): Promise<any> {
      let info: any = new JWT().verify(token);
      if (info === "Invalid token. Log in again.") {
        return {
          status: false,
          message: info
        };
      }

      var updated = 0;
      //For each patientID search it and add the current podiatrist
      patients.forEach(async (patient: any) => {
        const alonePatient = await db
          .collection("users")
          .updateOne(
            { id: parseInt(patient) },
            { $set: { currentPodiatrist: podiatrist } }
          );
        if (alonePatient.modifiedCount == 0) {
          return {
            status: false,
            message: `Patient not found`,
            updatedPatients: updated
          };
        } else updated += 1;
      });

      return {
        status: true,
        message: "Patients added correctly",
        updatedPatients: updated
      };
    },
    //Modify the information on a user
    async updateUser(_: void, { user, change }, { db, token }): Promise<any> {
      //If we want to change the password we need to hash it
      if (change.password) {
        change.password = bcryptjs.hashSync(change.password, 10);
      }
      //Check the token
      let info: any = new JWT().verify(token);
      if (info === "Invalid token. Log in again.") {
        return {
          status: false,
          message: info
        };
      }

      //Get the user and change all the info that we desired
      const userModified = await db
        .collection("users")
        .updateOne({ id: parseInt(user) }, { $set: change });

      if (userModified.modifiedCount == 0) {
        return {
          status: false,
          message: `User not updated`
        };
      }

      return {
        status: true,
        message: "User updated"
      };
    }
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
