import { AuthenticationService, Parse } from 'app/data/services';
import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { EUserLogLevel } from './data/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '@app/data/common-imports';

enum EMessageType {
    LOG = 'LOG',
    WARNING = 'WRN',
    ERROR = 'ERR',
    TRACE = 'TRC',
    EXCEPTION = 'EXC',
    W3BLIB = 'W3BLIB'
}

@Injectable()
export class GlobalLoggingHandler extends ErrorHandler {

    //private storage = new Array<{ type: EMessageType, time: number, msg: string }>();
    private origConsoleLog;
    //private authenticationService: AuthenticationService = null;
    //private http: HttpClient;
    constructor(private injector: Injector) {
        super();
        /*
        this.http = injector.get(HttpClient);
        if (localStorage && localStorage.getItem('msgStorage')) {
            this.storage = JSON.parse(localStorage.getItem('msgStorage'));
        }
        */
        Error.stackTraceLimit = 100;
        this.origConsoleLog = console.log;
        const origConsoleWarn = console.warn;
        const origConsoleError = console.error;
        const origConsoleTrace = console.trace;
        console.log = (msg) => {
            if (msg && msg.special && msg.msg) {
                const special = msg.special;
                msg = msg.msg;
                if (special === 'W3BLIB') {
                    this.handleMessage(EMessageType.W3BLIB, msg);
                }
            }
            this.origConsoleLog(msg);
        };

        console.warn = (msg) => {
            origConsoleWarn(msg);
            this.handleMessage(EMessageType.WARNING, msg);
        };

        console.trace = (msg) => {
            origConsoleTrace(msg);
            const obj = { stack: undefined };
            Error.captureStackTrace(obj);
            this.handleMessage(EMessageType.TRACE, obj.stack);
        };

        console.error = (msg) => {
            origConsoleError(msg);
            this.handleMessage(EMessageType.ERROR, msg);
            console.trace();
        };

        setInterval(() => {
            //this.persistMessages();
        }, 5000);
    }
    handleError(error: Error) {


        this.handleMessage(EMessageType.EXCEPTION, JSON.stringify(error.stack));
        throw error;
    }

    private handleMessage(type: EMessageType, message) {
        let msg = '';
        try {
            msg = (message instanceof Object) ? JSON.stringify(message) : message;
        } catch (e) {
            msg = 'circular issue';
        }
        this.origConsoleLog(msg);
        //this.storage.push({ type: type, time: new Date().getTime(), msg: msg });
/*
        if (localStorage) {
            localStorage.setItem('msgStorage', JSON.stringify(this.storage));
        }
        */
    }
/*
    private persistMessages() {
        if (!this.authenticationService) {
            this.authenticationService = this.injector.get(AuthenticationService);
        }

        if (this.storage.length > 0 && this.authenticationService && this.authenticationService.isInitialized()) {
            const user = this.authenticationService.getAuthenticatedUser();

            if (user) {
                if (this.storage.length > 200) {
                    this.storage = this.storage.slice(this.storage.length - 200);
                    if (localStorage) {
                        localStorage.setItem('msgStorage', JSON.stringify(this.storage));
                    }
                }

                if (user.logLevel === EUserLogLevel.DEFAULT) {
                    this.storage = this.storage.filter(entry => entry.type !== EMessageType.LOG);
                }

                const submittedLines = this.storage.length;
                this.http.post(environment.REST_URL + 'w3alias/logUpdate/0', {
                    data: this.storage.map(entry => {
                        if (entry.type === EMessageType.W3BLIB) {
                            const line = '[LIBSTD]' + entry.msg.replace(/\n/g, '\n[LIBSTD]');
                            return line.substr(0, line.length - '[LIBSTD]'.length);
                        } else {
                            return '[WEB' + entry.type + '][' + new Date(entry.time).toLocaleTimeString('de-DE') + '] ' + entry.msg;
                        }
                    }).join('\r\n')
                }, { responseType: 'text' }).toPromise().then(() => {
                    this.storage = this.storage.slice(submittedLines);
                    if (localStorage) {
                        localStorage.setItem('msgStorage', JSON.stringify(this.storage));
                    }
                });

            }
        }
    }
    */
}
