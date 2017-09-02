import express = require('express');

declare global {
    namespace Express {
        interface Application {
            ws(path: string, cb: (ws: WebSocket, req: express.Request) => void): void;
        }
    }
}
