export enum ERRORS {
  "OK" = "Ok",
  "UNKNOWN" = "Unknown error",
  "TIMEOUT" = "User session timed out",
  "UNKNOWNUSER" = "Unknown user",
  "BADPASSWORD" = "Bad password",
  "BADTOKEN" = "Bad token",
  "BADAUTHKEY" = "Bad authorization key",
  "ACCESSTOKENRETRIESEXCEEDED" = "Exceeded the token retry count",
  "NOTPERMITTED" = "Access not permitted",
}

export enum PERMISSIONS {
  "workspaceadmin" = "workspaceadmin",
  "readaccess" = "readaccess",
  "writeaccess" = "writeaccess",
  "approver" = "approver",
  "auditor" = "auditor",
}

export interface BaseResponse {
  error: ERRORS;
}

export interface AccessKeyResponse extends BaseResponse {
  accessKey?: string;
  userid?: number;
  isOrgAdmin?: boolean;
  isWorkspaceAdmin?: boolean;
}

export interface IdentityType {
  id: number;
}

export interface Workspace extends IdentityType {
  name: string;
  description: string;
}

export interface GetWorkspacesResponse extends BaseResponse {
  workspaces?: Workspace[];
}

export interface CreateWorkspaceResponse extends BaseResponse {
  id?: number;
}
