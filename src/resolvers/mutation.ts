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
          message: `Usuario NO registrado porque ya existe el usuario ${user.email}`,
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
            message: `Usuario ${user.name} ${user.lastname} añadido correctamente`,
            user
          };
        })
        .catch((err: any) => {
          return {
            status: false,
            message: `Usuario NO añadido correctamente`,
            user: null
          };
        });
    },
    async deleteUser(_: void, { userId }, { db, token }): Promise<any> {
      let info: any = new JWT().verify(token);
      if (
        info ===
        "La autenticación del token es inválida. Por favor, inicia sesión para obtener un nuevo token"
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
            message: `Usuario ${deleted} eliminado correctamente`
          };
        })
        .catch((err: any) => {
          console.log(err);
          return {
            status: false,
            message: `Error en la eliminación de Usuario`
          };
        });
    },
    async uploadCSV(_: void, { csvFile }, { db, token }): Promise<any> {
      const path = require("path");
      const { createWriteStream } = require("fs");

      let info: any = new JWT().verify(token);
      if (
        info ===
        "La autenticación del token es inválida. Por favor, inicia sesión para obtener un nuevo token"
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
          message: "El tipo de archivo no es aceptado, solo csv",
        };
      }
      const newPath = path.join(__dirname, "../../uploads/images", `${info.user.id}_${info.user.email}_${new Datetime().getCurrentDateTime()}_${filename}`);
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
          message: "Hubo un problema al guardar el archivo",
        };
      }

      return await db
        .collection("files")
        .insertOne({ name: filename })
        .then((result: any) => {
          return {
            status: true,
            message: `Se ha subido correctamente el archivo`
          };
        })
        .catch((err: any) => {
          console.log(err);
          return {
            status: false,
            message: `Error en la subida del archivo`
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
