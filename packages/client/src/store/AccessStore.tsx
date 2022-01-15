import create from "zustand";

interface StateData {
  accessKey: string;
  userid: number;
  isOrgAdmin: boolean;
  isWorkspaceAdmin: boolean;
  setAccess: (
    accessKey: string,
    userid: number,
    isOrgAdmin: boolean,
    isWorkspaceAdmin: boolean
  ) => void;
  saveToSessionStorage: (
    accessKey: string,
    userid: number,
    isOrgAdmin: boolean,
    isWorkspaceAdmin: boolean
  ) => void;
  loadFromSessionStorage: () => void;
  invalidateSession: () => void;
}
const useAccessStore = create<StateData>((set, get) => ({
  accessKey: "",
  userid: 0,
  isOrgAdmin: false,
  isWorkspaceAdmin: false,

  setAccess: (
    accessKey: string,
    userid: number,
    isOrgAdmin: boolean,
    isWorkspaceAdmin: boolean
  ) => {
    get().saveToSessionStorage(accessKey, userid, isOrgAdmin, isWorkspaceAdmin);
    set({ accessKey, userid, isOrgAdmin, isWorkspaceAdmin });
  },

  saveToSessionStorage: (
    accessKey: string,
    userid: number,
    isOrgAdmin: boolean,
    isWorkspaceAdmin: boolean
  ) => {
    console.log("In save session, userid =", userid, userid + "");
    sessionStorage.setItem("accessKey", accessKey);
    sessionStorage.setItem("userid", userid + "");
    sessionStorage.setItem("isOrgAdmin", isOrgAdmin ? "true" : "false");
    sessionStorage.setItem(
      "isWorkspaceAdmin",
      isWorkspaceAdmin ? "true" : "false"
    );
  },

  loadFromSessionStorage: () => {
    const accessKey = sessionStorage.getItem("accessKey") ?? "";
    const userid = parseInt(sessionStorage.getItem("userid") ?? "0");
    const isOrgAdmin = sessionStorage.getItem("isOrgAdmin") === "true";
    const isWorkspaceAdmin =
      sessionStorage.getItem("isWorkspaceAdmin") === "true";

    set({ accessKey, userid, isOrgAdmin, isWorkspaceAdmin });
  },

  invalidateSession: () => {
    get().setAccess("", 0, false, false);
  },
}));

export default useAccessStore;
