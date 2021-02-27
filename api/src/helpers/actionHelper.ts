import { GameStateEnum, GameErrorTypeEnum, ActionTypeEnum } from '../globals/enums'
import { GameStatusInfo, ErrorInfo, PlayerInfo } from '../globals/types'
import { constructErrorInfo, Deck } from '../utils';
import { Sessions } from '../sessions'
import { infoHelper } from './infoHelper'
import { removeHelper } from './removeHelper'
import { print } from 'redis';


export const calculateRoundWinnings = (gameInfo: GameStatusInfo) => {
    let playerIds: Array<string> = Object.values(gameInfo.players_no).filter((playerId: string) => {
        let playerInfo: PlayerInfo = gameInfo.players[playerId];
        return playerInfo.active && playerInfo.chips > 0;
    });
    let winningPlayerIds: Array<string> = [];
    let variances: { [value: string]: Array<string> } = {};

    playerIds.forEach((playerId: string) => {
        let playerInfo: PlayerInfo = gameInfo.players[playerId];
        let aceAs11 = 0, aceAs1 = 0;
        let cards: Array<string> = playerInfo.cards || [];

        cards.forEach((card: string) => {
            let cardValue: string = card.split('-')[1];

            if (['K', 'Q', 'J'].indexOf(cardValue) > -1) {
                aceAs1 += 10;
                aceAs11 += 10;
            }
            else if (cardValue === 'A') {
                aceAs1 += 1;
                aceAs11 += 11;
            }
            else {
                aceAs1 += parseInt(cardValue, 10);
                aceAs11 += parseInt(cardValue, 10);
            }
        });

        let aceAs11Diff = 21 - aceAs11, aceAs1Diff = 21 - aceAs1;

        if (aceAs11Diff === 0 || aceAs1Diff === 0) {
            winningPlayerIds.push(playerId);
        }
        else {
            let diffs = [aceAs11Diff, aceAs1Diff].sort();
            let value = diffs[0] < 0 ? diffs[1] : diffs[0];

            if (value > 0) {
                variances[value.toString()] = variances[value.toString()] || [];
                variances[value.toString()].push(playerId);
            }
        }
    });

    // Perfect 21 gets 2 chips extra instead of 1, If there's only 1 winner, for each losing player, they earn a chip.
    let winningChips: number = winningPlayerIds.length > 0 ? 2 : 1;

    if (winningPlayerIds.length === 0 && Object.keys(variances).length > 0) {
        winningPlayerIds = variances[Object.keys(variances).sort()[0]];
    }

    // If there are winners, do something.
    if (winningPlayerIds.length >= 1) {
        playerIds.forEach((playerId: string) => {
            if (winningPlayerIds.indexOf(playerId) === -1) {
                gameInfo.players[playerId].chips -= 1;

                if (winningPlayerIds.length === 1) {
                    gameInfo.players[winningPlayerIds[0]].chips += 1;
                }
            }
            else {
                gameInfo.players[playerId].chips += winningChips;
            }
        });
    }

    return gameInfo;
};


export const actionHelper = (sessions: Sessions, gameId: string, playerId: string, actionType: ActionTypeEnum): Promise<GameStatusInfo | ErrorInfo> => {
    return new Promise((resolve, reject) => {
        // Much more performant if there lots of fields that will be modified at a go and JSON object is not very large too.
        infoHelper(sessions, gameId).then((gameInfo: any | GameStatusInfo) => {
            if (gameInfo.state != GameStateEnum.STARTED) {
                return reject(constructErrorInfo(GameErrorTypeEnum.GAME_INVALID_STATE, gameId, 'Invalid state detected'));
            }

            else if (gameInfo.round_result ? Object.values(gameInfo.players_no).indexOf(playerId) === -1 : playerId !== gameInfo.player_turn_id) {
                return reject(constructErrorInfo(GameErrorTypeEnum.GAME_INVALID_STATE, gameId, 'Invalid player ID turn'));
            }

            let deck: Deck = new Deck(gameInfo.deck);

            switch (actionType) {
                case ActionTypeEnum.SHUFFLE:
                    deck.shuffle();
                    gameInfo.deck = deck.get();
                    break;

                case ActionTypeEnum.DRAW:
                    gameInfo.players[playerId].cards.push(deck.drawCard());
                    gameInfo.players[playerId].cards_count += 1;
                    gameInfo.deck = deck.get();
                    break;

                case ActionTypeEnum.NEXT:
                    let playerNos: Array<string> = Object.keys(gameInfo.players_no).filter((playerNo: string) => {
                        let _playerId: string = gameInfo.players_no[playerNo];
                        let playerInfo: PlayerInfo = gameInfo.players[_playerId];
                        return playerInfo.active && playerInfo.chips > 0;
                    }).sort();

                    // Check if all players have been exhausted
                    if (gameInfo.player_turn_no === playerNos[playerNos.length - 1]) {
                        if (!gameInfo.round_result) {
                            // Calculate the winnings.
                            gameInfo = calculateRoundWinnings(gameInfo);
                            gameInfo.round_result = true;

                            let availablePlayerIds: Array<string> = [];

                            Object.values(gameInfo.players).forEach((playerInfo: any | PlayerInfo) => {
                                if (playerInfo.active && playerInfo.chips > 0) {
                                    availablePlayerIds.push(playerInfo.player_id);
                                }
                            });

                            if (availablePlayerIds.length == 1) {
                                gameInfo.players[availablePlayerIds[0]].winner = true;

                                return removeHelper(sessions, gameId, gameInfo).then((newGameInfo: any | GameStatusInfo) => {
                                    resolve(newGameInfo);

                                }).catch((errorInfo: ErrorInfo) => {
                                    reject(errorInfo);
                                });
                            }
                        }
                        else {
                            // Select the first user
                            let playerFirstTurnNo: string = playerNos[0];
                            gameInfo.player_turn_no = playerFirstTurnNo;
                            gameInfo.rounds += 1;
                            gameInfo.player_turn_id = gameInfo.players_no[playerFirstTurnNo];
                            delete gameInfo.round_result;
                            gameInfo = (new Deck()).init(gameInfo);
                        }
                    }
                    else {
                        // Select the next user
                        let playerTurnNo: string = playerNos[playerNos.indexOf(gameInfo.player_turn_no) + 1];
                        gameInfo.player_turn_no = playerTurnNo;
                        gameInfo.player_turn_id = gameInfo.players_no[playerTurnNo];
                    }
                    break;
            }

            sessions.update(gameId, gameInfo).then(() => {
                resolve(gameInfo);

            }).catch((error: Error) => {
                reject(constructErrorInfo(GameErrorTypeEnum.SERVER_ERROR, gameId, 'Game update error'));
            });

        }).catch((errorInfo: ErrorInfo) => {
            reject(errorInfo);
        });
    });
};
