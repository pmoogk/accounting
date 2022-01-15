import sqlUtils from "./commonUtils";
import {
  ERRORS,
  GetWorkspacesResponse,
  PERMISSIONS,
} from "shared/dist/src/types";

const workspaceUtils = {
  createWorkspace: async (
    userId: number,
    workspaceName: string,
    workspaceDescription
  ): Promise<number> => {
    const query = "insert into workspace (name, description) values (?, ?);";
    const params = [workspaceName, workspaceDescription];
    const result = await sqlUtils.transactionQuery(
      [{ query, params }],
      true,
      userId
    );

    console.log("create workspace result=", result);

    return result?.affectedRows === 1 ? result?.insertId : 0;
  },

  updateWorkspace: async (
    userId: number,
    workspaceId: number,
    workspaceName: string,
    workspaceDescription
  ): Promise<boolean> => {
    const query = "update workspace set name=?, description=? where id=?;";
    const params = [workspaceName, workspaceDescription, workspaceId];
    const result = await sqlUtils.transactionQuery(
      [{ query, params }],
      true,
      userId
    );

    return result?.affectedRows === 1;
  },

  deleteWorkspace: async (userId: number, workspaceId: number) => {
    const query = "delete from workspace where id = ?;";
    const params = [workspaceId];
    const result = await sqlUtils.transactionQuery(
      [{ query, params }],
      true,
      userId
    );

    return result?.affectedRows === 1;
  },

  getWorkspaceInfo: async (name: string) => {
    const query = "select * from workspace where name = ?;";
    const params = [name];
    const result = (await sqlUtils.transactionQuery(
      [{ query, params }],
      false
    )) as { id: number; name: string; description: string }[];

    return result?.length === 1 ? result[0] : null;
  },

  getWorkspaces: async (
    userid: number,
    isOrgAdmin: boolean
  ): Promise<GetWorkspacesResponse> => {
    const response: GetWorkspacesResponse = { error: ERRORS.UNKNOWN };
    let query = "";
    let params = [];

    if (isOrgAdmin) {
      query = "select * from workspace;";
    } else {
      query =
        "select workspace.* from workspace, workspaceaccess, userrole " +
        "where workspaceaccess.userid = ? and workspaceaccess.workspaceid = workspace.id " +
        "and userrole.id = workspaceaccess.userroleid and userrole.workspaceadmin = true";
      params = [userid];
    }

    response.workspaces = await sqlUtils.transactionQuery(
      [{ query, params }],
      false,
      userid
    );

    return response;
  },
};

export default workspaceUtils;
