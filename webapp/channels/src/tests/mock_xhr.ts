// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export function mockXHR() {
    const urls = new WeakMap<XMLHttpRequest, string>();
    const requests: Array<{path: string; xhr: XMLHttpRequest}> = [];
    const open = XMLHttpRequest.prototype.open;
    const openSpy = jest.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(function(this: XMLHttpRequest, method, url, async = true, username, password) {
        open.call(this, method, url, async, username, password);
        urls.set(this, new URL(url, window.location.href).pathname);
    });
    const sendSpy = jest.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(function(this: XMLHttpRequest) {
        requests.push({path: urls.get(this)!, xhr: this});
    });

    return {
        requests,
        respond(path: string, status: number) {
            const xhr = requests.find(({path: requestPath}) => requestPath === path)?.xhr;
            if (!xhr) {
                throw new Error(`No request sent to ${path}`);
            }
            Object.defineProperty(xhr, 'status', {value: status});
            xhr.dispatchEvent(new ProgressEvent('load'));
        },
        restore() {
            sendSpy.mockRestore();
            openSpy.mockRestore();
        },
    };
}
