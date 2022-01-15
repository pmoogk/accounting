import fs from "fs";
import bodyParser from "body-parser";
import https from "https";
import path from "path";
import express from "express";
import DOMPurify from "isomorphic-dompurify";
import sqlUtils from "./sqlUtils/commonUtils";
import accessUtils from "./sqlutils/accessUtils";
import workspaceUtils from "./sqlutils/workspaceUtils";

import {
  BaseResponse,
  CreateWorkspaceResponse,
  AccessKeyResponse,
  GetWorkspacesResponse,
  ERRORS,
} from "../../shared/src/types";

const app = express();
const port = 8443;
const jsonParser = bodyParser.json();

const orgAdmins = process.env.ORG_ADMINS.split(",").map((admin) =>
  admin.trim().toLowerCase()
);

const isOrgAdmin = (emailId: string) => {
  return orgAdmins.indexOf(emailId.toLowerCase()) !== -1;
};

console.log("Org admins=", orgAdmins);

const currentDir = path.resolve(path.dirname(""));
console.log("Current dir=", currentDir);

const privateKey = fs.readFileSync(
  path.join(currentDir, "./certificates/serverKey.key"),
  "utf8"
);
const certificate = fs.readFileSync(
  path.join(currentDir, "./certificates/serverCert.crt"),
  "utf8"
);
const credentials = { key: privateKey, cert: certificate };

app.use(express.static(path.join(currentDir, "public")));

app.post("/login", (req, res) => {
  const { password, userid } = req.body;

  console.log("pass/user", password, userid, req.body);
  res.status(200).json({});
});

app.get("/", (req, res) => {
  const indexFile = path.join(currentDir, "public", "index.html");

  res.sendFile(indexFile);
});

// app.post("/api/getuserinfo", jsonParser, async (req, res) => {
//   res.setHeader("Content-Type", "application/json");
//   const response: UserInfoResponse = { error: ERRORS.UNKNOWN };

//   try {
//     const params = req.body;
//     const userid: number = params.userid;
//     const accessKey: string = DOMPurify.sanitize(params.accessKey);

//     response.error = await sqlUtils.checkAccess(accessKey, userid);

//     if (response.error !== ERRORS.OK) {
//       res.status(400).json(response);
//       return;
//     }

//     const userInfo: UserInfo = await sqlUtils.getUserInfoById(userid);

//     response.isOrgAdmin = orgAdmins.indexOf(userInfo.useridemail) !== -1;
//     res.status(200).json(response);
//   } catch (exc) {
//     console.log(exc);
//     res.status(400).json({ error: "Invalid input" });
//   }
// });

app.post("/api/getaccesscode", jsonParser, async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const params = req.body;
    const userid: string = DOMPurify.sanitize(params.userid);
    const password: string = DOMPurify.sanitize(params.password);

    const accessToken = await accessUtils.getAccessToken(userid, password);

    if (accessToken === null) {
      res.status(401).json({ error: "Invalid userid or password" });
    } else {
      // Email access token to user.
      console.log("Access Token=", accessToken);
      res.status(200).json({ error: ERRORS.OK });
    }
  } catch (exc) {
    console.log(exc);
    res.status(400).json({ error: "Invalid input" });
  }
});

app.post("/api/getaccesskey", jsonParser, async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  console.log("In get accesskey: body=", req.body);

  try {
    const params = req.body;
    const userid: string = DOMPurify.sanitize(params.userid);
    const accessToken: string = DOMPurify.sanitize(params.accesstoken);
    const response: AccessKeyResponse = await accessUtils.getAccessKey(
      userid,
      parseInt(accessToken)
    );

    console.log("Access key=", response);

    if (response.error !== ERRORS.OK) {
      res.status(401).json(response);
    } else {
      response.isOrgAdmin = isOrgAdmin(userid);

      // Now find out if this is a workspace admin
      response.isWorkspaceAdmin = await accessUtils.isWorkspaceAdmin(
        response.userid
      );
      res.status(200).json(response);
    }
  } catch (exc) {
    console.log(exc);
    res.status(400).json({ error: "Invalid input" });
  }
});

app.post("/api/getpermissions", jsonParser, async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const params = req.body;
    const userid: number = parseInt(DOMPurify.sanitize(params.userid));
    const accessKey: string = DOMPurify.sanitize(params.accesskey);
    //TBD
  } catch (exc) {
    console.log(exc);
    res.status(400).json({ error: "Invalid input" });
  }
});

