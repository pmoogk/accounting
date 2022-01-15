import sqlUtils from "./commonUtils";

const roleUtils = {
  createRole: async (
    name: string,
    workspaceadmin: boolean,
    readaccess: boolean,
    writeaccess: boolean,
    approver: boolean,
    auditor: boolean
  ) => {
    const query =
      "insert into userrole (name, workspaceadmin, readaccess, writeaccess, approver, auditor) " +
      "values (?, ?, ?, ?, ?, ?);";
    const params = [
      name,
      workspaceadmin,
      readaccess,
      writeaccess,
      approver,
      auditor,
    ];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.affectedRows === 1;
  },

  deleteRole: async (name: string) => {
    const query = "delete from userrole where name = ?;";
    const params = [name];
    const result = await sqlUtils.transactionQuery([{ query, params }], true);

    return result?.affectedRows === 1;
  },

  getRoleInfo: async (name: string) => {
    const query = "select * from userrole where name = ?;";
    const params = [name];
    const result = (await sqlUtils.transactionQuery(
      [{ query, params }],
      false
    )) as any[];

    return result?.length === 1 ? result[0] : null;
  },

  getRoles: async () => {
    const query = "select name from userrole;";
    const params = [];
    const result = await sqlUtils.transactionQuery([{ query, params }], false);

    return result;
  },
};

export default roleUtils;
