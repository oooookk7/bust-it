import { createStore, applyMiddleware, compose } from "redux";
import { combineReducers } from "redux";
import { playersReducer } from './reducers/playersReducer';
import { gameReducer } from './reducers/gameReducer';
import { INIT_GAME_STATE, INIT_PLAYERS_STATE } from './globals/constants';
import { ReloadEventEnum, SocketInEventEnum } from './globals/enums';
import { drawAction, nextAction, shuffleAction } from './actions/actionAction';
import { joinAction } from './actions/joinAction';
import { readyAction } from './actions/readyAction';
import { startAction } from './actions/startAction';
import thunk from "redux-thunk";

let socket: any = null;

export const store = createStore(
    combineReducers({ players: playersReducer, game: gameReducer }),
    { game: INIT_GAME_STATE, players: INIT_PLAYERS_STATE },
    compose(applyMiddleware(...[thunk]), (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose)
);

export const MapStateToProps = (state: any) => { return state };

export const MapDispatchToProps = (dispatch: any) => {
    return {
        join: (gameId: string) => {
            dispatch({
                type: ReloadEventEnum.RELOAD,
                actions: { loading: true },
                gameId: gameId
            });

            if (!gameId) {
                return dispatch({
                    type: ReloadEventEnum.ERROR,
                    error: { msg: 'Invalid Game ID Provided' }
                });
            }

            socket = joinAction(dispatch, gameId);
        },

        ready: (initChips: string) => {
            dispatch({
                type: ReloadEventEnum.RELOAD,
                actions: { loading: true }
            });

            let input: number = parseInt(initChips, 10);

            if (isNaN(input) || input < 1) {
                return dispatch({
                    type: ReloadEventEnum.ERROR,
                    error: { msg: 'Invalid Init Chips Provided' }
                });
            }

            readyAction(dispatch, socket, input);
        },

        start: () => {
            dispatch({
                type: ReloadEventEnum.RELOAD,
                actions: { loading: true }
            });
            startAction(dispatch, socket);
        },

        draw: () => {
            dispatch({
                type: ReloadEventEnum.RELOAD,
                actions: { loading: true }
            });
            drawAction(dispatch, socket);
        },

        shuffle: () => {
            dispatch({
                type: ReloadEventEnum.RELOAD,
                actions: { loading: true }
            });
            shuffleAction(dispatch, socket);
        },

        next: () => {
            dispatch({
                type: ReloadEventEnum.RELOAD,
                actions: { loading: true }
            });
            nextAction(dispatch, socket);
        },

        reload: () => {
            dispatch({
                type: ReloadEventEnum.RELOAD
            });
        }
    }
};