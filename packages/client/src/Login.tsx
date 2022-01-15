import { useState } from "react";
import {
  Header,
  HeaderName,
  Content,
  TextInput,
  FormLabel,
  Button,
} from "carbon-components-react";
import styled from "styled-components";
import ConditionalTag from "./common/ConditionalTag";
import loginServices from "./services/LoginServices";
import useAccessStore from "./store/AccessStore";
import { Redirect } from "react-router-dom";

const CenteredBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
`;

const HorizontalBox = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: row;
`;

const MainContainer = styled.div`
  width: 450px;
  height: 200px;
`;

const MarginTop = styled.div`
  margin-top: 10px;
`;

const Login = (props: any) => {
  const [type, setType] = useState("password");
  const [disableCredentials, setDisableCredentials] = useState(false);
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [badLogin, setBadLogin] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [badAccessCode, setBadAccessCode] = useState(false);
  const [gotoAccountingPage, setGotoAccountingPage] = useState(false);
  const setAccess = useAccessStore((state) => state.setAccess);
  const togglePasswordVisibility = () => {
    setType(type === "password" ? "text" : "password");
  };

  const handleGetAccessCode = async () => {
    const loginOk = await loginServices.getAccessCode(userid, password);

    console.log("Login=", loginOk);
    setBadLogin(!loginOk);
    setDisableCredentials(loginOk);
    setShowAccessCode(loginOk);
  };

  const handleLogin = async () => {
    const accessData = await loginServices.getAccessKey(userid, accessCode);

    console.log("Access code", accessCode, accessData);

    if (accessData === null) {
      setBadAccessCode(true);
    } else {
      setAccess(
        accessData.accessKey ?? "",
        accessData.userid ?? 0,
        accessData.isOrgAdmin ?? false,
        accessData.isWorkspaceAdmin ?? false
      );
      setGotoAccountingPage(true);
      console.log("After location ref");
    }
  };

  const handleRetryLogin = () => {
    setDisableCredentials(false);
    setBadAccessCode(false);
    setBadLogin(false);
    setShowAccessCode(false);
  };

  return (
    <>
      <ConditionalTag condition={gotoAccountingPage}>
        <Redirect to="/accounting/home" />
      </ConditionalTag>
      <ConditionalTag condition={!gotoAccountingPage}>
        <Header aria-label="Organization Accounting">
          <HeaderName href="#" prefix="">
            Organization Accounting
          </HeaderName>
        </Header>
        <Content>
          <CenteredBox>
            <MainContainer>
              <FormLabel style={{ fontSize: 16 }}>
                <strong>
                  Enter your login email address and password below.
                </strong>
              </FormLabel>
              <TextInput
                id="userid"
                labelText="Email address"
                value={userid}
                onChange={(evt) => setUserid(evt.target.value)}
                style={{ marginBottom: 10 }}
                disabled={disableCredentials}
              ></TextInput>
              <TextInput.PasswordInput
                type={type}
                style={{ marginBottom: 10 }}
                id="password"
                labelText="Password"
                value={password}
                onChange={(evt) => setPassword(evt.target.value)}
                onTogglePasswordVisibility={togglePasswordVisibility}
                disabled={disableCredentials}
              ></TextInput.PasswordInput>
              <Button
                onClick={handleGetAccessCode}
                disabled={disableCredentials}
              >
                Get Access Code
              </Button>

              <ConditionalTag condition={badLogin}>
                <MarginTop>
                  <p style={{ color: "red" }}>
                    Unable to login with the email and password provided.
                  </p>
                </MarginTop>
              </ConditionalTag>
              <ConditionalTag condition={showAccessCode}>
                <FormLabel style={{ fontSize: 16, marginTop: 10 }}>
                  <strong>
                    A 6 digit access code was sent to your email. Enter this
                    access code below.
                  </strong>
                </FormLabel>
                <TextInput
                  id="accesscode"
                  labelText="Access Code"
                  value={accessCode}
                  onChange={(evt) => setAccessCode(evt.target.value)}
                  style={{ marginBottom: 10 }}
                ></TextInput>
                <HorizontalBox>
                  <Button style={{ marginRight: 10 }} onClick={handleLogin}>
                    Login
                  </Button>
                  <Button onClick={handleRetryLogin}>Retry Login</Button>
                </HorizontalBox>
              </ConditionalTag>
              <ConditionalTag condition={badAccessCode}>
                <MarginTop>
                  <p style={{ color: "red" }}>
                    This is not a valid access code.
                  </p>
                </MarginTop>
              </ConditionalTag>
            </MainContainer>
          </CenteredBox>
        </Content>
      </ConditionalTag>
    </>
  );
};
export default Login;
