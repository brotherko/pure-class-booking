import React from 'react';
import { Login } from './components/Login';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import { useAuth } from './hooks/useAuth';
import { Order } from './components/Order';

export const AppRoute = () => {
  const { user }  = useAuth();
  return (
    <Router>
      <Switch>
        <Route path="/">
          {user && <Order /> || <Login />}
        </Route>
      </Switch>
    </Router>
  );
};