import "./App.css";
import Login from "./Login";
import Home from "./home/Home";
import Admin from "./admin/Admin";
import Ledger from "./ledger/Ledger";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

function App() {
  console.log("In app");
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Login />
        </Route>
        <Route exact path="/accounting/Home">
          <Home />
        </Route>
        <Route exact path="/accounting/admin">
          <Admin />
        </Route>
        <Route exact path="/accounting/ledger">
          <Ledger />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
