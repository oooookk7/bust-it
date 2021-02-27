import { ActionTypeEnum, GameErrorTypeEnum, GameStateEnum, SocketInEventEnum, SocketOutEventEnum } from '../src/globals/enums';
import { SOCKET_ID, GAME_ID } from './utils/constants';
import { ErrorInfo, GameStatusInfo, PlayerInfo } from '../src/globals/types';
import { actionHandler } from '../src/handlers/actionHandler';
import { calculateRoundWinnings } from '../src/helpers/actionHelper';
import { getExecutor } from './utils/utils';
import { Deck } from '../src/utils';

const execute = getExecutor(actionHandler, SocketInEventEnum.ACTION);
const executeP2P = getExecutor(actionHandler, SocketInEventEnum.ACTION, true);


describe('Redis errors', () => {
    test('Regardless of state', async () => {
        let result = await execute({ type: ActionTypeEnum.SHUFFLE }, {
            state: GameStateEnum.STARTED,
            players_no: { '1': SOCKET_ID, '2': 'rando-2' },
            rounds: 1,
            player_init_chips: 500,
            players: {}
        }, true);
        let errorInfo: ErrorInfo = result.eventResults[SocketOutEventEnum.ERROR];
        let gameInfo: GameStatusInfo = result.sessions.directGet(GAME_ID);

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.SERVER_ERROR);
        expect(gameInfo.state).toEqual(GameStateEnum.STARTED);
        expect(result.socket.rooms).toContain(GAME_ID);
    });
});

describe('When players request action when not it\'s turn', () => {
    test('Returns error', async () => {
        let result = await execute({ type: ActionTypeEnum.SHUFFLE }, {
            state: GameStateEnum.STARTED,
            player_turn_id: 'rando-2',
            player_turn_no: '2',
            players_no: { '1': SOCKET_ID, '2': 'rando-2' },
            rounds: 1,
            player_init_chips: 1000,
            players: {}
        });

        let errorInfo = result.eventResults[SocketOutEventEnum.ERROR];
        let gameInfo: GameStatusInfo = result.sessions.directGet(GAME_ID);

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.ERROR]);
        expect(errorInfo.type).toEqual(GameErrorTypeEnum.GAME_INVALID_STATE);
        expect(result.socket.rooms).toContain(GAME_ID);
        expect(gameInfo.player_turn_id).toEqual('rando-2');
        expect(gameInfo.player_turn_no).toEqual('2');
    });
});

describe('When player requests shuffle', () => {

    test('Cards are shuffled', async () => {
        let deckCards = (new Deck()).get();
        let playersInfo: { [playerId: string]: PlayerInfo } = {
            'rando-2': {
                'player_id': 'rando-2',
                'player_no': '2',
                'chips': 1500,
                'active': true,
                'cards_count': 2,
                'cards': deckCards.splice(0, 2)
            }
        };

        playersInfo[SOCKET_ID] = {
            'player_id': SOCKET_ID,
            'player_no': '1',
            'chips': 500,
            'active': true,
            'cards_count': 2,
            'cards': deckCards.splice(21, 2)
        };

        let result = await executeP2P({ type: ActionTypeEnum.SHUFFLE }, {
            state: GameStateEnum.STARTED,
            player_turn_id: SOCKET_ID,
            player_turn_no: '1',
            players_no: { '1': SOCKET_ID, '2': 'rando-2' },
            rounds: 1,
            player_init_chips: 1000,
            deck: Array.from(deckCards),
            players: playersInfo
        });

        let gameInfos: { [playerId: string]: GameStatusInfo } = result.eventResults[SocketOutEventEnum.SHUFFLED];
        let gameInfo: GameStatusInfo = result.sessions.directGet(GAME_ID);
        let currentDeckCards: Array<string> = gameInfo.deck || [];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.SHUFFLED]);
        expect(currentDeckCards.length).toEqual(deckCards.length - 4);
        expect(currentDeckCards).not.toEqual(deckCards);

        Object.keys(gameInfos).forEach((playerId: string) => {
            let gameInfo: GameStatusInfo = gameInfos[playerId];

            expect(gameInfo.player_turn_id).toEqual(SOCKET_ID);
            expect(gameInfo.player_turn_no).toEqual('1');

            [SOCKET_ID, 'rando-2'].forEach((_playerId: string) => {
                expect(gameInfo.players[_playerId].cards_count).toEqual(2);
            });
        });
    });

});

