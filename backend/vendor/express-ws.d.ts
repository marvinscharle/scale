declare module 'express-ws' {
    import * as core from "express-serve-static-core";

    interface ExpressWsStatic {
        (app: core.Express): any;
    }

    let main: ExpressWsStatic;
    export = main;
}