import React from 'react';
import logo from './logo.svg';
import './App.css';
import Login from "./Login";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

function App() {
  return (
    <Router>
      <Switch> 
                 <Route path="/">
            <Login/>
          </Route>
      </Switch>
    </Router>
  );
}

export default App;
