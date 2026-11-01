import type { Store, IncrementResponse, ClientRateLimitInfo, Options as RateLimitConfiguration } from 'hyper-express-rate-limit';
import type { Options, SendCommandFn, RedisReply } from './types';
/**
 * A `Store` for the `express-rate-limit` package that stores hit counts in
 * Redis.
 */
export declare class RedisStore implements Store {
    /**
     * The function used to send raw commands to Redis.
     */
    sendCommand: SendCommandFn;
    /**
     * The text to prepend to the key in Redis.
     */
    prefix: string;
    /**
     * Whether to reset the expiry for a particular key whenever its hit count
     * changes.
     */
    resetExpiryOnChange: boolean;
    /**
     * Stores the loaded SHA1s of the LUA scripts used for executing the increment
     * and get key operations.
     */
    incrementScriptSha: Promise<string>;
    getScriptSha: Promise<string>;
    /**
     * The number of milliseconds to remember that user's requests.
     */
    windowMs: number;
    /**
     * @constructor for `RedisStore`.
     *
     * @param options {Options} - The configuration options for the store.
     */
    constructor(options: Options);
    /**
     * Loads the script used to increment a client's hit count.
     */
    loadIncrementScript(): Promise<string>;
    /**
     * Loads the script used to fetch a client's hit count and expiry time.
     */
    loadGetScript(): Promise<string>;
    /**
     * Runs the increment command, and retries it if the script is not loaded.
     */
    retryableIncrement(key: string): Promise<RedisReply>;
    /**
     * Method to prefix the keys with the given text.
     *
     * @param key {string} - The key.
     *
     * @returns {string} - The text + the key.
     */
    prefixKey(key: string): string;
    /**
     * Method that actually initializes the store.
     *
     * @param options {RateLimitConfiguration} - The options used to setup the middleware.
     */
    init(options: RateLimitConfiguration): void;
    /**
     * Method to fetch a client's hit count and reset time.
     *
     * @param key {string} - The identifier for a client.
     *
     * @returns {ClientRateLimitInfo | undefined} - The number of hits and reset time for that client.
     */
    get(key: string): Promise<ClientRateLimitInfo | undefined>;
    /**
     * Method to increment a client's hit counter.
     *
     * @param key {string} - The identifier for a client
     *
     * @returns {IncrementResponse} - The number of hits and reset time for that client
     */
    increment(key: string): Promise<IncrementResponse>;
    /**
     * Method to decrement a client's hit counter.
     *
     * @param key {string} - The identifier for a client
     */
    decrement(key: string): Promise<void>;
    /**
     * Method to reset a client's hit counter.
     *
     * @param key {string} - The identifier for a client
     */
    resetKey(key: string): Promise<void>;
}
export default RedisStore;
