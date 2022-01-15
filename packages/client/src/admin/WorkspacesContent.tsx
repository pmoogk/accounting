import MasterDetails, { GetItemLabel } from "../common/MasterDetails";
import useAccessStore from "../store/AccessStore";
import workspaceServices from "../services/WorkspaceServices";
import { useState, useEffect } from "react";
import { IdentityType, Workspace } from "../../../shared/src/types";
import ConditionalTag from "../common/ConditionalTag";
import DataFields, { FieldType, useDataFieldStore } from "../common/DataFields";

const getLabel: GetItemLabel = (workspace: IdentityType) =>
  (workspace as Workspace).name;

const WorkspaceDetails = (props: { item: Workspace | null }) => {
  const workspace = props.item;

  return (
    <>
      <ConditionalTag condition={props.item !== null}>
        <div style={{ margin: 10 }}>
          <div style={{ fontWeight: "bold" }}>
            Workspace details for {workspace?.name}
          </div>
          <br />
          <div>Description: {workspace?.description}</div>
        </div>
      </ConditionalTag>
    </>
  );
};

const WorkspacesContent = (props: any) => {
  const userid = useAccessStore((state) => state.userid);
  const accessKey = useAccessStore((state) => state.accessKey);
  const [items, setItems] = useState<Workspace[]>([]);
  const [selectedItem, setSelectedItem] = useState<Workspace | null>(null);
  const [isDialogValid, setIsDialogValid] = useState(false);
  const setDataFields = useDataFieldStore((state) => state.setFields);

  const initDataFields = (workspace: Workspace | null) => {
    const nameField: FieldType = {
      id: "name",
      kind: "string",
      fieldName: "Name:",
      value: workspace === null ? "" : workspace.name,
    };

    const descriptionField: FieldType = {
      id: "description",
      kind: "string",
      fieldName: "Description:",
      value: workspace === null ? "" : workspace.description,
    };

    setDataFields([nameField, descriptionField]);
  };

  const UpdateDialog = (props: {}) => {
    console.log("Render inner update dialog");
    return (
      <div>
        <DataFields />
      </div>
    );
  };

  const handleUpdate = async (workspace: Workspace | null) => {
    let workspaceId = 0;
    const fields = useDataFieldStore.getState().getFields();

    console.log("Fields for update", fields);
    if (workspace === null) {
      // When workspace is null it means that we are creating a new
      // workspace.
      workspaceId = await workspaceServices.createWorkspace(
        userid,
        accessKey,
        fields.name,
        fields.description
      );
    } else {
      workspaceId = workspace.id;
      await workspaceServices.updateWorkspace(
        userid,
        accessKey,
        workspace.id,
        fields.name,
        fields.description
      );
    }

    // Get the updated list of workspaces.
    const workspacesInfo = await workspaceServices.getWorkspaces(
      userid,
      accessKey
    );

    const newWorkspaces = workspacesInfo.workspaces ?? [];
    const selectedWorkspaceIndex = newWorkspaces.findIndex(
      (workspace) => workspace.id === workspaceId
    );
    setItems(newWorkspaces);
    setSelectedItem(
      selectedWorkspaceIndex === -1
        ? null
        : newWorkspaces[selectedWorkspaceIndex]
    );
  };

  useEffect(() => {
    const loadWorkspaces = async () => {
      console.log("In load workspace.  accesskey=", accessKey);
      if (userid !== 0) {
        const workspacesInfo = await workspaceServices.getWorkspaces(
          userid,
          accessKey
        );

        console.log("Workspaces=", workspacesInfo);
        setItems(workspacesInfo.workspaces ?? []);
      }
    };

    loadWorkspaces();
  }, [userid, accessKey]);

  return (
    <MasterDetails
      items={items}
      getLabel={getLabel}
      details={WorkspaceDetails}
      detailsName="workspace"
      updateDialog={UpdateDialog}
      initDialog={initDataFields}
      handleUpdate={handleUpdate}
      selectedItem={selectedItem}
      setSelectedItem={setSelectedItem}
    />
  );
};

export default WorkspacesContent;
