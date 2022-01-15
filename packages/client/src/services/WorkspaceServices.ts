import fetch from "node-fetch";
import {
  BaseResponse,
  GetWorkspacesResponse,
  CreateWorkspaceResponse,
  ERRORS,
} from "shared/dist/src/types";

const workspaceServices = {
  getWorkspaces: async (userid: number, accessKey: string) => {
    const jsonData = JSON.stringify({ userid, accessKey });

    const response = await fetch("/api/getworkspaces", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: jsonData,
    });

    const data: GetWorkspacesResponse = await response.json();

    return data;
  },

  createWorkspace: async (
    userid: number,
    accessKey: string,
    name: string,
    description: string
  ): Promise<number> => {
    const jsonData = JSON.stringify({ userid, accessKey, name, description });

    const response = await fetch("/api/createworkspace", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: jsonData,
    });

    const data: CreateWorkspaceResponse = await response.json();

    return data.id ?? 0;
  },

  updateWorkspace: async (
    userId: number,
    accessKey: string,
    workspaceId: number,
    name: string,
    description: string
  ): Promise<boolean> => {
    const jsonData = JSON.stringify({
      userId,
      accessKey,
      id: workspaceId,
      name,
      description,
    });

    const response = await fetch("/api/updateworkspace", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: jsonData,
    });

    const data: BaseResponse = await response.json();

    return data.error === ERRORS.OK;
  },
};

export default workspaceServices;
