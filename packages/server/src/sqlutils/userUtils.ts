import sqlUtils from "./commonUtils";
import { ERRORS } from "shared/dist/src/types";

export interface UserInfo {
  error: ERRORS;
  id?: number;
  firstname?: string;
  lastname?: string;
  useridemail?: string;
  passwrd?: string;
  lastaccessdate?: Date;
  accesstokentries?: number;
  accesstoken?: number;
  accesskey?: string;
  resetkey?: string;
}

export interface WorkspaceUser {
  firstname: string;
  lastname: string;
  userid: string;
  userroleid: number;
}

const userUtils = {
  getUserInfo: async (useridEmail: string): Promise<UserInfo> => {
    const query = "select * from user where useridemail = ?;";
    const params = [useridEmail];
    const result = (await sqlUtils.transactionQuery(
      [{ query, params }],
      false
    )) as UserInfo[];

    return result?.length === 1
      ? { ...result[0], error: ERRORS.OK }
      : { error: ERRORS.UNKNOWNUSER };
  },

  getUserInfoById: async (userid: number): Promise<UserInfo> => {
    if (!Number.isInteger(userid)) {
      return { error: ERRORS.UNKNOWNUSER };
    }

    const query = "select * from user where id = ?;";
    const params = [userid];
    const result = (await sqlUtils.transactionQuery(
      [{ query, params }],
      false
    )) as UserInfo[];

    return result?.length === 1
      ? { ...result[0], error: ERRORS.OK }
      : { error: ERRORS.UNKNOWNUSER };
  },

  createUser: async (
    useridEmail: string,
    firstname: string,
    lastname: string
  ) => {
    const query =
      "insert into user (firstname, lastname, useridemail) values (?, ?, ?);";
    const params = [firstname, lastname, useridEmail];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.affectedRows === 1;
  },

  // This method should not be used in production.  It is here for testing only.
  deleteUser: async (useridEmail: string) => {
    const query = "delete from user where useridEmail = ?;";
    const params = [useridEmail];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.affectedRows === 1;
  },

  getWorkspaceUsers: async (workspaceId: number): Promise<WorkspaceUser[]> => {
    const query =
      "select user.firstname, user.lastname, user.useridemail, workspaceaccess.userroleid from  workspaceaccess " +
      "inner join user on user.id = workspaceaccess.userid " +
      "where workspaceaccess.workspaceid = ?;";
    const params = [workspaceId];
    const rows = await sqlUtils.transactionQuery([{ query, params }], false);

    return rows;
  },
};

export default userUtils;
