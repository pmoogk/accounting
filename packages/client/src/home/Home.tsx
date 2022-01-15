import { useEffect, useState } from "react";
import MainHeader from "../header/MainHeader";
import useAccessStore from "../store/AccessStore";
import ConditionalTag from "../common/ConditionalTag";
import { Redirect } from "react-router-dom";

const Home = (props: any) => {
  const loadFromSessionStorage = useAccessStore(
    (state) => state.loadFromSessionStorage
  );
  const [afterLoad, setAfterLoad] = useState(false);
  const userid = useAccessStore((state) => state.userid);
  const showPage = userid !== 0 || !afterLoad;

  console.log("In Home page, showpage=", showPage);
  console.log("session storage=", sessionStorage);

  useEffect(() => {
    loadFromSessionStorage();
    setAfterLoad(true);
    console.log("In Home page use effect");
  }, [loadFromSessionStorage]);

  return (
    <MainHeader page="home">
      <ConditionalTag condition={!showPage}>
        <Redirect to="/" />
      </ConditionalTag>
      <ConditionalTag condition={showPage}>
        Home page for accounting.
      </ConditionalTag>
    </MainHeader>
  );
};

export default Home;
