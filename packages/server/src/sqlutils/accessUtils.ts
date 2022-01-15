import bcrypt from "bcrypt";
import sqlUtils from "./commonUtils";
import { v4 as uuidv4 } from "uuid";
import {
  ERRORS,
  GetWorkspacesResponse,
  PERMISSIONS,
} from "shared/dist/src/types";
import userUtils, { UserInfo } from "./userUtils";

export const passwordUtils = {
  encryptPassword: (password: string) => {
    return bcrypt.hashSync(password, 10);
  },

  comparePassword: (hashPassword: string, plainPassword: string): boolean => {
    return bcrypt.compareSync(plainPassword, hashPassword);
  },
};

const accessUtils = {
  // Called when the user requests to reset their password.
  // Returns null if this is not a user we know about.  Otherwise
  // it returns the special uuid code needed to set the password.
  resetPassword: async (useridEmail: string): Promise<string | null> => {
    const query = "update user set resetkey = ? where useridemail = ?;";
    const resetKey = uuidv4();
    const params = [resetKey, useridEmail];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    // If one row was change then the userid was found.  Otherwise, this
    // is an unknown user.
    return result?.changedRows === 1 ? resetKey : null;
  },

  setPassword: async (
    useridEmail: string,
    newPasswordPlain: string,
    resetKey: string
  ) => {
    const hashedPassword = passwordUtils.encryptPassword(newPasswordPlain);
    const query =
      "update user set resetkey = null, passwrd = ? " +
      "where useridemail = ? and resetkey = ?;";
    const params = [hashedPassword, useridEmail, resetKey];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    console.log("Set password result=", result);
    // If one row was change then the userid was found.  Otherwise, this
    // is an unknown user.
    return result?.changedRows === 1;
  },

  getAccessToken: async (
    useridEmail: string,
    passwordPlain: string
  ): Promise<{ error: ERRORS; accessToken?: number }> => {
    const userInfo = await userUtils.getUserInfo(useridEmail);

    // Check for an error in getting the user info.
    if (userInfo.error !== ERRORS.OK) return { error: userInfo.error };

    const passwordMatch = passwordUtils.comparePassword(
      userInfo.passwrd,
      passwordPlain
    );

    if (passwordMatch === true) {
      // Generate a random access key from 100,000 to 999,999
      const accessToken = Math.floor(Math.random() * 900000) + 100000;
      const query = "update user set accesstoken = ? where useridemail = ?;";
      const params = [accessToken, useridEmail];
      const result = await sqlUtils.transactionQuery([{ query, params }], true);

      return result?.changedRows === 1
        ? { error: ERRORS.OK, accessToken }
        : { error: ERRORS.UNKNOWN };
    } else {
      // The password doesn't match so we will not give and access key
      return { error: ERRORS.BADPASSWORD };
    }
  },

  getAccessKey: async (
    useridEmail: string,
    accessToken: number
  ): Promise<{ error: ERRORS; accessKey?: string; userid?: number }> => {
    const userInfo = await userUtils.getUserInfo(useridEmail);

    if (userInfo.error !== ERRORS.OK) return { error: userInfo.error };

    if (accessToken !== userInfo.accesstoken) {
      // The accessToken is incorrect. It could be that a hacker is tring to
      // guess the accessToken, therefore will be only allow 3 attempts.
      if (userInfo.accesstokentries >= 3) {
        // The number of retries has been exceeded so we will reset the access token
        const query =
          "update user set accesstoken = null, accesstokentries = 0 " +
          "where useridemail = ?";
        const params = [useridEmail];
        await sqlUtils.transactionQuery([{ query, params }], true);

        return { error: ERRORS.ACCESSTOKENRETRIESEXCEEDED };
      } else {
        const query =
          "update user set accesstokentries = ? " + "where useridemail = ?";
        const params = [userInfo.accesstokentries + 1, useridEmail];
        await sqlUtils.transactionQuery([{ query, params }], true);

        return { error: ERRORS.BADTOKEN };
      }
    }

    // Generate an accesskey.  This key is used to access the other functions
    // of this accounting application.
    const accessKey: string = uuidv4();
    const query =
      "update user set accesstoken = null, accesskey = ?, lastaccessdate = now(), accesstokentries = 0 " +
      "where useridemail = ?;";
    const params = [accessKey, useridEmail];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.changedRows === 1
      ? { error: ERRORS.OK, accessKey, userid: userInfo.id }
      : { error: ERRORS.UNKNOWN };
  },

  isWorkspaceAdmin: async (userid: number) => {
    const query =
      "select workspaceaccess.* from workspaceaccess, userrole " +
      "where workspaceaccess.userid = ? and workspaceaccess.userroleid = userrole.id " +
      "and userrole.workspaceadmin = true";
    const params = [userid];
    const result = await sqlUtils.transactionQuery([{ query, params }], false);

    return result.length > 0;
  },

  // The user will only be logged out if the auth key matches.
  // Note: the user will automatically be logged out after 30 minutes.
  logout: async (useridEmail: string, authKey: string) => {
    const query =
      "update user set accesskey = null" +
      "where useridemail = ? and accesskey = ?;";
    const params = [useridEmail, authKey];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    // If one row was change then the userid was found.  Otherwise, this
    // is an unknown user.
    return result?.changedRows === 1;
  },

  checkAccess: async (
    authKey: string,
    userId: number
  ): Promise<{ error: ERRORS; userInfo?: UserInfo }> => {
    const response: { error: ERRORS; userInfo?: UserInfo } = {
      error: ERRORS.UNKNOWN,
    };

    response.userInfo = await userUtils.getUserInfoById(userId);
    response.error = response.userInfo.error;

    // Check to see if we have a valid user id
    if (response.error !== ERRORS.OK) return response;

    const lastAccess = response.userInfo.lastaccessdate.getTime();
    const now = new Date().getTime();

    // Check if the last access is more than 30 minutes
    const elapsedTime = now - lastAccess;

    if (elapsedTime > 30 * 60 * 1000) {
      response.error = ERRORS.TIMEOUT;
    } else if (authKey !== response.userInfo.accesskey) {
      response.error = ERRORS.BADAUTHKEY;
    } else {
      response.error = ERRORS.OK;
    }

    return response;
  },

  checkPermissions: async (
    userId: number,
    workspaceId: number,
    permissions: PERMISSIONS[]
  ): Promise<ERRORS> => {
    const userInfo = await userUtils.getUserInfoById(userId);

    // Check permissons
    const query =
      "select userrole.* from workspaceaccess, userrole " +
      "where userid = ? and workspaceid = ? and userrole.id = workspaceaccess.userroleid";
    const params = [userId, workspaceId];
    const result: any[] = await sqlUtils.transactionQuery(
      [{ query, params }],
      false
    );
    const permissionsFound = {};

    result.forEach((roleInfo) => {
      permissions.forEach((permission) => {
        permissionsFound[permission] =
          permissionsFound[permission] === true
            ? true
            : roleInfo[permission] === 1;
      });
    });

    const allRequiredPermissionsFound = permissions.every(
      (permission) => permissionsFound[permission] === true
    );

    return allRequiredPermissionsFound ? ERRORS.OK : ERRORS.NOTPERMITTED;
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

  deleteAllUserAccess: async (userId: number) => {
    const query = "delete from workspaceaccess where userid = ?;";
    const params = [userId];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.affectedRows === 1;
  },
};

export default accessUtils;
