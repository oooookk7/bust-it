import { GameStateEnum, GameErrorTypeEnum } from '../globals/enums';
import { GameStatusInfo, ErrorInfo } from '../globals/types';
import { Sessions } from '../sessions'
import { constructErrorInfo } from '../utils';
import { infoHelper } from './infoHelper'


export const removeHelper = (sessions: Sessions, gameId: string, inputGameInfo?: GameStatusInfo): Promise<GameStatusInfo | ErrorInfo> => {
    return new Promise((resolve, reject) => {
        let fn = (gameInfo: GameStatusInfo) => {
            sessions.remove(gameId).then(() => {
                gameInfo.state = GameStateEnum.ENDED;
                resolve(gameInfo);

            }).catch((error: any) => {
                reject(constructErrorInfo(GameErrorTypeEnum.SERVER_ERROR, gameId, 'Game delete error'))
            });
        };

        if (inputGameInfo) {
            return fn(inputGameInfo);
        }

        infoHelper(sessions, gameId).then((gameInfo: any | GameStatusInfo) => {
            fn(gameInfo)

        }).catch((errorInfo: ErrorInfo) => {
            reject(errorInfo);
        })
    });
};
