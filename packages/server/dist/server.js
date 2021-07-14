"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const body_parser_1 = __importDefault(require("body-parser"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const port = 8443;
const currentDir = path_1.default.resolve(path_1.default.dirname(""));
const privateKey = fs_1.default.readFileSync(path_1.default.join(currentDir, "serverKey.key"), "utf8");
const certificate = fs_1.default.readFileSync(path_1.default.join(currentDir, "serverCert.crt"), "utf8");
const credentials = { key: privateKey, cert: certificate };
app.use(body_parser_1.default.json({ limit: "50mb" }));
app.use(express_1.default.static(path_1.default.join(currentDir, "public")));
app.post("/api/login", (req, res) => {
    const { password, userid } = req.body;
    console.log("pass/user", password, userid, req.body);
    res.status(200).json({});
});
// app.get("/login", (req, res) => {
//   const indexFile = path.join(currentDir, "public", "index.html");
//   res.sendFile(indexFile);
// });
// app.get("/load", (req, res) => {
//   res.setHeader("Content-Type", "application/json");
//   if (checkAuthorized(req)) {
//     let memberData = JSON.parse(fs.readFileSync("memberdata.json"));
//     let configData = { appTitle, monthlyDues, yearlyDues };
//     let payload = { config: configData, data: memberData };
//     res.status(200).json(payload);
//   } else {
//     res.status(403).json({ unauthorized: true });
//   }
// });
// app.post("/save", (req, res) => {
//   res.setHeader("Content-Type", "application/json");
//   if (checkAuthorized(req)) {
//     console.log("Saving data");
//     fs.writeFileSync("memberdata.json", JSON.stringify(req.body));
//     res.status(200).json({ ok: true });
//   } else {
//     res.status(403).json({ unauthorized: true });
//   }
// });
process.on("uncaughtException", (err) => {
    console.log(`An error occured! The app is already running.`);
});
const httpsServer = https_1.default.createServer(credentials, app);
httpsServer.listen(port, () => {
    console.log("Server started");
});
//# sourceMappingURL=server.js.map