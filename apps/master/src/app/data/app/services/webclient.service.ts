
export class Webclient {
    public static async get(url: string, timeout: number = undefined) {
        console.log("GET: " + url);
        return (await (await fetch(url, this.generateOptions({}, timeout))).json()) as any;
    }

    public static async post(url: string, body: any, timeout: number = undefined, headers = {}) {
        if(!(typeof body === 'string' || body instanceof String)) {
            body = JSON.stringify(body);
            headers['Content-Type'] = 'application/json';
        } else {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        return (await (await fetch(url, this.generateOptions({
            method: "post",
            body: body,
            headers: headers
        }, timeout))).json()) as any;
    }

    private static generateOptions(options:RequestInit = {}, timeout = undefined) {
        if(timeout) {
            Object.assign(options, {  signal: AbortSignal.timeout(timeout) })
        }

        return options;
    }
}