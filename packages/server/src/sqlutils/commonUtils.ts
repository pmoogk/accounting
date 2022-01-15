import mysql from "mysql";

import { v4 as uuidv4 } from "uuid";
import { config } from "dotenv";
import { ERRORS, GetWorkspacesResponse, PERMISSIONS } from "shared/src/types";
config();

console.log("Creds=", process.env.DB_USER, process.env.DB_PASSWORD);
const pool = mysql.createPool({
  host: "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "accounting",
});

export interface ParamaterizedQuery {
  query: string;
  params: (string | number | boolean)[];
}

export interface AccessType {
  workspaceadmin: boolean;
  readaccess: boolean;
  writeaccess: boolean;
  approver: boolean;
  auditor: boolean;
}

const sqlUtils = {
  getConnection: async () => {
    return new Promise<mysql.PoolConnection>((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err !== null) {
          console.log("Error:", err);
        }
        resolve(err ? null : connection);
      });
    });
  },

  close: () => {
    pool.end();
  },

  query: async (
    connection: mysql.PoolConnection,
    query: string,
    params: (string | number | boolean)[] = []
  ) => {
    return new Promise((resolve, reject) => {
      connection.query(query, params, (err, rows) => {
        if (err !== null) {
          console.log("Error in query:", err);
        }
        resolve(err ? null : rows);
      });
    });
  },

  startTransaction: async (canUpdate: boolean) => {
    try {
      const connection = await sqlUtils.getConnection();
      const params = canUpdate ? "READ WRITE" : "READ ONLY";

      if (connection) {
        await sqlUtils.query(connection, "SET autocommit=0;");
        await sqlUtils.query(connection, `start transaction ${params};`);

        return connection;
      }
    } catch (exc) {
      return null;
    }

    return null;
  },

  commitTransaction: async (connection: mysql.PoolConnection) => {
    await sqlUtils.query(connection, "commit;");
  },

  rolebackTransaction: async (connection: mysql.PoolConnection) => {
    await sqlUtils.query(connection, "rollback;");
  },

  // Execute a number of queries within a transaction.
  transactionQuery: async (
    queries: ParamaterizedQuery[],
    canUpdate: boolean,
    userId: number = null
  ) => {
    let connection;
    let result = null;

    // If we are setting the timestamp for the user we have to set canUpdate to true.
    canUpdate = userId === null ? canUpdate : true;

    try {
      connection = await sqlUtils.startTransaction(canUpdate);

      if (connection) {
        // If the userid is specified we will update the last access time
        // for this user.
        if (userId !== null) {
          const query = "update user set lastaccessdate = now() where id=?;";

          queries.unshift({ query, params: [userId] });
        }

        // Create an array of async function calls.  Note: the queries are
        // executed here.
        const queryCalls = queries.map((queryInfo) => async () => {
          const query = queryInfo.query;
          const params = queryInfo.params;

          return await sqlUtils.query(connection, query, params);
        });

        // Execute all of these query calls sequentially
        await queryCalls.reduce(async (previousPromise, nextCall) => {
          await previousPromise;
          result = await nextCall();
        }, Promise.resolve());

        await sqlUtils.commitTransaction(connection);
      }
    } catch (exc) {
      if (connection) {
        sqlUtils.rolebackTransaction(connection);
      }
      console.log(exc);
    } finally {
      if (connection) {
        connection.release();
      }
    }

    return result;
  },
};

export default sqlUtils;
