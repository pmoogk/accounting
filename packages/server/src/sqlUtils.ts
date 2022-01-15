import mysql from "mysql";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { config } from "dotenv";
import { ERRORS, GetWorkspacesResponse, PERMISSIONS } from "shared/src/types";
import sqlUtils from "./sqlutils/commonUtils";

const oldSqlUtils = {};

export default oldSqlUtils;
