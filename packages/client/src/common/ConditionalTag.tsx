const ConditionalTag = (props: { condition: boolean; children: any }) =>
  props.condition ? props.children : null;

export default ConditionalTag;
