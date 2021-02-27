import { RedisClient } from 'redis';
import { GameStatusInfo } from './globals/types'


export class Sessions {
    private client: RedisClient;

    constructor(client: RedisClient | any) {
        this.client = client;
    }

    public fetch(gameId: string): Promise<GameStatusInfo | Error> {
        var self = this;

        return new Promise((resolve, reject) => {
            self.client.get(gameId, (error, result: string | null) => {
                return error ? reject(error) : resolve(result ? JSON.parse(result) : null);
            });
        });
    }

    public update(gameId: string, gameInfo: GameStatusInfo): Promise<true | Error> {
        var self = this;

        return new Promise((resolve, reject) => {
            self.client.set(gameId, JSON.stringify(gameInfo), (error, result) => {
                return error ? reject(error) : resolve(true);
            });
        });
    }

    public remove(gameId: string): Promise<true | Error> {
        var self = this;

        return new Promise((resolve, reject) => {
            self.client.del(gameId, (error, result) => {
                return error ? reject(error) : resolve(true);
            });
        });
    }
};