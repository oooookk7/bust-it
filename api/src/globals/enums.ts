export enum SocketInEventEnum {
    JOIN = 'join',
    READY = 'ready',
    START = 'start',
    ACTION = 'action',
    DISCONNECT = 'disconnecting',
    ERROR = 'error'
}

export enum SocketOutEventEnum {
    JOINED = 'joined',
    JOIN_ERROR = 'join_error',
    PLAYER_JOINED = 'player_joined',
    PLAYER_TURN = 'player_turn',
    PLAYER_LEFT = 'player_left',
    READIED = 'readied',
    READY_ERROR = 'ready_error',
    STARTED = 'started',
    START_ERROR = 'start_error',
    ERROR = 'error',
    DRAWN = 'drawn',
    SHUFFLED = 'shuffled',
    RESULT = 'result',
    ENDED = 'ended'
}

export enum GameErrorTypeEnum {
    GAME_ALREADY_STARTED = 'game_already_started',
    GAME_NOT_READY = 'game_not_ready',
    GAME_FULL = 'game_full',
    GAME_DOES_NOT_EXIST = 'game_does_not_exist',
    GAME_NOT_ENOUGH_PLAYERS = 'game_not_enough_players',
    PLAYER_ALREADY_JOINED = 'player_already_joined',
    PLAYER_DISCONNECTED = 'player_disconnected',
    GAME_ALREADY_READY = 'game_already_ready',
    GAME_INVALID_STATE = 'game_invalid_state',
    SERVER_ERROR = 'server_error'
}

export enum GameStateEnum {
    INIT = 'init',
    READY = 'ready',
    STARTED = 'started',
    ENDED = 'ended'
}

export enum ActionTypeEnum {
    SHUFFLE = 'shuffle',
    DRAW = 'draw',
    NEXT = 'next'
}
