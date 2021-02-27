import { GameStatusInfo } from '../../src/globals/types';
import { Sessions as _Sessions } from '../../src/sessions'

export class Sessions extends _Sessions {
    private data: { [gameId: string]: GameStatusInfo };
    private error: Error | null;

    constructor(isError: boolean = false) {
        super({});
        this.error = isError ? Error('Connection Failed') : null;
        this.data = {};
    }

    public fetch(gameId: string): Promise<GameStatusInfo | Error> {
        var self = this;
        return new Promise((resolve, reject) => {
            if (self.error) {
                return reject(self.error);
            }
            resolve(self.data[gameId]);
        });
    }

    public update(gameId: string, gameInfo: GameStatusInfo): Promise<true | Error> {
        var self = this;
        return new Promise((resolve, reject) => {
            if (self.error) {
                return reject(self.error);
            }
            self.directUpdate(gameId, gameInfo);
            resolve(true);
        });
    }

    public remove(gameId: string): Promise<true | Error> {
        var self = this;
        return new Promise((resolve, reject) => {
            if (self.error) {
                return reject(self.error);
            }
            self.directRemove(gameId);
            resolve(true);
        });
    }

    public directGet(gameId: string) {
        return this.data[gameId];
    }

    public directUpdate(gameId: string, data: GameStatusInfo) {
        this.data[gameId] = data;
    }

    public directRemove(gameId: string) {
        delete this.data[gameId];
    }
}