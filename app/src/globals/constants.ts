import { GameStatusEnum } from './enums'
import { GameInfo, PlayersInfo } from './types'

export const INIT_GAME_STATE: GameInfo = {
    status: GameStatusEnum.NOT_CONNECTED,
    rounds: 0,
    actions: {}
};

export const INIT_PLAYERS_STATE: PlayersInfo = {};

export const PLAYERS_NO: Array<string> = (() => {
    let playersNo: Array<string> = [];

    for (let noIndex = 1; noIndex <= 4; noIndex++) {
        playersNo.push(noIndex.toString())
    }

    return playersNo;
})();

export const CARDS_FOLDER_DIR: string = `${process.env.CARDS_FOLDER_DIR}`;

export const SHUFFLE_TIMEOUT: number = 1050;