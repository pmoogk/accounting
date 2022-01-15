import sqlUtils from "../src/sqlUtils/commonUtils";
import accessUtils from "../src/sqlutils/accessUtils";
import workspaceUtils from "../src/sqlutils/workspaceUtils";
import roleUtils from "../src/sqlutils/roleUtils";
import userUtils from "../src/sqlutils/userUtils";
import { ERRORS, PERMISSIONS } from "shared/src/types";

test("sql tests", async () => {
  try {
    const badResult = await accessUtils.resetPassword("bad@test.com");

    expect(badResult).toBe(null);

    const resetkeyResult = await accessUtils.resetPassword("peter@test.com");

    expect(resetkeyResult !== null).toBe(true);

    const setPasswordBadPassword = await accessUtils.setPassword(
      "peter@test.comxxx",
      "mynewpassword",
      resetkeyResult
    );

    expect(setPasswordBadPassword).toBe(false);

    const setPasswordBadKey = await accessUtils.setPassword(
      "peter@test.com",
      "mynewpassword",
      "badkey"
    );

    expect(setPasswordBadKey).toBe(false);

    const setPasswordResult = await accessUtils.setPassword(
      "peter@test.com",
      "mynewpassword",
      resetkeyResult
    );

    expect(setPasswordResult).toBe(true);

    const accessToken = await accessUtils.getAccessToken(
      "peter@test.com",
      "mynewpassword"
    );

    expect(
      accessToken.error === ERRORS.OK &&
        accessToken.accessToken >= 100000 &&
        accessToken.accessToken <= 999999
    ).toBe(true);

    const accessTokenBaduserid = await accessUtils.getAccessToken(
      "peter",
      "mynewpassword"
    );

    expect(accessTokenBaduserid.error).toBe(ERRORS.UNKNOWNUSER);

    const accessTokenBadpassword = await accessUtils.getAccessToken(
      "peter@test.com",
      "mynewpasswordbad"
    );

    expect(accessTokenBadpassword.error).toBe(ERRORS.BADPASSWORD);

    const accessKeyBadkey = await accessUtils.getAccessKey(
      "test.com",
      accessToken.accessToken
    );

    expect(accessKeyBadkey.error).toBe(ERRORS.UNKNOWNUSER);

    const accessKeyBadtoken = await accessUtils.getAccessKey(
      "peter@test.com",
      999
    );

    expect(accessKeyBadtoken.error).toBe(ERRORS.BADTOKEN);

    const accessKey = await accessUtils.getAccessKey(
      "peter@test.com",
      accessToken.accessToken
    );

    expect(accessKey !== null).toBe(true);

    const newUserInfo = await userUtils.getUserInfo("newuser@test.com");

    if (newUserInfo) {
      await accessUtils.deleteAllUserAccess(newUserInfo.id);
      await userUtils.deleteUser("newuser@test.com");
    }

    const createUserResult = await userUtils.createUser(
      "newuser@test.com",
      "Newfirstname",
      "Newlastname"
    );

    expect(createUserResult).toBe(true);

    const userInfoBad = await userUtils.getUserInfo("badId@hello.com");

    expect(userInfoBad.error).toBe(ERRORS.UNKNOWNUSER);

    const userInfo = await userUtils.getUserInfo("newuser@test.com");

    expect(userInfo.firstname === "Newfirstname").toBe(true);

    await accessUtils.deleteUserAccess(userInfo.id, 1, 3);
    await accessUtils.deleteUserAccess(userInfo.id, 1, 4);

    const workspaceUsersStart = await userUtils.getWorkspaceUsers(1);

    expect(workspaceUsersStart?.length === 1).toBe(true);

    const setUserAccess1 = await accessUtils.addUserAccess(userInfo.id, 1, 3);

    expect(setUserAccess1).toBe(true);

    const setUserAccess2 = await accessUtils.addUserAccess(userInfo.id, 1, 4);

    expect(setUserAccess2).toBe(true);

    const workspaceUsers = await userUtils.getWorkspaceUsers(1);

    expect(workspaceUsers?.length === 3).toBe(true);

    const badWorkspaceUsers = await userUtils.getWorkspaceUsers(2);

    expect(badWorkspaceUsers?.length === 0).toBe(true);

    const roles = await roleUtils.getRoles();

    expect(roles?.length > 0).toBe(true);
  } catch (exc) {
    console.log(exc);
    expect("Exception thrown").toBe("");
  }
});