describe('When player requests drawing of card', () => {

    test('Card is drawn', async () => {
        let deckCards = (new Deck()).get();
        let result = await executeP2P({ type: ActionTypeEnum.DRAW }, {
            state: GameStateEnum.STARTED,
            player_turn_id: SOCKET_ID,
            player_turn_no: '1',
            players_no: { '1': SOCKET_ID, '2': 'rando-2' },
            rounds: 1,
            player_init_chips: 1000,
            deck: Array.from(deckCards),
            players: {}
        });

        let gameInfos: { [playerId: string]: GameStatusInfo } = result.eventResults[SocketOutEventEnum.DRAWN];
        let gameInfo: GameStatusInfo = result.sessions.directGet(GAME_ID);
        let currentDeckCards: Array<string> = gameInfo.deck || [];
        let currentPlayerCards: Array<string> = [];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.DRAWN]);
        expect(currentDeckCards.length).toEqual(deckCards.length - 5);

        Object.keys(gameInfos).forEach((playerId: string) => {
            let gameInfo: GameStatusInfo = gameInfos[playerId];
            let playerCards: Array<string> = gameInfo.players[playerId].cards || [];

            playerCards.forEach((card: string) => currentPlayerCards.push(card));

            expect(gameInfo.player_turn_id).toEqual(SOCKET_ID);
            expect(gameInfo.player_turn_no).toEqual('1');
            expect(gameInfo.players[SOCKET_ID].cards_count).toEqual(3);
            expect(gameInfo.players['rando-2'].cards_count).toEqual(2);
        });

        expect(new Set(currentDeckCards.concat(currentPlayerCards))).toEqual(new Set(deckCards));
    });
});


