import { GameStateEnum, SocketInEventEnum, GameErrorTypeEnum, SocketOutEventEnum } from '../src/globals/enums';
import { SOCKET_ID, GAME_ID } from './utils/constants';
import { disconnectHandler } from '../src/handlers/disconnectHandler';
import { getExecutor } from './utils/utils';
import { ErrorInfo, GameStatusInfo, PlayerInfo } from '../src/globals/types';

const execute = getExecutor(disconnectHandler, SocketInEventEnum.DISCONNECT);
const executeP2P = getExecutor(disconnectHandler, SocketInEventEnum.DISCONNECT, true);

describe('Redis errors', () => {
    test('Regardless of state', async () => {
        let result = await execute({}, {
            state: GameStateEnum.STARTED,
            players_no: { '1': SOCKET_ID, '2': 'rando-2' },
            player_init_chips: 500,
            rounds: 1,
            players: {}
        }, true);
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.ERROR];
        let gameInfo: GameStatusInfo = result.sessions.directGet(GAME_ID);

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.SERVER_ERROR);
        expect(gameInfo.state).toEqual(GameStateEnum.STARTED);
        expect(gameInfo.players_no).toEqual({ '1': SOCKET_ID, '2': 'rando-2' });
        expect(gameInfo.game_id).toEqual(GAME_ID);
    });
});

describe('Before game is ready', () => {
    test('When there is only the first player', async () => {
        let result = await execute({}, {
            state: GameStateEnum.INIT,
            players_no: { '1': SOCKET_ID },
            rounds: 0,
            player_init_chips: 0,
            players: {}
        });

        expect(Object.keys(result.eventResults).length).toEqual(0);
        expect(result.sessions.data[GAME_ID]).toBeUndefined();
    });
});

describe('Before game has started', () => {

    test('When there are remaining players', async () => {
        let result = await execute({}, {
            state: GameStateEnum.READY,
            players_no: { '1': SOCKET_ID, '2': 'rando-2', '3': 'rando-3' },
            rounds: 0,
            player_init_chips: 100,
            players: {}
        });
        let gameInfo: GameStatusInfo = result.eventResults[SocketOutEventEnum.PLAYER_LEFT];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.PLAYER_LEFT]);
        expect(gameInfo.state).toEqual(GameStateEnum.READY);
        expect(gameInfo.players_no).toEqual({ '1': 'rando-3', '2': 'rando-2' });
        expect(gameInfo.players[SOCKET_ID]).toBeUndefined();
        expect(gameInfo.players['rando-3'].player_no).toEqual('1');
        expect(gameInfo.game_id).toEqual(GAME_ID);
    });


    test('When there are remaining players of 1', async () => {
        let result = await execute({}, {
            state: GameStateEnum.READY,
            players_no: { '2': 'rando-1', '1': SOCKET_ID },
            rounds: 1,
            player_init_chips: 100,
            players: {}
        });
        let gameInfo: GameStatusInfo = result.eventResults[SocketOutEventEnum.PLAYER_LEFT];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.PLAYER_LEFT]);
        expect(gameInfo.state).toEqual(GameStateEnum.READY);
        expect(gameInfo.players_no).toEqual({ '1': 'rando-1' });
        expect(Object.keys(gameInfo.players).sort()).toEqual(['rando-1'].sort());
        expect(gameInfo.game_id).toEqual(GAME_ID);
    });

    test('When there are no remaining players', async () => {
        let result = await execute({}, {
            state: GameStateEnum.READY,
            players_no: { '1': SOCKET_ID },
            rounds: 0,
            player_init_chips: 100,
            players: {}
        });

        expect(Object.keys(result.eventResults).length).toEqual(0);
        expect(result.sessions.data[GAME_ID]).toBeUndefined();
    });

});

describe('After game has started', () => {

    test('When there are remaining players of more than 1', async () => {
        let playersInfo: { [playerId: string]: PlayerInfo } = {};
        let playerCards: Array<string> = ['club-4', 'heart-4'];
        let playerChips = 20;

        playersInfo[SOCKET_ID] = {
            player_id: SOCKET_ID,
            player_no: '2',
            active: true,
            chips: playerChips,
            cards: Array.from(playerCards),
            cards_count: playerCards.length
        }
        let result = await executeP2P({}, {
            state: GameStateEnum.STARTED,
            players_no: { '1': 'rando-1', '2': SOCKET_ID, '3': 'rando-2' },
            rounds: 1,
            player_init_chips: 100,
            players: playersInfo
        });

        let gameInfos: { [playerId: string]: GameStatusInfo } = result.eventResults[SocketOutEventEnum.PLAYER_LEFT];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.PLAYER_LEFT]);
        expect(Object.keys(gameInfos).sort()).toEqual(['rando-1', 'rando-2'].sort());

        Object.keys(gameInfos).forEach((playerId: string) => {
            let gameInfo: GameStatusInfo = gameInfos[playerId];

            expect(gameInfo.state).toEqual(GameStateEnum.STARTED);
            expect(gameInfo.players_no).toEqual({ '1': 'rando-1', '3': 'rando-2' });
            expect(Object.keys(gameInfo.players).sort()).toEqual(['rando-1', 'rando-2', SOCKET_ID].sort());
            expect(gameInfo.players[SOCKET_ID].active).toEqual(false);
            expect(gameInfo.players[SOCKET_ID].chips).toEqual(playerChips);
            expect(gameInfo.game_id).toEqual(GAME_ID);
        });
    });

    test('When there are remaining players of 1', async () => {
        let playersInfo: { [playerId: string]: PlayerInfo } = {};
        let playerCards: Array<string> = ['club-4', 'heart-3', 'spade-5'];
        let playerChips = 20;

        playersInfo[SOCKET_ID] = {
            player_id: SOCKET_ID,
            player_no: '1',
            active: true,
            chips: playerChips,
            cards: Array.from(playerCards),
            cards_count: playerCards.length
        }
        let result = await execute({}, {
            state: GameStateEnum.STARTED,
            players_no: { '1': SOCKET_ID, '2': 'rando' },
            rounds: 1,
            player_init_chips: 100,
            players: playersInfo
        });

        let gameInfo: GameStatusInfo = result.eventResults[SocketOutEventEnum.ENDED];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.ENDED]);
        expect(gameInfo.state).toEqual(GameStateEnum.ENDED);
        expect(gameInfo.players_no).toEqual({ '2': 'rando' });
        expect(Object.keys(gameInfo.players).sort()).toEqual(['rando', SOCKET_ID].sort());
        expect(gameInfo.players[SOCKET_ID].active).toEqual(false);
        expect(gameInfo.players[SOCKET_ID].winner).toBeUndefined();
        expect(gameInfo.players[SOCKET_ID].chips).toEqual(playerChips);
        expect(gameInfo.players[SOCKET_ID].cards).toEqual(playerCards);
        expect(gameInfo.players['rando'].active).toEqual(true);
        expect(gameInfo.players['rando'].winner).toEqual(true);
        expect(result.sessions.data[GAME_ID]).toBeUndefined();
        expect(gameInfo.game_id).toEqual(GAME_ID);
    });

    test('When there are no remaining players', async () => {
        let result = await execute({}, {
            state: GameStateEnum.READY,
            players_no: { '1': SOCKET_ID },
            player_init_chips: 100,
            rounds: 0,
            players: {}
        });

        expect(Object.keys(result.eventResults).length).toEqual(0);
        expect(result.sessions.data[GAME_ID]).toBeUndefined();
    });

});