test("sql2 tests", async () => {
  try {
    // First clean up any data from a previous test
    let newUser2Info = await userUtils.getUserInfo("newuser2@test.com");
    let workspaceAdminInfo = await userUtils.getUserInfo(
      "workspaceadmin@test.com"
    );

    const orgAdminInfo = await userUtils.getUserInfo("orgadmin@test.com");

    if (newUser2Info) {
      await accessUtils.deleteAllUserAccess(newUser2Info.id);
      await userUtils.deleteUser("newuser2@test.com");
    }

    if (workspaceAdminInfo) {
      await accessUtils.deleteAllUserAccess(workspaceAdminInfo.id);
      await userUtils.deleteUser("workspaceadmin@test.com");
    }

    let workspaceInfo = await workspaceUtils.getWorkspaceInfo("newworkspace");

    if (workspaceInfo !== null) {
      await workspaceUtils.deleteWorkspace(orgAdminInfo.id, workspaceInfo.id);
    }

    await roleUtils.deleteRole("readwriterole");
    await roleUtils.deleteRole("workspaceadminrole");

    // Check access.
    let result = await userUtils.createUser(
      "newuser2@test.com",
      "Testfirstname",
      "Testlastname"
    );
    expect(result).toBe(true);

    result = await userUtils.createUser(
      "workspaceadmin@test.com",
      "Workspacefirstname",
      "Workspacelastname"
    );
    expect(result).toBe(true);

    newUser2Info = await userUtils.getUserInfo("newuser2@test.com");
    workspaceAdminInfo = await userUtils.getUserInfo("workspaceadmin@test.com");

    const workspaceId = await workspaceUtils.createWorkspace(
      orgAdminInfo.id,
      "newworkspace",
      "New workspace desc"
    );
    expect(workspaceId).toBeGreaterThan(0);

    result = await roleUtils.createRole(
      "readwriterole",
      false,
      true,
      true,
      false,
      false
    );
    expect(result).toBe(true);

    result = await roleUtils.createRole(
      "workspaceadminrole",
      true,
      false,
      false,
      false,
      false
    );
    expect(result).toBe(true);

    const userInfo = await userUtils.getUserInfo("newuser2@test.com");
    const workspaceUserInfo = await userUtils.getUserInfo(
      "workspaceadmin@test.com"
    );

    workspaceInfo = await workspaceUtils.getWorkspaceInfo("newworkspace");
    const roleInfo = await roleUtils.getRoleInfo("readwriterole");
    const workspaceRoleInfo = await roleUtils.getRoleInfo("workspaceadminrole");

    expect(userInfo?.id).toBeDefined();
    expect(workspaceInfo?.id).toBeDefined();
    expect(roleInfo?.id).toBeDefined();

    // Set the user password.  The result will be a special reset uuid.
    const resetKey: string = await accessUtils.resetPassword(
      "newuser2@test.com"
    );
    expect(resetKey).toBeDefined();

    result = await accessUtils.setPassword(
      "newuser2@test.com",
      "mypassword",
      resetKey
    );

    // Set the user password.  The result will be a special reset uuid.
    const resetKeyWorkspace: string = await accessUtils.resetPassword(
      "workspaceadmin@test.com"
    );
    expect(resetKeyWorkspace).toBeDefined();

    result = await accessUtils.setPassword(
      "workspaceadmin@test.com",
      "myworkspacepassword",
      resetKeyWorkspace
    );

    // Now we will login.
    let accessToken = await accessUtils.getAccessToken(
      "newuser2@test.com",
      "mypassword"
    );
    expect(accessToken.error).toBe(ERRORS.OK);

    let accessKey = await accessUtils.getAccessKey(
      "newuser2@test.com",
      accessToken.accessToken
    );
    expect(accessKey.error).toBe(ERRORS.OK);

    let accessResult = await accessUtils.addUserAccess(
      userInfo.id,
      workspaceInfo.id,
      roleInfo.id
    );
    expect(accessResult).toBe(true);

    accessResult = await accessUtils.addUserAccess(
      workspaceUserInfo.id,
      workspaceInfo.id,
      workspaceRoleInfo.id
    );
    expect(accessResult).toBe(true);

    let isWorkspaceAdmin = await accessUtils.isWorkspaceAdmin(accessKey.userid);
    expect(isWorkspaceAdmin).toBe(false);

    let checkLoggedIn = await accessUtils.checkAccess(
      accessKey.accessKey,
      userInfo.id
    );
    expect(checkLoggedIn.error).toBe(ERRORS.OK);

    checkLoggedIn = await accessUtils.checkAccess(accessKey.accessKey, 50);
    expect(checkLoggedIn.error).toBe(ERRORS.UNKNOWNUSER);

    const checkPermissions = await accessUtils.checkPermissions(
      userInfo.id,
      workspaceInfo.id,
      [PERMISSIONS.readaccess, PERMISSIONS.writeaccess]
    );
    expect(checkPermissions).toBe(ERRORS.OK);

    accessToken = await accessUtils.getAccessToken(
      "workspaceadmin@test.com",
      "myworkspacepassword"
    );
    expect(accessToken.error).toBe(ERRORS.OK);

    accessKey = await accessUtils.getAccessKey(
      "workspaceadmin@test.com",
      accessToken.accessToken
    );
    expect(accessKey.error).toBe(ERRORS.OK);

    isWorkspaceAdmin = await accessUtils.isWorkspaceAdmin(accessKey.userid);
    expect(isWorkspaceAdmin).toBe(true);
  } catch (exc) {
    console.log(exc);
    expect("Exception thrown").toBe("");
  }
});

test("Close connection", async () => {
  sqlUtils.close();
});
