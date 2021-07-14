import mysql from "mysql";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "mooser01",
  database: "accounting",
});

const passwordUtils = {
  encryptPassword: (password: string) => {
    return bcrypt.hashSync(password, 10);
  },

  comparePassword: (hashPassword: string, plainPassword: string): boolean => {
    return bcrypt.compareSync(plainPassword, hashPassword);
  },
};

interface ParamaterizedQuery {
  query: string;
  params: (string | number)[];
}

export interface AccessType {
  orgadmin: boolean;
  workspaceadmin: boolean;
  writeaccess: boolean;
  approver: boolean;
  auditor: boolean;
}

export interface WorkspaceUser {
  firstname: string;
  lastname: string;
  userid: string;
  userroleid: number;
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
    params: (string | number)[] = []
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
    canUpdate: boolean
  ) => {
    let connection;
    let result = null;

    try {
      connection = await sqlUtils.startTransaction(canUpdate);

      if (connection) {
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

  // Called when the user requests to reset their password.
  // Returns null if this is not a user we know about.  Otherwise
  // it returns the special uuid code needed to set the password.
  resetPassword: async (userid: string) => {
    const query = "update user set resetkey = ? where userid = ?;";
    const resetKey = uuidv4();
    const params = [resetKey, userid];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    // If one row was change then the userid was found.  Otherwise, this
    // is an unknown user.
    return result?.changedRows === 1 ? resetKey : null;
  },

  setPassword: async (
    userid: string,
    newPasswordPlain: string,
    resetKey: string
  ) => {
    const hashedPassword = passwordUtils.encryptPassword(newPasswordPlain);
    const query =
      "update user set resetkey = null, passwrd = ? " +
      "where userid = ? and resetkey = ?;";
    const params = [hashedPassword, userid, resetKey];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    // If one row was change then the userid was found.  Otherwise, this
    // is an unknown user.
    return result?.changedRows === 1;
  },

  getUserInfo: async (userid: string) => {
    const query = "select * from user where userid = ?;";
    const params = [userid];
    const result = await sqlUtils.transactionQuery([{ query, params }], false);

    return result?.length === 1 ? result[0] : null;
  },

  getAccessToken: async (userid: string, passwordPlain: string) => {
    const userInfo = await sqlUtils.getUserInfo(userid);

    // Return null if we don't find the user info.
    if (userInfo === null) return null;

    const passwordMatch = passwordUtils.comparePassword(
      userInfo.passwrd,
      passwordPlain
    );

    if (passwordMatch === true) {
      // Generate a random access key from 100,000 to 999,999
      const accessToken = Math.floor(Math.random() * 900000) + 100000;
      const query = "update user set accesstoken = ? where userid = ?;";
      const params = [accessToken, userid];
      const result = await sqlUtils.transactionQuery([{ query, params }], true);

      return result?.changedRows === 1 ? accessToken : null;
    } else {
      // The password doesn't match so we will not give and access key
      return null;
    }
  },

  getAccessKey: async (userid: string, accessToken: number) => {
    const userInfo = await sqlUtils.getUserInfo(userid);

    // Return null if we don't find the user info.
    if (userInfo === null || accessToken !== userInfo.accesstoken) return null;

    // Generate an accesskey.  This key is used to access the other functions
    // of this accounting application.
    const accessKey = uuidv4();
    const query =
      "update user set accesstoken = null, accesskey = ? where userid = ?;";
    const params = [accessKey, userid];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.changedRows === 1 ? accessKey : null;
  },

  createUser: async (userid: string, firstname: string, lastname: string) => {
    const query =
      "insert into user (firstname, lastname, userid) values (?, ?, ?);";
    const params = [firstname, lastname, userid];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.affectedRows === 1;
  },

  // This method should not be used in production.  It is here for testing only.
  deleteUser: async (userid: string) => {
    const query = "delete from user where userid = ?;";
    const params = [userid];

    await sqlUtils.transactionQuery([{ query, params }], true);
  },

  addUserAccess: async (
    userId: number,
    workspaceId: number,
    roleId: number
  ) => {
    const query =
      "insert into workspaceaccess (userid, workspaceid, userroleid) " +
      "values (?, ?, ?);";
    const params = [userId, workspaceId, roleId];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.affectedRows === 1;
  },

  deleteUserAccess: async (
    userId: number,
    workspaceId: number,
    roleId: number
  ) => {
    const query =
      "delete from workspaceaccess where userid = ? and workspaceid = ? and userroleid = ?;";
    const params = [userId, workspaceId, roleId];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.affectedRows === 1;
  },

  updateUserAccess: async (
    userId: number,
    workspaceId: number,
    roleId: number
  ) => {
    const query =
      "update workspaceaccess set roleid = ? where userid = ? and workspaceid = ?;";
    const params = [roleId, userId, workspaceId];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.affectedRows === 1;
  },

  getUserAccess: async (
    userId: number,
    workspaceId: number
  ): Promise<AccessType | null> => {
    const query =
      "select userrole.orgadmin, userrole.workspaceadmin, userrole.writeaccess, " +
      "userrole.approver, userrole.auditor, workspaceaccess.userroleid  from workspaceaccess " +
      "inner join userrole on userrole.id = workspaceaccess.userroleid " +
      "where workspaceaccess.userid = ? and workspaceaccess.workspaceid = ?;";
    const params = [userId, workspaceId];
    const rows = await sqlUtils.transactionQuery([{ query, params }], false);
    const result: AccessType = {
      orgadmin: false,
      workspaceadmin: false,
      writeaccess: false,
      approver: false,
      auditor: false,
    };

    if (rows?.length >= 1) {
      rows.forEach((row) => {
        result.orgadmin = result.orgadmin || row.orgadmin === 1;
        result.workspaceadmin =
          result.workspaceadmin || row.workspaceadmin === 1;
        result.writeaccess = result.writeaccess || row.writeaccess === 1;
        result.approver = result.approver || row.approver === 1;
        result.auditor = result.auditor || row.auditor === 1;
      });

      return result;
    }

    return null;
  },

  getWorkspaceUsers: async (workspaceId: number): Promise<WorkspaceUser[]> => {
    const query =
      "select user.firstname, user.lastname, user.userid, workspaceaccess.userroleid from  workspaceaccess " +
      "inner join user on user.id = workspaceaccess.userid " +
      "where workspaceaccess.workspaceid = ?;";
    const params = [workspaceId];
    const rows = await sqlUtils.transactionQuery([{ query, params }], false);

    return rows;
  },

  getRoles: async () => {
    const query = "select name from userrole where orgadmin = false;";
    const params = [];
    const result = await sqlUtils.transactionQuery([{ query, params }], false);

    return result;
  },
};

export default sqlUtils;
