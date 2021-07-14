import fs from "fs";
import bodyParser from "body-parser";
import https from "https";
import path from "path";
import express from "express";

const app = express();
const port = 8443;

const currentDir = path.resolve(path.dirname(""));
const privateKey = fs.readFileSync(path.join(currentDir,"serverKey.key"), "utf8");
const certificate = fs.readFileSync(path.join(currentDir,"serverCert.crt"), "utf8");
const credentials = { key: privateKey, cert: certificate };

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static(path.join(currentDir, "public")));

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

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log("Server started");
});
