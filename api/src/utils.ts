import * as bunyan from 'bunyan';
import { GameStatusInfo, ErrorInfo, PlayerInfo } from './globals/types'
import { GameErrorTypeEnum } from './globals/enums'
import { INIT_PLAYER_CARDS_COUNT, LOG_LEVEL } from './globals/constants'

export class Deck {

    private cards: Array<string>;

    constructor(deckCards?: Array<string>) {
        this.cards = deckCards || this.generate();
    }

    private generate = (): Array<string> => {
        let deckCards: Array<string> = [];

        ['diamond', 'club', 'heart', 'spade'].forEach((cardType) => {
            ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].forEach((cardNo) => {
                deckCards.push(`${cardType}-${cardNo}`);
            });
        });

        return deckCards;
    }

    public shuffle = (): void => {
        let currentIndex: number = this.cards.length;
        let randomIndex: number = -1;
        let tempValue: null | string = null;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            tempValue = this.cards[currentIndex];
            this.cards[currentIndex] = this.cards[randomIndex];
            this.cards[randomIndex] = tempValue;
        }
    }

    public drawCard = (card?: string): string => {
        if (card) {
            return this.cards.splice(this.cards.indexOf(card), 1)[0];
        }

        let index: number = Math.floor(Math.random() * this.cards.length);
        index = index === this.cards.length ? index - 1 : index;
        return this.cards.splice(index, 1)[0];
    }

    public get = (): Array<string> => {
        return this.cards;
    }

    public init = (gameInfo: GameStatusInfo): GameStatusInfo => {
        let self = this;

        // Draw 2 cards for each player
        Object.values(gameInfo.players).forEach((playerInfo: PlayerInfo) => {
            let playerCards: Array<string> = [];

            if (playerInfo.active && playerInfo.chips > 0) {
                while (playerCards.length < INIT_PLAYER_CARDS_COUNT) {
                    playerCards.push(self.drawCard());
                }
            }

            gameInfo.players[playerInfo.player_id].cards_count = playerCards.length;
            gameInfo.players[playerInfo.player_id].cards = playerCards;
        });

        gameInfo.deck = self.get();
        return gameInfo;
    }
}

export const constructErrorInfo = (errorType: GameErrorTypeEnum, gameId: string, msg?: string): ErrorInfo => {
    let errorInfo: ErrorInfo = {
        type: errorType,
        gameId: gameId
    }

    if (msg) errorInfo.msg = msg
    return errorInfo;
};

export const logger = bunyan.createLogger({
    name: 'api',
    level: LOG_LEVEL
});