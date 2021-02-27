import { GameStateEnum, GameErrorTypeEnum, ActionTypeEnum } from './enums'

export type GameStatusInfo = {
    game_id: string;
    state: GameStateEnum,
    player_init_chips: number,
    player_turn_id?: string,
    player_turn_no?: string,
    player_target_id?: string,
    round_result?: boolean,
    rounds: number,
    players_no: { [playerNo: string]: string },
    players: { [playerId: string]: PlayerInfo },
    deck?: Array<string>
}

export type PlayerInfo = {
    player_id: string;
    player_no: string;
    chips: number;
    active: boolean;
    winner?: boolean;
    cards?: Array<string>;
    cards_count: number;
}

export type ErrorInfo = {
    type: GameErrorTypeEnum,
    gameId: string,
    msg?: string
}

export type SocketJoinEventPayload = {
    game_id: string;
}

export type SocketReadyEventPayload = {
    player_init_chips: number
}

export type SocketActionEventPayload = {
    type: ActionTypeEnum
}