import * as express from 'express';
import * as expressSocket from 'express-ws';
import * as redis from 'redis';
import {Observable} from 'rxjs/Observable';
import {Subscriber} from 'rxjs/Subscriber';
import 'rxjs/add/operator/takeUntil';

interface SensorPayload {
    id: string;
    data: {x: number, y: number, z: number};
    timestamp: number;
}

const redisChannelName = 'sensor_data_temp';
const redisLatestValueKeyName = 'sensor_latest_value';

const app = express();
expressSocket(app);

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.ws('/api/v1/emit', (socket, req) => {
    const close$ = Observable.create(($: Subscriber<void>) => {
        socket.onclose = () => {
            $.next();
            $.complete();
        };
    });

    const message$: Observable<SensorPayload> = Observable.create(($: Subscriber<SensorPayload>) => {
        socket.onmessage = event => {
            try {
                $.next(JSON.parse(event.data));
            } catch (e) {
                console.error(e);
            }
        };
    });

    const redisClient = redis.createClient();

    message$.takeUntil(close$).subscribe(
        message => {
            redisClient.publish(redisChannelName, JSON.stringify(message));
            redisClient.set(redisLatestValueKeyName, JSON.stringify(message));
            console.log(JSON.stringify(message));
        },
        err => console.error(err),
        () => {
            console.log('Socket closed');

            // Kill redis client
            redisClient.quit();
        }
    );
});

app.ws('/api/v1/subscribe', (socket, req) => {
    const close$ = Observable.create(($: Subscriber<void>) => {
        socket.onclose = () => {
            $.next();
            $.complete();
        };
    });

    const data$: Observable<SensorPayload> = Observable.create(($: Subscriber<SensorPayload>) => {
        const redisClient = redis.createClient();

        // Emit latest value
        redisClient.get(redisLatestValueKeyName, (err, reply) => {
            if (err) return;
            try {
                $.next(JSON.parse(reply));
            } catch (e) {
                console.error(e);
            }
        });

        redisClient.on('message', (channel, message) => {
            try {
                $.next(JSON.parse(message));
            } catch (e) {
                console.log(e);
            }
        });

        redisClient.subscribe(redisChannelName);

        return () => {
            redisClient.unsubscribe();
            redisClient.quit();
        };
    });

    data$.takeUntil(close$).subscribe(payload => {
        socket.send(JSON.stringify(payload));
    });
});

app.listen(3000);
