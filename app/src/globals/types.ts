import { GameSessionStateEnum, GameStatusEnum, SocketInEventEnum, ReloadEventEnum } from './enums'

export type GameInfoActions = {
    loading?: boolean;
    shuffling?: boolean;
};

export type GameInfo = {
    id?: string;
    status: GameStatusEnum;
    actions: GameInfoActions;
    rounds: number;
    started?: boolean;
    joined?: boolean;
    playerId?: string;
    playerNo?: string;
    turnPlayerId?: string;
    initChips?: number;
    error?: {
        type?: SocketInEventEnum.ERROR | SocketInEventEnum.JOIN_ERROR | SocketInEventEnum.READY_ERROR | SocketInEventEnum.START_ERROR,
        msg: string
    };
}

export type PlayerInfo = {
    id: string;
    no: string;
    chips: number;
    active?: boolean;
    turn?: boolean;
    winner?: boolean;
    cards: Array<{ show: boolean, value?: string }>
}

export type PlayersInfo = {
    [playerNo: string]: PlayerInfo
}

export type ReducerPayload = {
    type: SocketInEventEnum | ReloadEventEnum,
    gameId?: string;
    playerId?: string;
    actions: GameInfoActions;
    info?: {
        state: GameSessionStateEnum,
        player_init_chips: number,
        player_turn_id?: string,
        player_turn_no?: string,
        player_target_id?: string,
        round_result?: boolean,
        rounds: number,
        players_no: { [playerNo: string]: string },
        players: {
            [playerId: string]: {
                player_id: string;
                player_no: string;
                chips: number;
                active: boolean;
                winner?: boolean;
                cards?: Array<string>;
                cards_count: number;
            }
        },
        deck?: Array<string>
    },
    error?: {
        type: string,
        msg: string
    }
}