"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const body_parser_1 = __importDefault(require("body-parser"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const sqlUtils_1 = __importDefault(require("./sqlUtils"));
const types_1 = require("../../shared/src/types");
const app = express_1.default();
const port = 8443;
const jsonParser = body_parser_1.default.json();
const orgAdmins = process.env.ORG_ADMINS.split(",").map((admin) => admin.trim().toLowerCase());
const isOrgAdmin = (emailId) => {
    return orgAdmins.indexOf(emailId.toLowerCase()) !== -1;
};
console.log("Org admins=", orgAdmins);
const currentDir = path_1.default.resolve(path_1.default.dirname(""));
console.log("Current dir=", currentDir);
const privateKey = fs_1.default.readFileSync(path_1.default.join(currentDir, "./certificates/serverKey.key"), "utf8");
const certificate = fs_1.default.readFileSync(path_1.default.join(currentDir, "./certificates/serverCert.crt"), "utf8");
const credentials = { key: privateKey, cert: certificate };
app.use(express_1.default.static(path_1.default.join(currentDir, "public")));
app.post("/login", (req, res) => {
    const { password, userid } = req.body;
    console.log("pass/user", password, userid, req.body);
    res.status(200).json({});
});
app.get("/", (req, res) => {
    const indexFile = path_1.default.join(currentDir, "public", "index.html");
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
app.post("/api/getaccesscode", jsonParser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader("Content-Type", "application/json");
    try {
        const params = req.body;
        const userid = isomorphic_dompurify_1.default.sanitize(params.userid);
        const password = isomorphic_dompurify_1.default.sanitize(params.password);
        const accessToken = yield sqlUtils_1.default.getAccessToken(userid, password);
        if (accessToken === null) {
            res.status(401).json({ error: "Invalid userid or password" });
        }
        else {
            // Email access token to user.
            console.log("Access Token=", accessToken);
            res.status(200).json({ error: types_1.ERRORS.OK });
        }
    }
    catch (exc) {
        console.log(exc);
        res.status(400).json({ error: "Invalid input" });
    }
}));
app.post("/api/getaccesskey", jsonParser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader("Content-Type", "application/json");
    console.log("In get accesskey: body=", req.body);
    try {
        const params = req.body;
        const userid = isomorphic_dompurify_1.default.sanitize(params.userid);
        const accessToken = isomorphic_dompurify_1.default.sanitize(params.accesstoken);
        const response = yield sqlUtils_1.default.getAccessKey(userid, parseInt(accessToken));
        console.log("Access key=", response);
        if (response.error !== types_1.ERRORS.OK) {
            res.status(401).json(response);
        }
        else {
            response.isOrgAdmin = isOrgAdmin(userid);
            // Now find out if this is a workspace admin
            response.isWorkspaceAdmin = yield sqlUtils_1.default.isWorkspaceAdmin(response.userid);
            res.status(200).json(response);
        }
    }
    catch (exc) {
        console.log(exc);
        res.status(400).json({ error: "Invalid input" });
    }
}));
app.post("/api/getpermissions", jsonParser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader("Content-Type", "application/json");
    try {
        const params = req.body;
        const userid = parseInt(isomorphic_dompurify_1.default.sanitize(params.userid));
        const accessKey = isomorphic_dompurify_1.default.sanitize(params.accesskey);
        //TBD
    }
    catch (exc) {
        console.log(exc);
        res.status(400).json({ error: "Invalid input" });
    }
}));
app.post("/api/getworkspaces", jsonParser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader("Content-Type", "application/json");
    try {
        const params = req.body;
        const userid = params.userid;
        const accessKey = isomorphic_dompurify_1.default.sanitize(params.accessKey);
        let response = { error: types_1.ERRORS.UNKNOWN };
        const userInfo = yield sqlUtils_1.default.checkAccess(accessKey, userid);
        response.error = userInfo.error;
        if (userInfo.error !== types_1.ERRORS.OK) {
            res.status(400).json(response);
            return;
        }
        else {
            const orgAdmin = isOrgAdmin(userInfo.userInfo.useridemail);
            const isWorkspaceAdmin = yield sqlUtils_1.default.isWorkspaceAdmin(userid);
            if (orgAdmin || isWorkspaceAdmin) {
                response = yield sqlUtils_1.default.getWorkspaces(userid, orgAdmin);
                response.error = types_1.ERRORS.OK;
                res.status(200).json(response);
            }
            else {
                response.error = types_1.ERRORS.NOTPERMITTED;
                res.status(400).json(response);
            }
        }
    }
    catch (exc) {
        console.log(exc);
        res.status(400).json({ error: "Invalid input" });
    }
}));
app.post("/api/createworkspace", jsonParser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader("Content-Type", "application/json");
    try {
        const params = req.body;
        const userid = params.userid;
        const accessKey = isomorphic_dompurify_1.default.sanitize(params.accessKey);
        const name = isomorphic_dompurify_1.default.sanitize(params.name);
        const description = isomorphic_dompurify_1.default.sanitize(params.description);
        let response = { error: types_1.ERRORS.UNKNOWN };
        const userInfo = yield sqlUtils_1.default.checkAccess(accessKey, userid);
        response.error = userInfo.error;
        if (userInfo.error !== types_1.ERRORS.OK) {
            res.status(400).json(response);
            return;
        }
        else {
            const orgAdmin = isOrgAdmin(userInfo.userInfo.useridemail);
            if (orgAdmin) {
                const newId = yield sqlUtils_1.default.createWorkspace(userid, name, description);
                if (newId !== 0) {
                    response.error = types_1.ERRORS.OK;
                    response.id = newId;
                    res.status(200).json(response);
                }
                else {
                    res.status(400).json(response);
                }
            }
            else {
                response.error = types_1.ERRORS.NOTPERMITTED;
                res.status(400).json(response);
            }
        }
    }
    catch (exc) {
        console.log(exc);
        res.status(400).json({ error: "Invalid input" });
    }
}));
app.post("/api/updateworkspace", jsonParser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader("Content-Type", "application/json");
    try {
        const params = req.body;
        const userId = params.userid;
        const accessKey = isomorphic_dompurify_1.default.sanitize(params.accessKey);
        const workspaceId = params.id;
        const name = isomorphic_dompurify_1.default.sanitize(params.name);
        const description = isomorphic_dompurify_1.default.sanitize(params.description);
        let response = { error: types_1.ERRORS.UNKNOWN };
        const userInfo = yield sqlUtils_1.default.checkAccess(accessKey, userId);
        response.error = userInfo.error;
        if (userInfo.error !== types_1.ERRORS.OK) {
            res.status(400).json(response);
            return;
        }
        else {
            const orgAdmin = isOrgAdmin(userInfo.userInfo.useridemail);
            if (orgAdmin) {
                const isOk = yield sqlUtils_1.default.updateWorkspace(userId, workspaceId, name, description);
                if (isOk) {
                    response.error = types_1.ERRORS.OK;
                    res.status(200).json(response);
                }
                else {
                    response.error = types_1.ERRORS.UNKNOWN;
                    res.status(400).json(response);
                }
            }
            else {
                response.error = types_1.ERRORS.NOTPERMITTED;
                res.status(400).json(response);
            }
        }
    }
    catch (exc) {
        console.log(exc);
        res.status(400).json({ error: "Invalid input" });
    }
}));
process.on("uncaughtException", (err) => {
    sqlUtils_1.default.close();
    console.log(`An error occured! The app is already running.`);
});
const httpsServer = https_1.default.createServer(credentials, app);
// Test that the sql server is up.
const testConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = yield sqlUtils_1.default.getConnection();
        connection.release();
    }
    catch (exc) {
        console.log("Could not connect to the database.  Check your password");
        sqlUtils_1.default.close();
        process.abort();
    }
});
testConnection();
httpsServer.listen(port, () => {
    console.log("Server started");
});
//# sourceMappingURL=server.js.map