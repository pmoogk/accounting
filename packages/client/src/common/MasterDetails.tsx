import { Search, Button } from "carbon-components-react";
import { FunctionComponent, useState } from "react";
import styled from "styled-components";
import { IdentityType } from "../../../shared/src/types";
import { AddAlt32 } from "@carbon/icons-react";
import { Modal } from "carbon-components-react";
import ConditionalTag from "./ConditionalTag";
import { useDataFieldStore } from "./DataFields";

export interface GetItemLabel {
  <T extends IdentityType>(item: T): string;
}

const MasterDetailsContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: 70vh;
`;

const SearchListContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: solid black 1px;
  width: 250px;
`;

const DetailsContainer = styled.div`
  border-style: solid;
  border-color: black;
  border-width: 1px 1px 1px 0;
  width: 100%;
  overflow-y: auto;
`;

const InnerDetailsContainer = styled.div`
  overflow: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const ItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const IconContainer = styled.div`
  margin: 5px;
  cursor: pointer;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`;

interface ItemContainerType {
  isSelected: boolean;
  isOdd: boolean;
  children: any;
}

const ItemContainer = styled.div<ItemContainerType>`
  padding-left: 4px;
  padding-right: 4px;
  padding-top: 0;
  background-color: ${(props: ItemContainerType) =>
    props.isSelected ? "lightblue" : props.isOdd ? "lightgrey" : "white"};
  line-height: 28px;
  whitespace: nowrap;
`;

const DetailsButtonContainer = styled.div`
  margin: 20px;
`;

const UpdateDialog = <T extends IdentityType>(props: {
  isOpen: boolean;
  itemName: string;
  dialogItem: T | null;
  updateInnerComp: FunctionComponent<{}>;
  close: () => void;
  handleUpdate: (item: T | null) => void;
}) => {
  const isCreate = props.dialogItem === null;
  const createOrUpdateText = isCreate ? "Create" : "Update";
  const UpdateInnerComp = props.updateInnerComp;
  //const validator = useDataFieldStore((state) => state.validator);
  const fields = useDataFieldStore((state) => state.fields);
  const isDialogValid = fields.every((field) => field.value !== "");

  console.log("Render udpate dialog");
  return (
    <Modal
      open={props.isOpen}
      modalHeading={`${createOrUpdateText} a ${props.itemName}`}
      modalLabel=""
      primaryButtonText={isCreate ? "Create" : "Update"}
      primaryButtonDisabled={!isDialogValid}
      secondaryButtonText="Cancel"
      onRequestClose={() => props.close()}
      onRequestSubmit={() => {
        props.close();
        props.handleUpdate(props.dialogItem);
      }}
    >
      <UpdateInnerComp />
    </Modal>
  );
};

const Item = <T extends IdentityType>(props: {
  item: T;
  odd: boolean;
  selectedItem: T | null;
  setSelectedItem: (item: T | null) => void;
  getLabel: GetItemLabel;
}) => {
  const isSelected = props.selectedItem?.id === props.item.id;
  const label = props.getLabel(props.item);

  return (
    <ItemContainer
      onClick={() => props.setSelectedItem(props.item)}
      isSelected={isSelected}
      isOdd={props.odd}
    >
      {label}
    </ItemContainer>
  );
};

const ListContainer = <T extends IdentityType>(props: {
  items: T[];
  selectedItem: T | null;
  setSelectedItem: (item: T | null) => void;
  getLabel: GetItemLabel;
}) => {
  return (
    <ItemsContainer>
      {props.items.map((item, index) => (
        <Item
          odd={index % 2 === 1}
          item={item}
          key={item.id}
          selectedItem={props.selectedItem}
          setSelectedItem={props.setSelectedItem}
          getLabel={props.getLabel}
        />
      ))}
    </ItemsContainer>
  );
};

const MasterDetails = <T extends IdentityType>(props: {
  items: T[];
  getLabel: GetItemLabel;
  details: FunctionComponent<{ item: T | null }>;
  detailsName: string;
  updateDialog: FunctionComponent<{}>;
  initDialog: (item: T | null) => void;
  handleUpdate: (item: T | null) => void;
  selectedItem: T | null;
  setSelectedItem: (item: T | null) => void;
}) => {
  const [filter, setFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogItem, setDialogItem] = useState<T | null>(null);
  const createTooltip = `Create a ${props.detailsName}`;

  const filterChanged = (evt: any) => {
    let value = evt.target.value;

    setFilter(value ? value : "");
  };

  const doesItemMatch = (item: IdentityType) => {
    if (filter === "") return true;

    const label = props.getLabel(item);
    const filterLowerCase = filter.toLowerCase();
    const itemLowerCase = label.toLowerCase();

    return itemLowerCase.indexOf(filterLowerCase) !== -1;
  };

  const RenderDetails = props.details;
  const filteredItems = props.items.filter((item) => doesItemMatch(item));
  filteredItems.sort((a, b) => {
    const aLabel = props.getLabel(a).toLowerCase();
    const bLabel = props.getLabel(b).toLowerCase();

    return aLabel.localeCompare(bLabel);
  });

  return (
    <>
      <MasterDetailsContainer>
        <SearchListContainer>
          <Search
            labelText=""
            placeholder="Filter names"
            onChange={filterChanged}
          />
          <ListContainer
            items={filteredItems}
            selectedItem={props.selectedItem}
            setSelectedItem={props.setSelectedItem}
            getLabel={props.getLabel}
          ></ListContainer>
        </SearchListContainer>

        <DetailsContainer>
          <ConditionalTag condition={props.selectedItem === null}>
            <div style={{ margin: 10 }}>No {props.detailsName} selected.</div>
          </ConditionalTag>
          <ConditionalTag condition={props.selectedItem !== null}>
            <InnerDetailsContainer>
              <RenderDetails item={props.selectedItem} />
              <ButtonContainer>
                <DetailsButtonContainer>
                  <Button
                    onClick={() => {
                      props.initDialog(props.selectedItem);
                      setDialogItem(props.selectedItem);
                      setDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </DetailsButtonContainer>
                <DetailsButtonContainer>
                  <Button>Delete</Button>
                </DetailsButtonContainer>
              </ButtonContainer>
            </InnerDetailsContainer>
          </ConditionalTag>
        </DetailsContainer>

        <IconContainer
          onClick={() => {
            props.initDialog(null);
            setDialogItem(null);
            setDialogOpen(true);
          }}
          title={createTooltip}
        >
          <AddAlt32 />
        </IconContainer>
      </MasterDetailsContainer>
      <UpdateDialog
        isOpen={dialogOpen}
        dialogItem={dialogItem}
        itemName={props.detailsName}
        close={() => setDialogOpen(false)}
        updateInnerComp={props.updateDialog}
        handleUpdate={props.handleUpdate}
      />
    </>
  );
};

export default MasterDetails;