describe('When player passes to next turn', () => {

    test.each([
        ['1', '2', { '1': SOCKET_ID, '2': 'rando-2', '3': 'rando-3', '4': 'rando-4' }],
        ['1', '3', { '1': SOCKET_ID, '3': 'rando-3', '4': 'rando-4' }],
        ['2', '4', { '1': 'rando-1', '2': SOCKET_ID, '4': 'rando-4' }],
        ['4', '1', { '1': 'rando-1', '2': 'rando-2', '3': 'rando-3', '4': SOCKET_ID }],
        ['4', '2', { '2': 'rando-2', '3': 'rando-3', '4': SOCKET_ID }],

    ])('Transitions from %s -> %s correctly', async (currentPlayerNo: string, nextPlayerNo: string, playersNo: { [playerNo: string]: string }) => {
        let result = await executeP2P({ type: ActionTypeEnum.NEXT }, {
            state: GameStateEnum.STARTED,
            player_turn_id: SOCKET_ID,
            player_turn_no: currentPlayerNo,
            players_no: playersNo,
            rounds: 1,
            round_result: currentPlayerNo > nextPlayerNo,
            player_init_chips: 1000,
            players: {}
        });
        let gameInfos: { [playerId: string]: GameStatusInfo } = result.eventResults[SocketOutEventEnum.PLAYER_TURN];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.PLAYER_TURN]);

        Object.keys(gameInfos).forEach((playerId: string) => {
            let gameInfo: GameStatusInfo = gameInfos[playerId];

            expect(gameInfo.rounds).toEqual(currentPlayerNo > nextPlayerNo ? 2 : 1);
            expect(gameInfo.player_turn_id).toEqual(playersNo[nextPlayerNo]);
            expect(gameInfo.player_turn_no).toEqual(nextPlayerNo);
        });
    });

    test.each([
        ['4', { '1': 'rando-1', '2': 'rando-2', '3': 'rando-3', '4': SOCKET_ID }],
        ['2', { '1': 'rando-1', '2': SOCKET_ID }],
        ['3', { '2': 'rando-1', '3': SOCKET_ID }]
    ])('Displays results from %s -> %s correctly', async (currentPlayerNo: string, playersNo: { [playerNo: string]: string }) => {
        let result = await execute({ type: ActionTypeEnum.NEXT }, {
            state: GameStateEnum.STARTED,
            player_turn_id: SOCKET_ID,
            player_turn_no: currentPlayerNo,
            players_no: playersNo,
            rounds: 1,
            player_init_chips: 1000,
            players: {}
        });
        let gameInfo: GameStatusInfo = result.eventResults[SocketOutEventEnum.RESULT];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.RESULT]);
        expect(gameInfo.rounds).toEqual(1);
        expect(gameInfo.player_turn_id).toEqual(playersNo[currentPlayerNo]);
        expect(gameInfo.player_turn_no).toEqual(currentPlayerNo);
        expect(gameInfo.round_result).toEqual(true);
    });

    test('Resets correctly on new round', async () => {
        let playersInfo: { [playerId: string]: any } = {
            'rando-1': { 'cards': ['spade-10', 'club-2', 'heart-4', 'club-J'], 'chips': 0, 'active': true },
            'rando-2': { 'cards': ['spade-7', 'club-2', 'heart-4', 'club-J'], 'chips': 50, 'active': false },
            'rando-3': { 'cards': ['club-4', 'hearts-5'], 'chips': 100, 'active': true }
        };
        playersInfo[SOCKET_ID] = { 'player_id': SOCKET_ID, 'player_no': '4', 'chips': 2, 'active': true, 'cards_count': 2, 'cards': ['diamond-K', 'spade-A'] };

        let result = await executeP2P({ type: ActionTypeEnum.NEXT }, {
            state: GameStateEnum.STARTED,
            round_result: true,
            player_turn_id: SOCKET_ID,
            player_turn_no: '4',
            players_no: { '1': 'rando-1', '2': 'rando-2', '3': 'rando-3', '4': SOCKET_ID },
            rounds: 1,
            player_init_chips: 1000,
            players: playersInfo
        });
        let gameInfos: { [playerId: string]: GameStatusInfo } = result.eventResults[SocketOutEventEnum.PLAYER_TURN];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.PLAYER_TURN]);

        Object.keys(gameInfos).forEach((playerId: string) => {
            let gameInfo: GameStatusInfo = gameInfos[playerId];

            expect(gameInfo.rounds).toEqual(2);
            expect(gameInfo.round_result).toBeUndefined();
            expect(gameInfo.player_turn_id).toEqual('rando-3');
            expect(gameInfo.player_turn_no).toEqual('3');

            Object.values(gameInfo.players).forEach((playerInfo: PlayerInfo) => {
                let cardsSize = playerInfo.active && playerInfo.chips > 0 ? 2 : 0;

                expect(playerInfo.cards_count).toEqual(cardsSize);

                if (playerId === playerInfo.player_id) {
                    expect((new Set(playerInfo.cards)).size).toEqual(cardsSize);
                }
            });
        });
    });


    test('When all active players\' chips have not been exhausted', async () => {
        let playersInfo: { [playerId: string]: PlayerInfo } = {
            'rando-1': { 'player_id': 'rando-1', 'player_no': '1', 'chips': 2, 'active': true, 'cards_count': 2, 'cards': ['spade-4', 'spade-5'] },
            'rando-2': { 'player_id': 'rando-2', 'player_no': '2', 'chips': 0, 'active': true, 'cards_count': 2, 'cards': ['heart-A', 'diamond-K'] },
            'rando-3': { 'player_id': 'rando-3', 'player_no': '3', 'chips': 3, 'active': false, 'cards_count': 2, 'cards': ['club-A', 'club-K'] }
        };

        playersInfo[SOCKET_ID] = { 'player_id': SOCKET_ID, 'player_no': '4', 'chips': 2, 'active': true, 'cards_count': 2, 'cards': ['diamond-K', 'spade-A'] };

        let result = await execute({ type: ActionTypeEnum.NEXT }, {
            state: GameStateEnum.STARTED,
            player_turn_id: SOCKET_ID,
            player_turn_no: '4',
            players_no: { '1': 'rando-1', '2': 'rando-2', '4': SOCKET_ID },
            rounds: 2,
            player_init_chips: 3,
            players: playersInfo
        });
        let gameInfo: GameStatusInfo = result.eventResults[SocketOutEventEnum.RESULT];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.RESULT]);
        expect(gameInfo.state).toEqual(GameStateEnum.STARTED);
        expect(gameInfo.rounds).toEqual(2);
        expect(gameInfo.round_result).toEqual(true);
        expect(gameInfo.player_turn_id).toEqual(SOCKET_ID);
        expect(gameInfo.player_turn_no).toEqual('4');
        expect(gameInfo.players['rando-1'].chips).toEqual(1);
        expect(gameInfo.players['rando-2'].chips).toEqual(0);
        expect(gameInfo.players['rando-3'].chips).toEqual(3);
        expect(gameInfo.players[SOCKET_ID].chips).toEqual(5);

        ['rando-1', 'rando-2', 'rando-3', SOCKET_ID].forEach((playerId: string) => {
            expect((gameInfo.players[playerId].cards || []).length).toEqual(gameInfo.players[playerId].cards_count);
        });
    });

    test('When all active players\' chips have been exhausted', async () => {
        let playersInfo: { [playerId: string]: PlayerInfo } = {
            'rando-1': { 'player_id': 'rando-1', 'player_no': '1', 'chips': 1, 'active': true, 'cards_count': 2, 'cards': ['spade-4', 'spade-5'] },
            'rando-2': { 'player_id': 'rando-2', 'player_no': '2', 'chips': 0, 'active': true, 'cards_count': 2, 'cards': ['heart-A', 'diamond-K'] },
            'rando-3': { 'player_id': 'rando-3', 'player_no': '3', 'chips': 3, 'active': false, 'cards_count': 2, 'cards': ['club-A', 'club-K'] }
        };

        playersInfo[SOCKET_ID] = { 'player_id': SOCKET_ID, 'player_no': '4', 'chips': 2, 'active': true, 'cards_count': 2, 'cards': ['diamond-K', 'spade-A'] };

        let result = await execute({ type: ActionTypeEnum.NEXT }, {
            state: GameStateEnum.STARTED,
            player_turn_id: SOCKET_ID,
            player_turn_no: '4',
            players_no: { '1': 'rando-1', '2': 'rando-2', '4': SOCKET_ID },
            player_init_chips: 3,
            players: playersInfo
        });

        let gameInfo: GameStatusInfo = result.eventResults[SocketOutEventEnum.ENDED];

        expect(Object.keys(result.eventResults)).toEqual([SocketOutEventEnum.ENDED]);
        expect(gameInfo.state).toEqual(GameStateEnum.ENDED);
        expect(gameInfo.player_turn_id).toEqual(SOCKET_ID);
        expect(gameInfo.player_turn_no).toEqual('4');
        expect(gameInfo.players['rando-1'].chips).toEqual(0);
        expect(gameInfo.players['rando-2'].chips).toEqual(0);
        expect(gameInfo.players['rando-3'].chips).toEqual(3);
        expect(gameInfo.players[SOCKET_ID].chips).toEqual(5);
        expect(gameInfo.players['rando-1'].winner).toBeUndefined();
        expect(gameInfo.players['rando-2'].winner).toBeUndefined();
        expect(gameInfo.players['rando-3'].winner).toBeUndefined();
        expect(gameInfo.players[SOCKET_ID].winner).toEqual(true);

        ['rando-1', 'rando-2', 'rando-3', SOCKET_ID].forEach((playerId: string) => {
            expect((gameInfo.players[playerId].cards || []).length).toEqual(gameInfo.players[playerId].cards_count);
        });
    });
});


