import { Server } from 'socket.io';
import { createAdapter } from 'socket.io-redis';
import { RedisClient } from 'redis';
import { Sessions } from './sessions';
import { Socket } from './socket';
import { actionHandler } from './handlers/actionHandler'
import { disconnectHandler } from './handlers/disconnectHandler'
import { joinHandler } from './handlers/joinHandler'
import { readyHandler } from './handlers/readyHandler'
import { startHandler } from './handlers/startHandler'
import { errorHandler } from './handlers/errorHandler'
import { logger } from './utils';

// TODO: Switch to env vars.
const io = new Server(parseInt(process.env.SERVER_PORT || '8080', 10));

const redisClient = new RedisClient({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
});

const sessions = new Sessions(redisClient);

io.adapter(createAdapter({
    pubClient: redisClient.duplicate(),
    subClient: redisClient.duplicate()
}));

io.on('connection', (_socket: any) => {
    let socket: Socket = new Socket(_socket);
    logger.info(`Player "${socket.id}" connected`);

    actionHandler(socket, sessions);
    disconnectHandler(socket, sessions);
    joinHandler(socket, sessions);
    readyHandler(socket, sessions);
    startHandler(socket, sessions);
    errorHandler(socket, sessions);
});

logger.info(`Server starting at :${process.env.SERVER_PORT}`);