import accessUtils from "./sqlUtils/accessUtils";
import sqlUtils from "./sqlUtils/commonUtils";

if (process.argv.length !== 4) {
  console.log(
    "Invalid args:  specific:  node dist/src/setPassword.js userid password"
  );

  process.exit();
}

const [, , userid, password] = process.argv;

const resetPassword = async () => {
  const resetKey = await accessUtils.resetPassword(userid);

  await accessUtils.setPassword(userid, password, resetKey);

  sqlUtils.close();
};

resetPassword();
