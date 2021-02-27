import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Player from './components/player/Player';
import Deck from './components/deck/Deck';
import { PLAYERS_NO } from './globals/constants';
import { store } from './store';
import "./styles/main.scss";


ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Deck}></Route>
        <Route path="/:gameId" component={Deck}></Route>
      </Switch>
    </BrowserRouter>
    {PLAYERS_NO.map((playerNo: string) => <Player no={playerNo}></Player>)}
  </Provider>,
  document.getElementById('root')
);
