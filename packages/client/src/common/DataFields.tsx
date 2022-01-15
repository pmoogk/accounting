import { TextInput } from "carbon-components-react";
import React from "react";
import styled from "styled-components";
import create from "zustand";

export interface FieldType {
  id: string;
  kind: "string" | "boolean" | "number";
  fieldName: string;
  value: string;
}

interface FieldContainerType {
  marginBottom: number;
}

const FieldContainer = styled.div`
  margin-bottom: ${(props: FieldContainerType) => props.marginBottom};
`;

const Field = (props: {
  field: FieldType;
  index: number;
  setField: (index: number, value: string) => void;
}) => {
  console.log("In render for field", props.field.fieldName);
  // useEffect(() => {
  //   if (ref?.current && props.index === props.focusIndex) {
  //     ref.current.focus();
  //   }
  // });

  switch (props.field.kind) {
    case "string": {
      const value = props.field.value as unknown as string;

      return (
        <TextInput
          id={`Data${props.field.id}`}
          labelText={props.field.fieldName}
          value={value}
          onChange={(evt) => {
            props.setField(props.index, evt?.target?.value ?? "");
          }}
        />
      );
    }
    case "boolean": {
      return <div></div>;
    }
    case "number": {
      return <div></div>;
    }
    default: {
      return <div></div>;
    }
  }
};

interface StateData {
  fields: FieldType[];

  getFields: () => { [key: string]: string };
  setField: (index: number, value: string) => void;
  setFields: (items: FieldType[]) => void;
}

// Define the data store for this component
export const useDataFieldStore = create<StateData>((set, get) => ({
  fields: [],

  getFields: () => {
    const fields = get().fields;
    const result: { [key: string]: string } = {};

    fields.forEach((field) => {
      result[field.id] = field.value;
    });

    return result;
  },

  setField: (index: number, value: string) => {
    const newFields = [...get().fields];

    newFields[index].value = value;
    set(() => ({ fields: newFields }));
  },

  setFields: (fields: FieldType[]) => {
    set(() => ({
      fields,
    }));
  },
}));

const DataFields = (props: {}) => {
  const fields = useDataFieldStore((state) => state.fields);
  const setField = useDataFieldStore((state) => state.setField);

  return (
    <form autoComplete="off">
      {fields.map((field, index) => {
        return (
          <FieldContainer
            marginBottom={index !== fields.length - 1 ? 15 : 0}
            key={index}
          >
            <Field field={field} index={index} setField={setField} />
          </FieldContainer>
        );
      })}
    </form>
  );
};

export default DataFields;
