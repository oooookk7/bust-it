import { GameStateEnum, GameErrorTypeEnum, ActionTypeEnum } from '../globals/enums'
import { INIT_PLAYER_CARDS_COUNT } from '../globals/constants'
import { GameStatusInfo, ErrorInfo } from '../globals/types'
import { Deck, constructErrorInfo } from '../utils';
import { Sessions } from '../sessions'
import { infoHelper } from './infoHelper'


export const startHelper = (sessions: Sessions, gameId: string, playerId: string): Promise<GameStatusInfo | ErrorInfo> => {

    return new Promise((resolve, reject) => {
        // Much more performant if there lots of fields that will be modified at a go and JSON object is not very large too.
        infoHelper(sessions, gameId).then((gameInfo: any | GameStatusInfo) => {
            if (gameInfo.state === GameStateEnum.READY && Object.keys(gameInfo.players_no).length >= 2) {
                gameInfo.state = GameStateEnum.STARTED;
                gameInfo.rounds = 1;
                gameInfo = (new Deck()).init(gameInfo);

                let firstPlayerNo = Object.keys(gameInfo.players_no).sort();
                gameInfo.player_turn_id = gameInfo.players_no[firstPlayerNo[0]];
                gameInfo.player_turn_no = firstPlayerNo[0];

                return sessions.update(gameId, gameInfo).then(() => {
                    resolve(gameInfo)

                }).catch((error: Error) => {
                    reject(constructErrorInfo(GameErrorTypeEnum.SERVER_ERROR, gameId, 'Game update error'));
                });
            }

            else if (Object.keys(gameInfo.players).length < 2) {
                return reject(constructErrorInfo(GameErrorTypeEnum.GAME_NOT_ENOUGH_PLAYERS, gameId, 'Min. players is 2'));
            }

            else if (gameInfo.state === GameStateEnum.STARTED) {
                return reject(constructErrorInfo(GameErrorTypeEnum.GAME_ALREADY_STARTED, gameId, 'Game is already started'));
            }

            reject(constructErrorInfo(GameErrorTypeEnum.GAME_INVALID_STATE, gameId, 'Invalid state detected'));

        }).catch((errorInfo: ErrorInfo) => {
            reject(errorInfo);
        });
    });
};
