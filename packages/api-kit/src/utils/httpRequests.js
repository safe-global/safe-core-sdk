"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRequest = exports.HttpMethod = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["Get"] = "get";
    HttpMethod["Post"] = "post";
    HttpMethod["Delete"] = "delete";
})(HttpMethod = exports.HttpMethod || (exports.HttpMethod = {}));
async function sendRequest({ url, method, body }) {
    const response = await (0, node_fetch_1.default)(url, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    let jsonResponse;
    try {
        jsonResponse = await response.json();
    }
    catch (error) {
        if (!response.ok) {
            throw new Error(response.statusText);
        }
    }
    if (response.ok) {
        return jsonResponse;
    }
    if (jsonResponse.data) {
        throw new Error(jsonResponse.data);
    }
    if (jsonResponse.detail) {
        throw new Error(jsonResponse.detail);
    }
    if (jsonResponse.message) {
        throw new Error(jsonResponse.message);
    }
    if (jsonResponse.nonFieldErrors) {
        throw new Error(jsonResponse.nonFieldErrors);
    }
    if (jsonResponse.delegate) {
        throw new Error(jsonResponse.delegate);
    }
    throw new Error(response.statusText);
}
exports.sendRequest = sendRequest;
//# sourceMappingURL=httpRequests.js.map