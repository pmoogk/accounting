import sqlUtils, { AccessType } from "../src/sqlUtils";

test("sql tests", async () => {
  const badResult = await sqlUtils.resetPassword("bad@test.com");

  expect(badResult).toBe(null);

  const resetkeyResult = await sqlUtils.resetPassword("peter@test.com");

  expect(resetkeyResult !== null).toBe(true);

  const setPasswordBadPassword = await sqlUtils.setPassword(
    "peter@test.comxxx",
    "mynewpassword",
    resetkeyResult
  );

  expect(setPasswordBadPassword).toBe(false);

  const setPasswordBadKey = await sqlUtils.setPassword(
    "peter@test.com",
    "mynewpassword",
    "badkey"
  );

  expect(setPasswordBadKey).toBe(false);

  const setPasswordResult = await sqlUtils.setPassword(
    "peter@test.com",
    "mynewpassword",
    resetkeyResult
  );

  expect(setPasswordResult).toBe(true);

  const accessToken = await sqlUtils.getAccessToken(
    "peter@test.com",
    "mynewpassword"
  );

  expect(accessToken >= 100000 && accessToken <= 999999).toBe(true);

  const accessTokenBaduserid = await sqlUtils.getAccessToken(
    "peter",
    "mynewpassword"
  );

  expect(accessTokenBaduserid).toBe(null);

  const accessTokenBadpassword = await sqlUtils.getAccessToken(
    "peter@test.com",
    "mynewpasswordbad"
  );

  expect(accessTokenBadpassword).toBe(null);

  const accessKeyBadkey = await sqlUtils.getAccessKey("test.com", accessToken);

  expect(accessKeyBadkey).toBe(null);

  const accessKeyBadtoken = await sqlUtils.getAccessKey("peter@test.com", 999);

  expect(accessKeyBadtoken).toBe(null);

  const accessKey = await sqlUtils.getAccessKey("peter@test.com", accessToken);

  expect(accessKey !== null).toBe(true);

  await sqlUtils.deleteUser("newuser@test.com");

  const createUserResult = await sqlUtils.createUser(
    "newuser@test.com",
    "Newfirstname",
    "Newlastname"
  );

  expect(createUserResult).toBe(true);

  const userInfoBad = await sqlUtils.getUserInfo("badId@hello.com");

  expect(userInfoBad).toBe(null);

  const userInfo = await sqlUtils.getUserInfo("newuser@test.com");

  expect(userInfo.firstname === "Newfirstname").toBe(true);

  const setUserAccess1 = await sqlUtils.addUserAccess(1, 1, 3);

  expect(setUserAccess1).toBe(true);

  const setUserAccess2 = await sqlUtils.addUserAccess(1, 1, 4);

  expect(setUserAccess2).toBe(true);

  const workspaceUsers = await sqlUtils.getWorkspaceUsers(1);

  expect(workspaceUsers?.length === 2).toBe(true);

  const badWorkspaceUsers = await sqlUtils.getWorkspaceUsers(2);

  expect(badWorkspaceUsers?.length === 0).toBe(true);

  const userAccess: AccessType = await sqlUtils.getUserAccess(1, 1);

  expect(userAccess !== null).toBe(true);
  expect(userAccess.orgadmin).toBe(false);
  expect(userAccess.workspaceadmin).toBe(false);
  expect(userAccess.writeaccess).toBe(true);
  expect(userAccess.approver).toBe(true);
  expect(userAccess.auditor).toBe(false);

  const removeUser1 = await sqlUtils.deleteUserAccess(1, 1, 4);

  expect(removeUser1).toBe(true);

  const userAccess2: AccessType = await sqlUtils.getUserAccess(1, 1);

  expect(userAccess2 !== null).toBe(true);
  expect(userAccess2.orgadmin).toBe(false);
  expect(userAccess2.workspaceadmin).toBe(false);
  expect(userAccess2.writeaccess).toBe(true);
  expect(userAccess2.approver).toBe(false);
  expect(userAccess2.auditor).toBe(false);

  const removeUser2 = await sqlUtils.deleteUserAccess(1, 1, 3);

  expect(removeUser2).toBe(true);

  const userAccess3: AccessType = await sqlUtils.getUserAccess(1, 1);

  expect(userAccess3).toBe(null);

  const roles = await sqlUtils.getRoles();

  expect(roles?.length > 0).toBe(true);
  sqlUtils.close();
});
