import { useEffect, useState } from "react";
import MainHeader from "../header/MainHeader";
import useAccessStore from "../store/AccessStore";
import ConditionalTag from "../common/ConditionalTag";
import { Redirect } from "react-router-dom";

const Ledger = (props: any) => {
  const loadFromSessionStorage = useAccessStore(
    (state) => state.loadFromSessionStorage
  );
  const [afterLoad, setAfterLoad] = useState(false);
  const userid = useAccessStore((state) => state.userid);
  const showPage = userid !== 0 || !afterLoad;

  useEffect(() => {
    loadFromSessionStorage();
    setAfterLoad(true);
    console.log("In Ledger page use effect");
  }, [loadFromSessionStorage]);

  console.log("In ledger");

  return (
    <MainHeader page="ledger">
      <ConditionalTag condition={!showPage}>
        <Redirect to="/" />
      </ConditionalTag>
      <ConditionalTag condition={showPage}>
        Ledger page for accounting.
      </ConditionalTag>
    </MainHeader>
  );
};

export default Ledger;
