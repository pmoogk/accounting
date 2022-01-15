import fetch from "node-fetch";
import { AccessKeyResponse } from "shared/dist/src/types";

const loginServices = {
  getAccessCode: async (userid: string, password: string) => {
    console.log("Login", userid, password);
    const jsonData = JSON.stringify({ userid, password });

    const response = await fetch("/api/getaccesscode", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: jsonData,
    });

    console.log("Response=", response);

    return response.status === 200;
  },

  getAccessKey: async (userid: string, accessCode: string) => {
    const jsonData = JSON.stringify({ userid, accesstoken: accessCode });

    const response = await fetch("/api/getaccesskey", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: jsonData,
    });

    const data: AccessKeyResponse = await response.json();
    console.log("Response key=", data);

    return response.status === 200 ? data : null;
  },
};

export default loginServices;
