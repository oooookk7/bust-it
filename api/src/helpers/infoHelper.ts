import { GameStateEnum, GameErrorTypeEnum } from '../globals/enums';
import { GameStatusInfo, ErrorInfo } from '../globals/types';
import { constructErrorInfo } from '../utils';
import { Sessions } from '../sessions'



export const infoHelper = (sessions: Sessions, gameId: string, shouldExists: boolean = true): Promise<GameStatusInfo | ErrorInfo> => {
    return new Promise((resolve, reject) => {
        // Much more performant if there lots of fields that will be modified at a go and JSON object is not very large too.
        sessions.fetch(gameId).then((gameInfo: any | GameStatusInfo) => {
            if (!gameInfo) {
                if (shouldExists) {
                    return reject(constructErrorInfo(GameErrorTypeEnum.GAME_DOES_NOT_EXIST, gameId, 'Game does not exist'));
                }

                return resolve({
                    game_id: gameId,
                    state: GameStateEnum.INIT,
                    player_init_chips: 0,
                    players_no: {},
                    players: {},
                    rounds: 0,
                    deck: []
                });
            }

            resolve(gameInfo);

        }).catch((error: Error) => {
            reject(constructErrorInfo(GameErrorTypeEnum.SERVER_ERROR, gameId, 'Game fetch error'));
        });
    });
};