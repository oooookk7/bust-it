import { GameErrorTypeEnum, GameStateEnum, SocketInEventEnum, SocketOutEventEnum } from '../src/globals/enums';
import { SOCKET_ID, GAME_ID } from './utils/constants';
import { ErrorInfo, GameStatusInfo, PlayerInfo } from '../src/globals/types';
import { startHandler } from '../src/handlers/startHandler';
import { getExecutor } from './utils/utils';
import { Deck } from '../src/utils';

const execute = getExecutor(startHandler, SocketInEventEnum.START);
const executeP2P = getExecutor(startHandler, SocketInEventEnum.START, true);


describe('Redis errors', () => {
    test('Regardless of state', async () => {
        let result = await execute({}, {
            state: GameStateEnum.READY,
            players_no: { '1': SOCKET_ID, '2': 'rando-2', '3': 'rando-3' },
            rounds: 0,
            player_init_chips: 500,
            players: {}
        }, true);
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.START_ERROR];
        let gameInfo: GameStatusInfo = result.sessions.directGet(GAME_ID);

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.START_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.SERVER_ERROR);
        expect(gameInfo.state).toEqual(GameStateEnum.READY);
        expect(result.socket.rooms).toContain(GAME_ID);
    });
});

describe('Before game has started', () => {

    test('When there are enough players (>=2)', async () => {
        let result = await executeP2P({}, {
            state: GameStateEnum.READY,
            players_no: { '1': SOCKET_ID, '2': 'rando-2' },
            rounds: 0,
            player_init_chips: 1000,
            players: {}
        });

        let gameInfos: { [playerId: string]: GameStatusInfo } = result.eventResults[SocketOutEventEnum.STARTED];
        let deckCards = new Set((new Deck()).get());
        let existingCards: Set<string> = new Set([]);

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.STARTED]);
        expect(Object.keys(gameInfos).sort()).toEqual([SOCKET_ID, 'rando-2'].sort());

        Object.keys(gameInfos).forEach((playerId: string) => {
            let gameInfo: GameStatusInfo = gameInfos[playerId];

            expect(gameInfo.state).toEqual(GameStateEnum.STARTED);
            expect(gameInfo.rounds).toEqual(1);
            expect(gameInfo.player_turn_id).toEqual(SOCKET_ID);
            expect(gameInfo.player_turn_no).toEqual('1');

            [SOCKET_ID, 'rando-2'].forEach((_playerId: string) => {
                expect(gameInfo.players[_playerId].chips).toEqual(1000);
                expect(gameInfo.players[_playerId].cards_count).toEqual(2);
            });

            let playerCards: Array<string> = gameInfo.players[playerId].cards || [];

            expect(playerCards.length).toEqual(2);

            playerCards.forEach((card: string) => {
                expect(deckCards).toContain(card);
                expect(existingCards).not.toContain(card);
                existingCards.add(card);
            });
        });
    });

    test('When there are not enough players (<2)', async () => {
        let result = await execute({}, {
            state: GameStateEnum.READY,
            players_no: { '1': SOCKET_ID },
            rounds: 0,
            player_init_chips: 100,
            players: {}
        });
        let errorInfo = result.eventResults[SocketOutEventEnum.START_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.START_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.GAME_NOT_ENOUGH_PLAYERS);
        expect(result.socket.rooms).toContain(GAME_ID);
    });
});

describe('After game has started', () => {
    test('When player requests start', async () => {
        let result = await execute({}, {
            state: GameStateEnum.STARTED,
            players_no: { '1': 'rando', '2': SOCKET_ID },
            rounds: 1,
            player_init_chips: 1000,
            players: {}
        });
        let errorInfo = result.eventResults[SocketOutEventEnum.START_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.START_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.GAME_ALREADY_STARTED);
        expect(result.socket.rooms).toContain(GAME_ID);
    });
});

describe('After game has ended', () => {
    test('When player requests start', async () => {
        let result = await execute({}, {
            state: GameStateEnum.ENDED,
            players_no: { '1': SOCKET_ID, '2': 'rando-2' },
            rounds: 3,
            player_init_chips: 100,
            players: {}
        });
        let errorInfo = result.eventResults[SocketOutEventEnum.START_ERROR];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.START_ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.GAME_INVALID_STATE);
    });
});