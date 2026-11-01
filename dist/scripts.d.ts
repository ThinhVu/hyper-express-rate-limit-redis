/**
 * The lua scripts, used to make consecutive queries on the same key and avoid
 * race conditions by doing all the work on the redis server.
 */
declare const scripts: {
    increment: string;
    get: string;
};
export default scripts;
