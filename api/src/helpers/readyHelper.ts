import { GameStateEnum, GameErrorTypeEnum, } from '../globals/enums'
import { GameStatusInfo, ErrorInfo } from '../globals/types'
import { constructErrorInfo } from '../utils';
import { Sessions } from '../sessions'
import { infoHelper } from './infoHelper'


export const readyHelper = (sessions: Sessions, gameId: string, playerId: string, player_init_chips: number): Promise<GameStatusInfo | ErrorInfo> => {
    return new Promise((resolve, reject) => {
        // Much more performant if there lots of fields that will be modified at a go and JSON object is not very large too.
        infoHelper(sessions, gameId).then((gameInfo: any | GameStatusInfo) => {
            switch (gameInfo.state) {
                case GameStateEnum.INIT:
                    gameInfo.state = GameStateEnum.READY;
                    gameInfo.player_init_chips = player_init_chips;
                    gameInfo.players[playerId].chips = player_init_chips;

                    return sessions.update(gameId, gameInfo).then(() => resolve(gameInfo)).catch((error: Error) => {
                        reject(constructErrorInfo(GameErrorTypeEnum.SERVER_ERROR, gameId, `Game update error`));
                    });

                case GameStateEnum.READY:
                    return reject(constructErrorInfo(GameErrorTypeEnum.GAME_ALREADY_READY, gameId, 'Game is already ready'));
            }

            reject(constructErrorInfo(GameErrorTypeEnum.GAME_INVALID_STATE, gameId, 'Invalid state detected'));

        }).catch((errorInfo: ErrorInfo) => {
            reject(errorInfo);
        });
    });
};
