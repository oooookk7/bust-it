import { GameErrorTypeEnum, GameStateEnum, SocketInEventEnum, SocketOutEventEnum } from '../src/globals/enums';
import { SOCKET_ID, GAME_ID } from './utils/constants';
import { readyHandler } from '../src/handlers/readyHandler';
import { getExecutor } from './utils/utils';
import { ErrorInfo, GameStatusInfo } from '../src/globals/types';

const execute = getExecutor(readyHandler, SocketInEventEnum.READY);


describe('Redis errors', () => {
    test('Regardless of state', async () => {
        let result = await execute({ player_init_chips: 100 }, {
            state: GameStateEnum.INIT,
            players_no: { '1': SOCKET_ID },
            rounds: 0,
            player_init_chips: 0,
            players: {}
        }, true);
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.READY_ERROR];
        let gameInfo: GameStatusInfo = result.sessions.directGet(GAME_ID);

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.READY_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.SERVER_ERROR);
        expect(gameInfo.state).toEqual(GameStateEnum.INIT);
        expect(result.socket.rooms).toContain(GAME_ID);
    });
});

describe('Before game is ready', () => {

    test('When player is in game (first)', async () => {
        let result = await execute({ player_init_chips: 100 }, {
            state: GameStateEnum.INIT,
            players_no: { '1': SOCKET_ID },
            rounds: 0,
            player_init_chips: 0,
            players: {}
        });
        let gameInfo: GameStatusInfo = result.eventResults[SocketOutEventEnum.READIED];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.READIED]);
        expect(gameInfo.state).toEqual(GameStateEnum.READY);
        expect(gameInfo.player_init_chips).toEqual(100);
        expect(result.socket.rooms).toContain(GAME_ID);
    });

    test('When player is not in game (not first)', async () => {
        let result = await execute({ game_id: GAME_ID }, {
            state: GameStateEnum.INIT,
            players_no: { '1': 'rando' },
            rounds: 0,
            player_init_chips: 0,
            players: {}
        });
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.READY_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.READY_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.GAME_DOES_NOT_EXIST);
        expect(result.socket.rooms.size).toEqual(0);
    });

});

describe('After game is ready', () => {
    test('When player requests ready', async () => {
        let result = await execute({ player_init_chips: 100 }, {
            state: GameStateEnum.READY,
            players_no: { '1': SOCKET_ID },
            rounds: 0,
            player_init_chips: 0,
            players: {}
        });
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.READY_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.READY_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.GAME_ALREADY_READY);
        expect(result.socket.rooms).toContain(GAME_ID);
    });
});