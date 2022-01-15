import MainHeader from "../header/MainHeader";
import { Tabs, Tab, FormLabel } from "carbon-components-react";
import WorkspacesContent from "./WorkspacesContent";
import ConditionalTag from "../common/ConditionalTag";
import useAccessStore from "../store/AccessStore";
import { Redirect } from "react-router-dom";
import { useEffect, useState } from "react";

const Admin = (props: any) => {
  const loadFromSessionStorage = useAccessStore(
    (state) => state.loadFromSessionStorage
  );
  const [afterLoad, setAfterLoad] = useState(false);
  const userid = useAccessStore((state) => state.userid);
  const showPage = userid !== 0 || !afterLoad;

  useEffect(() => {
    loadFromSessionStorage();
    setAfterLoad(true);
    console.log("In Admin page use effect");
  }, [loadFromSessionStorage]);
  console.log("In admin user access is", useAccessStore());

  return (
    <>
      <ConditionalTag condition={!showPage}>
        <Redirect to="/" />
      </ConditionalTag>
      <ConditionalTag condition={showPage}>
        <MainHeader page="admin">
          <FormLabel
            style={{ fontSize: 15, fontWeight: "bold", paddingBottom: 5 }}
          >
            Organization Administrators can mange worspaces, users, roles, and
            permissions on this page.
          </FormLabel>
          <Tabs type="container">
            <Tab id="workspaces" label="Workspaces">
              <WorkspacesContent />
            </Tab>
            <Tab id="users" label="Users">
              <p>Content for Users.</p>
            </Tab>
            <Tab id="Roles" label="Roles">
              <p>Content for Roles.</p>
            </Tab>
            <Tab label="Permissions">
              <p>Content for permisions.</p>
            </Tab>
          </Tabs>
        </MainHeader>
      </ConditionalTag>
    </>
  );
};

export default Admin;
