import { GameStateEnum, GameErrorTypeEnum } from '../globals/enums'
import { MAX_USERS_PER_ROOM } from '../globals/constants'
import { GameStatusInfo, PlayerInfo, ErrorInfo } from '../globals/types'
import { constructErrorInfo } from '../utils';
import { Sessions } from '../sessions'
import { infoHelper } from './infoHelper'


export const joinHelper = (sessions: Sessions, gameId: string, playerId: string): Promise<GameStatusInfo | ErrorInfo> => {
    return new Promise((resolve, reject) => {
        infoHelper(sessions, gameId, false).then((gameInfo: any | GameStatusInfo) => {
            if (Object.values(gameInfo.players_no).indexOf(playerId) > -1) {
                return reject(constructErrorInfo(GameErrorTypeEnum.PLAYER_ALREADY_JOINED, gameId, 'Player already joined'));
            }

            switch (gameInfo.state) {
                case GameStateEnum.INIT:
                    if (Object.keys(gameInfo.players_no).length !== 0) {
                        return reject(constructErrorInfo(GameErrorTypeEnum.GAME_NOT_READY, gameId, 'Game not ready to join'));
                    }
                    break;

                case GameStateEnum.READY:
                    if (Object.keys(gameInfo.players_no).length === MAX_USERS_PER_ROOM) {
                        return reject(constructErrorInfo(GameErrorTypeEnum.GAME_FULL, gameId, 'Game is full'));
                    }
                    break;

                default:
                    return reject(constructErrorInfo(GameErrorTypeEnum.GAME_INVALID_STATE, gameId, 'Invalid state detected'));
            }

            // Append new player
            let playerNo: string = (Object.keys(gameInfo.players_no).length + 1).toString();
            let playerInfo: PlayerInfo = {
                player_id: playerId,
                player_no: playerNo,
                chips: gameInfo.player_init_chips,
                active: true,
                cards: [],
                cards_count: 0
            };

            gameInfo.players_no[playerNo] = playerId;
            gameInfo.players[playerId] = playerInfo;

            sessions.update(gameId, gameInfo).then(() => {
                resolve(gameInfo);

            }).catch((error: any) => {
                reject(constructErrorInfo(GameErrorTypeEnum.SERVER_ERROR, gameId, 'Game init error'));
            });

        }).catch((errorInfo: ErrorInfo) => {
            reject(errorInfo);
        });
    });
};
