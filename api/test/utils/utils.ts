import { eventNames } from 'cluster';
import { GameErrorTypeEnum, GameStateEnum, SocketInEventEnum, SocketOutEventEnum } from '../../src/globals/enums';
import { GameStatusInfo, PlayerInfo } from '../../src/globals/types';
import { Deck } from '../../src/utils';
import { Socket } from '../../src/socket';
import { Sessions } from '../mocks/sessions';
import { InternalSocket } from '../mocks/socket';
import { SOCKET_ID, GAME_ID } from './constants';


export const getExecutor = (fn: any, eventName: SocketInEventEnum, p2pBroadcast?: boolean): any => {
    return async (payload?: any, prependData?: GameStatusInfo, sessionsError?: boolean) => {
        let socket: InternalSocket = new InternalSocket(SOCKET_ID);
        let sessions: Sessions = new Sessions(sessionsError || false);
        let eventResults: { [eventName: string]: any | { [playerId: string]: any } } = {};

        if (prependData) {
            // Populate the deck cards data.
            let deck: Deck = new Deck(prependData.deck);

            Object.keys(prependData.players_no).forEach((playerNo: string) => {
                let playerId: string = prependData.players_no[playerNo];
                let prePlayerInfo = prependData.players[playerId];
                let playerInfo: PlayerInfo = {
                    player_id: playerId,
                    player_no: playerNo,
                    cards_count: 0,
                    chips: prependData.player_init_chips,
                    active: true,
                    cards: []
                };

                if (prePlayerInfo) {
                    playerInfo.active = prePlayerInfo.active || false;
                    playerInfo.chips = prePlayerInfo.chips || 0;
                    playerInfo.cards = prePlayerInfo.cards || [];
                    playerInfo.cards.forEach((card: string) => deck.drawCard(card));
                }
                else if ([GameStateEnum.STARTED, GameStateEnum.READY].indexOf(prependData.state) > -1) {
                    playerInfo.chips = prependData.player_init_chips;

                    if (prependData.state === GameStateEnum.STARTED) {
                        playerInfo.cards = [];
                        playerInfo.cards.push(deck.drawCard());
                        playerInfo.cards.push(deck.drawCard());
                    }
                }

                playerInfo.cards = playerInfo.cards || [];
                playerInfo.cards_count = playerInfo.cards.length;
                // Since this object is used once, modifying the original object should be fine-ish(??).
                prependData.players[playerId] = playerInfo;
            });

            prependData.game_id = GAME_ID;
            prependData.deck = deck.get();
            sessions.directUpdate(GAME_ID, prependData);

            if (Object.values(prependData.players_no).indexOf(socket.id) > -1) {
                socket.join(GAME_ID);
            }
        }

        Object.values(SocketOutEventEnum).forEach((eventName: SocketOutEventEnum) => {
            socket.onClient(eventName, (broadcastId: string, data: any) => {
                if (p2pBroadcast) {
                    eventResults[eventName] = eventResults[eventName] || {};
                    eventResults[eventName][broadcastId] = data;
                }
                else eventResults[eventName] = data;
            });
        });

        if (eventName === SocketInEventEnum.DISCONNECT) socket.disconnected = true;

        fn(new Socket(socket), sessions);
        socket.emitServer(eventName, payload);
        // Wait for 1.5 seconds which should be enough for all events to be called.
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { eventResults: eventResults, socket: socket, sessions: sessions };
    };
};