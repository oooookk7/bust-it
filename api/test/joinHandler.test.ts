import { GameErrorTypeEnum, GameStateEnum, SocketInEventEnum, SocketOutEventEnum } from '../src/globals/enums';
import { SOCKET_ID, GAME_ID } from './utils/constants';
import { joinHandler } from '../src/handlers/joinHandler';
import { getExecutor } from './utils/utils';
import { ErrorInfo, GameStatusInfo } from '../src/globals/types';

const execute = getExecutor(joinHandler, SocketInEventEnum.JOIN);


describe('Redis errors', () => {
    test('Regardless of state', async () => {
        let result = await execute({ game_id: GAME_ID }, null, true);
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.JOIN_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.JOIN_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.SERVER_ERROR);
        expect(result.socket.rooms.size).toEqual(0);
    });
});

describe('Before game is ready', () => {

    test('When player is first', async () => {
        let result = await execute({ game_id: GAME_ID });
        let gameInfo: GameStatusInfo = result.eventResults[SocketOutEventEnum.JOINED];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.JOINED]);
        expect(gameInfo.players_no).toEqual({ '1': SOCKET_ID });
        expect(gameInfo.players[SOCKET_ID].cards_count).toEqual(0);
        expect(gameInfo.players[SOCKET_ID].active).toEqual(true);
        expect(result.socket.rooms).toContain(GAME_ID);
        expect(gameInfo.game_id).toEqual(GAME_ID);
    });

    test('When player is not first', async () => {
        let result = await execute({ game_id: GAME_ID }, {
            state: GameStateEnum.INIT,
            players_no: { '1': 'rando' },
            player_init_chips: 0,
            rounds: 0,
            players: {}
        });
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.JOIN_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.JOIN_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.GAME_NOT_READY);
        expect(result.socket.rooms.size).toEqual(0);
    });

    test('When player is already joined', async () => {
        let result = await execute({ game_id: GAME_ID }, {
            state: GameStateEnum.INIT,
            players_no: { '1': SOCKET_ID },
            player_init_chips: 0,
            rounds: 0,
            players: {}
        });
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.JOIN_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.JOIN_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.PLAYER_ALREADY_JOINED);
        expect(result.socket.rooms).toContain(GAME_ID);
    });
});

describe('After game is ready', () => {

    test('When slots are available', async () => {
        let result = await execute({ game_id: GAME_ID }, {
            state: GameStateEnum.READY,
            players_no: { '1': 'rando' },
            player_init_chips: 100,
            rounds: 0,
            players: {}
        });
        let gameInfo: GameStatusInfo = result.eventResults[SocketOutEventEnum.JOINED];

        expect(Object.keys(result.eventResults).sort()).toEqual([SocketOutEventEnum.JOINED, SocketOutEventEnum.PLAYER_JOINED].sort());
        expect(gameInfo.players_no).toEqual({ '1': 'rando', '2': SOCKET_ID });
        expect(gameInfo.players[SOCKET_ID].chips).toEqual(gameInfo.player_init_chips);
        expect(gameInfo.players[SOCKET_ID].active).toEqual(true);
        expect(gameInfo).toEqual(result.eventResults[SocketOutEventEnum.PLAYER_JOINED]);
        expect(result.socket.rooms).toContain(GAME_ID);
        expect(gameInfo.game_id).toEqual(GAME_ID);
    });

    test('When slots are unavailable', async () => {
        let result = await execute({ game_id: GAME_ID }, {
            state: GameStateEnum.READY,
            players_no: { '1': 'rando-1', '2': 'rando-2', '3': 'rando-3', '4': 'rando-4' },
            player_init_chips: 100,
            rounds: 0,
            players: {}
        });
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.JOIN_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.JOIN_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.GAME_FULL);
        expect(result.socket.rooms.size).toEqual(0);
    });

    test('When player is already joined', async () => {
        let result = await execute({ game_id: GAME_ID }, {
            state: GameStateEnum.READY,
            players_no: { '1': 'rando', '2': SOCKET_ID },
            player_init_chips: 0,
            rounds: 0,
            players: {}
        });
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.JOIN_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.JOIN_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.PLAYER_ALREADY_JOINED);
        expect(result.socket.rooms).toContain(GAME_ID);
    });
});

describe('After game has already started', () => {
    test('When player joins', async () => {
        let result = await execute({ game_id: GAME_ID }, {
            state: GameStateEnum.STARTED,
            players_no: { '1': 'rando', '2': 'rando-2' },
            player_init_chips: 100,
            rounds: 1,
            players: {}
        });
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.JOIN_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.JOIN_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.GAME_INVALID_STATE);
        expect(result.socket.rooms.size).toEqual(0);
    });
});