app.post("/api/getworkspaces", jsonParser, async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const params = req.body;
    const userid: number = params.userid;
    const accessKey: string = DOMPurify.sanitize(params.accessKey);
    let response: GetWorkspacesResponse = { error: ERRORS.UNKNOWN };
    const userInfo = await accessUtils.checkAccess(accessKey, userid);

    response.error = userInfo.error;

    if (userInfo.error !== ERRORS.OK) {
      res.status(400).json(response);
      return;
    } else {
      const orgAdmin = isOrgAdmin(userInfo.userInfo.useridemail);
      const isWorkspaceAdmin = await accessUtils.isWorkspaceAdmin(userid);

      if (orgAdmin || isWorkspaceAdmin) {
        response = await workspaceUtils.getWorkspaces(userid, orgAdmin);
        response.error = ERRORS.OK;
        res.status(200).json(response);
      } else {
        response.error = ERRORS.NOTPERMITTED;
        res.status(400).json(response);
      }
    }
  } catch (exc) {
    console.log(exc);
    res.status(400).json({ error: "Invalid input" });
  }
});

app.post("/api/createworkspace", jsonParser, async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const params = req.body;
    const userid: number = params.userid;
    const accessKey: string = DOMPurify.sanitize(params.accessKey);
    const name: string = DOMPurify.sanitize(params.name);
    const description: string = DOMPurify.sanitize(params.description);
    let response: CreateWorkspaceResponse = { error: ERRORS.UNKNOWN };
    const userInfo = await accessUtils.checkAccess(accessKey, userid);

    response.error = userInfo.error;

    if (userInfo.error !== ERRORS.OK) {
      res.status(400).json(response);
      return;
    } else {
      const orgAdmin = isOrgAdmin(userInfo.userInfo.useridemail);

      if (orgAdmin) {
        const newId: number = await workspaceUtils.createWorkspace(
          userid,
          name,
          description
        );

        if (newId !== 0) {
          response.error = ERRORS.OK;
          response.id = newId;
          res.status(200).json(response);
        } else {
          res.status(400).json(response);
        }
      } else {
        response.error = ERRORS.NOTPERMITTED;
        res.status(400).json(response);
      }
    }
  } catch (exc) {
    console.log(exc);
    res.status(400).json({ error: "Invalid input" });
  }
});

app.post("/api/updateworkspace", jsonParser, async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const params = req.body;
    const userId: number = params.userId;
    const accessKey: string = DOMPurify.sanitize(params.accessKey);
    const workspaceId: number = params.id;
    const name: string = DOMPurify.sanitize(params.name);
    const description: string = DOMPurify.sanitize(params.description);
    let response: BaseResponse = { error: ERRORS.UNKNOWN };
    const userInfo = await accessUtils.checkAccess(accessKey, userId);

    response.error = userInfo.error;

    if (userInfo.error !== ERRORS.OK) {
      res.status(400).json(response);
      return;
    } else {
      const orgAdmin = isOrgAdmin(userInfo.userInfo.useridemail);

      if (orgAdmin) {
        const isOk = await workspaceUtils.updateWorkspace(
          userId,
          workspaceId,
          name,
          description
        );

        if (isOk) {
          response.error = ERRORS.OK;
          res.status(200).json(response);
        } else {
          response.error = ERRORS.UNKNOWN;
          res.status(400).json(response);
        }
      } else {
        response.error = ERRORS.NOTPERMITTED;
        res.status(400).json(response);
      }
    }
  } catch (exc) {
    console.log(exc);
    res.status(400).json({ error: "Invalid input" });
  }
});

app.delete("/api/deleteworkspace", jsonParser, async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const params = req.body;
    const userId: number = params.userId;
    const accessKey: string = DOMPurify.sanitize(params.accessKey);
    const workspaceId: number = params.id;
    let response: BaseResponse = { error: ERRORS.UNKNOWN };
    const userInfo = await accessUtils.checkAccess(accessKey, userId);

    response.error = userInfo.error;

    if (userInfo.error !== ERRORS.OK) {
      res.status(400).json(response);
      return;
    } else {
      const orgAdmin = isOrgAdmin(userInfo.userInfo.useridemail);

      if (orgAdmin) {
        const isOk = await workspaceUtils.deleteWorkspace(userId, workspaceId);

        if (isOk) {
          response.error = ERRORS.OK;
          res.status(200).json(response);
        } else {
          response.error = ERRORS.UNKNOWN;
          res.status(400).json(response);
        }
      } else {
        response.error = ERRORS.NOTPERMITTED;
        res.status(400).json(response);
      }
    }
  } catch (exc) {
    console.log(exc);
    res.status(400).json({ error: "Invalid input" });
  }
});

process.on("uncaughtException", (err) => {
  sqlUtils.close();
  console.log(`An error occured! The app is already running.`);
});

const httpsServer = https.createServer(credentials, app);

// Test that the sql server is up.
const testConnection = async () => {
  try {
    const connection = await sqlUtils.getConnection();

    connection.release();
  } catch (exc) {
    console.log("Could not connect to the database.  Check your password");
    sqlUtils.close();
    process.abort();
  }
};

testConnection();

httpsServer.listen(port, () => {
  console.log("Server started");
});
