"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStore = void 0;
const scripts_1 = __importDefault(require("./scripts"));
/**
 * Converts a string/number to a number.
 *
 * @param input {string | number | undefined} - The input to convert to a number.
 *
 * @return {number} - The parsed integer.
 * @throws {Error} - Thrown if the string does not contain a valid number.
 */
const toInt = (input) => {
    if (typeof input === 'number')
        return input;
    return Number.parseInt((input !== null && input !== void 0 ? input : '').toString(), 10);
};
/**
 * Parses the response from the script.
 *
 * Note that the responses returned by the `get` and `increment` scripts are
 * the same, so this function can be used with both.
 */
const parseScriptResponse = (results) => {
    if (!Array.isArray(results))
        throw new TypeError('Expected result to be array of values');
    if (results.length !== 2)
        throw new Error(`Expected 2 replies, got ${results.length}`);
    const totalHits = results[0] === false ? 0 : toInt(results[0]);
    const timeToExpire = toInt(results[1]);
    const resetTime = new Date(Date.now() + timeToExpire);
    return { totalHits, resetTime };
};
/**
 * A `Store` for the `express-rate-limit` package that stores hit counts in
 * Redis.
 */
class RedisStore {
    /**
     * @constructor for `RedisStore`.
     *
     * @param options {Options} - The configuration options for the store.
     */
    constructor(options) {
        var _a, _b;
        this.sendCommand = options.sendCommand;
        this.prefix = (_a = options.prefix) !== null && _a !== void 0 ? _a : 'rl:';
        this.resetExpiryOnChange = (_b = options.resetExpiryOnChange) !== null && _b !== void 0 ? _b : false;
        // So that the script loading can occur non-blocking, this will send
        // the script to be loaded, and will capture the value within the
        // promise return. This way, if increment/get start being called before
        // the script has finished loading, it will wait until it is loaded
        // before it continues.
        this.incrementScriptSha = this.loadIncrementScript();
        this.getScriptSha = this.loadGetScript();
    }
    /**
     * Loads the script used to increment a client's hit count.
     */
    async loadIncrementScript() {
        const result = await this.sendCommand('SCRIPT', 'LOAD', scripts_1.default.increment);
        if (typeof result !== 'string') {
            throw new TypeError('unexpected reply from redis client');
        }
        return result;
    }
    /**
     * Loads the script used to fetch a client's hit count and expiry time.
     */
    async loadGetScript() {
        const result = await this.sendCommand('SCRIPT', 'LOAD', scripts_1.default.get);
        if (typeof result !== 'string') {
            throw new TypeError('unexpected reply from redis client');
        }
        return result;
    }
    /**
     * Runs the increment command, and retries it if the script is not loaded.
     */
    async retryableIncrement(key) {
        const evalCommand = async () => this.sendCommand('EVALSHA', await this.incrementScriptSha, '1', this.prefixKey(key), this.resetExpiryOnChange ? '1' : '0', this.windowMs.toString());
        try {
            const result = await evalCommand();
            return result;
        }
        catch {
            // TODO: distinguish different error types
            this.incrementScriptSha = this.loadIncrementScript();
            return evalCommand();
        }
    }
    /**
     * Method to prefix the keys with the given text.
     *
     * @param key {string} - The key.
     *
     * @returns {string} - The text + the key.
     */
    prefixKey(key) {
        return `${this.prefix}${key}`;
    }
    /**
     * Method that actually initializes the store.
     *
     * @param options {RateLimitConfiguration} - The options used to setup the middleware.
     */
    init(options) {
        this.windowMs = options.windowMs;
    }
    /**
     * Method to fetch a client's hit count and reset time.
     *
     * @param key {string} - The identifier for a client.
     *
     * @returns {ClientRateLimitInfo | undefined} - The number of hits and reset time for that client.
     */
    async get(key) {
        const results = await this.sendCommand('EVALSHA', await this.getScriptSha, '1', this.prefixKey(key));
        return parseScriptResponse(results);
    }
    /**
     * Method to increment a client's hit counter.
     *
     * @param key {string} - The identifier for a client
     *
     * @returns {IncrementResponse} - The number of hits and reset time for that client
     */
    async increment(key) {
        const results = await this.retryableIncrement(key);
        return parseScriptResponse(results);
    }
    /**
     * Method to decrement a client's hit counter.
     *
     * @param key {string} - The identifier for a client
     */
    async decrement(key) {
        await this.sendCommand('DECR', this.prefixKey(key));
    }
    /**
     * Method to reset a client's hit counter.
     *
     * @param key {string} - The identifier for a client
     */
    async resetKey(key) {
        await this.sendCommand('DEL', this.prefixKey(key));
    }
}
exports.RedisStore = RedisStore;
// Export it to the world!
exports.default = RedisStore;
