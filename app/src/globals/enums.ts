export enum GameSessionStateEnum {
    INIT = 'init',
    READY = 'ready',
    STARTED = 'started',
    ENDED = 'ended'
}

export enum GameStatusEnum {
    NOT_CONNECTED = 'not_connected',
    NOT_JOINED = 'not_joined',
    NOT_READY = 'not_ready',
    READY = 'ready',
    ROUND_START = 'round_start',
    ROUND_RESULT = 'round_result',
    ENDED = 'ended',
    ERROR = 'error'
}

export enum SocketInEventEnum {
    CONNECT = 'connect',
    JOINED = 'joined',
    JOIN_ERROR = 'join_error',
    PLAYER_JOINED = 'player_joined',
    PLAYER_TURN = 'player_turn',
    PLAYER_LEFT = 'player_left',
    DISCONNECT = 'disconnect',
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

export enum SocketOutEventEnum {
    JOIN = 'join',
    JOINED = 'joined',
    READY = 'ready',
    START = 'start',
    ACTION = 'action'
};

export enum ReloadEventEnum {
    RELOAD = 'ui_reload',
    ERROR = 'ui_error'
};

export enum ActionTypeEnum {
    SHUFFLE = 'shuffle',
    DRAW = 'draw',
    NEXT = 'next'
};
