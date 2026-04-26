import { Router, RequestHandler, Express } from 'express';

export abstract class BaseAPI {
    private app: Express;
    private requestHandler: RequestHandler;
    constructor(app: Express) {
        this.app = app;
        this.requestHandler = this.createHandler();
    }

    public getHandler(): RequestHandler {
        return this.requestHandler;
    }

    protected getRouter(): Router {
        return this.requestHandler as Router;
    }

    protected getApp(): Express {
        return this.app;
    }

    protected createHandler(): RequestHandler {
        return Router();
    }
}

export abstract class AsyncInitBaseAPI {
    private app: Express;
    private requestHandler: RequestHandler;
    constructor(app: Express) {
        this.app = app;
    }

    public async init() {
        this.requestHandler = await this.createHandler();
        return this;
    }

    public getHandler(): RequestHandler {
        return this.requestHandler;
    }

    protected getRouter(): Router {
        return this.requestHandler as Router;
    }

    protected getApp(): Express {
        return this.app;
    }

    protected async createHandler(): Promise<RequestHandler> {
        return Router();
    }
}