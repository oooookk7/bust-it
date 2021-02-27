import { GameErrorTypeEnum, GameStateEnum } from '../globals/enums'
import { GameStatusInfo, PlayerInfo, ErrorInfo } from '../globals/types'
import { constructErrorInfo } from '../utils';
import { Sessions } from '../sessions'
import { infoHelper } from './infoHelper'
import { removeHelper } from './removeHelper'


export const leaveHelper = (sessions: Sessions, gameId: string, playerId: string, inputGameInfo?: GameStatusInfo): Promise<GameStatusInfo | ErrorInfo> => {
    return new Promise((resolve, reject) => {
        let fn = (gameInfo: GameStatusInfo) => {
            // Remove the player
            let playerNo: string = gameInfo.players[playerId].player_no;
            let lastPlayerNo: string = Object.keys(gameInfo.players_no).length.toString();

            gameInfo.players[playerId].active = false;

            if ((gameInfo.state === GameStateEnum.INIT) ||
                (gameInfo.state === GameStateEnum.READY && Object.keys(gameInfo.players_no).length === 1) ||
                (gameInfo.state === GameStateEnum.STARTED && Object.keys(gameInfo.players_no).length <= 2)) {
                return removeHelper(sessions, gameId, gameInfo).then((newGameInfo: any | GameStatusInfo) => {
                    // Make the existing user the winner and broadcast the "winnings" first.
                    // Player will disconnect on their end.
                    delete gameInfo.players_no[playerNo];

                    if (Object.keys(gameInfo.players_no).length > 0) {
                        Object.keys(gameInfo.players).forEach((playerId: string) => {
                            if (newGameInfo.players[playerId].active) {
                                newGameInfo.players[playerId].winner = true;
                            }
                        });
                    }

                    resolve(newGameInfo);

                }).catch((errorInfo: ErrorInfo) => {
                    reject(errorInfo);
                });
            }

            if (gameInfo.state === GameStateEnum.READY && lastPlayerNo !== playerNo) {
                let lastPlayerId: string = gameInfo.players_no[lastPlayerNo];

                gameInfo.players_no[playerNo] = lastPlayerId;
                gameInfo.players[lastPlayerId].player_no = playerNo;
                delete gameInfo.players_no[lastPlayerNo];
            }

            else {
                delete gameInfo.players_no[playerNo];
            }

            if (gameInfo.state === GameStateEnum.READY) {
                delete gameInfo.players[playerId];
            }


            sessions.update(gameId, gameInfo).then(() => {
                resolve(gameInfo);

            }).catch((error: any) => {
                reject(constructErrorInfo(GameErrorTypeEnum.SERVER_ERROR, gameId, 'Game update error'))
            });
        };

        if (inputGameInfo) {
            return fn(inputGameInfo)
        }

        infoHelper(sessions, gameId).then((gameInfo: any | GameStatusInfo) => {
            fn(gameInfo);

        }).catch((errorInfo: ErrorInfo) => {
            reject(errorInfo);
        });
    });
};