describe('Calculate winnings', () => {

    test.each([
        ['1 winner where 21 exact', {
            '1': [['diamond-2', 'spade-9', 'club-K'], 2, 6],
            '2': [['club-3'], 1, 0],
            '3': [['heart-4'], 3, 2]
        }],
        ['1 winner where 21 exact (A=1)', {
            '1': [['diamond-A', 'club-K', 'spade-Q'], 2, 6],
            '2': [['club-6', 'spade-Q', 'diamond-4'], 1, 0],
            '3': [['heart-7'], 3, 2]
        }],
        ['1 winner where 21 exact (A=11)', {
            '1': [['diamond-A', 'heart-J'], 2, 6],
            '2': [['spade-6', 'diamond-J', 'club-4'], 1, 0],
            '3': [['heart-5'], 3, 2]
        }],
        ['1 winner where 21 close', {
            '1': [['spade-6', 'diamond-J', 'club-4'], 2, 5],
            '2': [['club-9', 'spade-J'], 1, 0],
            '3': [['heart-5'], 3, 2]
        }],
        ['2 winners where 21 exact', {
            '1': [['diamond-2', 'spade-9', 'club-K'], 2, 4],
            '2': [['heart-A', 'spade-10'], 1, 3],
            '3': [['heart-4', 'diamond-J', 'club-6'], 5, 4]
        }],
        ['2 winners where 21 close', {
            '1': [['spade-A', 'diamond-9', 'club-K'], 2, 3],
            '2': [['spade-9', 'club-9', 'heart-2'], 1, 2],
            '3': [['club-3', 'heart-6'], 5, 4]
        }],
        ['All winners where 21 exact', {
            '1': [['diamond-K', 'heart-A'], 1, 3],
            '2': [['club-K', 'spade-A'], 2, 4],
            '3': [['heart-K', 'diamond-A'], 3, 5]
        }],
        ['All winners where 21 close', {
            '1': [['diamond-K', 'heart-Q'], 1, 2],
            '2': [['club-K', 'spade-K'], 2, 3],
            '3': [['heart-K', 'diamond-J'], 3, 4]
        }],
        ['No winners', {
            '1': [['diamond-K', 'heart-J', 'club-Q'], 1, 1],
            '2': [['club-K', 'spade-J', 'heart-Q'], 2, 2],
            '3': [['heart-K', 'diamond-J', 'spade-Q'], 3, 3]
        }]

    ])('%s', async (_msg: string, cards: { [playerNo: string]: any }) => {
        let initGameInfo: GameStatusInfo = {
            game_id: GAME_ID,
            state: GameStateEnum.STARTED,
            player_init_chips: 2,
            players_no: {},
            rounds: 1,
            players: {}
        };

        Object.keys(cards).forEach((playerNo: string) => {
            let playerId: string = `rando-${playerNo}`;
            let playerSettings: [Array<string>, number, number] = cards[playerNo];

            initGameInfo.players_no[playerNo] = playerId;
            initGameInfo.players[playerId] = {
                player_id: playerId,
                player_no: playerNo,
                active: true,
                cards_count: playerSettings[0].length,
                chips: playerSettings[1],
                cards: playerSettings[0]
            };
        });

        let gameInfo: GameStatusInfo = calculateRoundWinnings(initGameInfo);

        expect(gameInfo.players['rando-1'].chips).toEqual(cards['1'][2]);
        expect(gameInfo.players['rando-2'].chips).toEqual(cards['2'][2]);
        expect(gameInfo.players['rando-3'].chips).toEqual(cards['3'][2]);
    });

    test('Ensures that inactive or empty chips gets ignored', async () => {
        let gameInfo: GameStatusInfo = calculateRoundWinnings({
            game_id: GAME_ID,
            state: GameStateEnum.STARTED,
            player_init_chips: 2,
            players_no: { '1': 'rando-1', '2': 'rando-2', '4': 'rando-4' },
            rounds: 1,
            players: {
                'rando-1': { player_id: 'rando-1', player_no: '1', active: true, cards_count: 3, chips: 1, cards: ['diamond-K', 'heart-J', 'club-Q'] },
                'rando-2': { player_id: 'rando-2', player_no: '2', active: true, cards_count: 3, chips: 2, cards: ['club-K', 'spade-J', 'heart-Q'] },
                'rando-3': { player_id: 'rando-3', player_no: '3', active: false, cards_count: 3, chips: 3, cards: ['diamond-2', 'spade-9', 'club-K'] },
                'rando-4': { player_id: 'rando-4', player_no: '4', active: true, cards_count: 2, chips: 0, cards: ['diamond-A', 'heart-J'] },
            }
        });

        expect(gameInfo.players['rando-1'].chips).toEqual(1);
        expect(gameInfo.players['rando-2'].chips).toEqual(2);
        expect(gameInfo.players['rando-3'].chips).toEqual(3);
        expect(gameInfo.players['rando-4'].chips).toEqual(0);
    });

});