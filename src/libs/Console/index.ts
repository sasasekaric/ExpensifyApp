/* eslint-disable @typescript-eslint/naming-convention */
import {addLog} from '@libs/actions/Console';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Log} from '@src/types/onyx';

/* store the original console.log function so we can call it */
// eslint-disable-next-line no-console
const originalConsoleLog = console.log;

/* List of patterns to ignore in logs. "logs" key always needs to be ignored because otherwise it will cause infinite loop */
const logPatternsToIgnore = [`merge() called for key: ${ONYXKEYS.LOGS}`];

/**
 * Check if the log should be attached to the console
 * @param message the message to check
 * @returns true if the log should be attached to the console
 */
function shouldAttachLog(message: string) {
    return !logPatternsToIgnore.some((pattern) => message.includes(pattern));
}

/**
 * Goes through all the arguments passed the console, parses them to a string and adds them to the logs
 * @param args the arguments to log
 */
function logMessage(args: unknown[]) {
    const message = args
        .map((arg) => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2); // Indent for better readability
                } catch (e) {
                    return 'Unserializable Object';
                }
            }

            return String(arg);
        })
        .join(' ');
    const newLog = {time: new Date(), level: CONST.DEBUG_CONSOLE.LEVELS.INFO, message};
    addLog(newLog);
}

/**
 * Override the console.log function to add logs to the store
 * @param args arguments passed to the console.log function
 */
// eslint-disable-next-line no-console
console.log = (...args) => {
    logMessage(args);
    originalConsoleLog.apply(console, args);
};

const charsToSanitize = /[\u2018\u2019\u201C\u201D\u201E\u2026]/g;

const charMap: Record<string, string> = {
    '\u2018': "'",
    '\u2019': "'",
    '\u201C': '"',
    '\u201D': '"',
    '\u201E': '"',
    '\u2026': '...',
};

/**
 * Sanitize the input to the console
 * @param text the text to sanitize
 * @returns the sanitized text
 */
function sanitizeConsoleInput(text: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return text.replace(charsToSanitize, (match) => charMap[match]);
}

/**
 * Run an arbitrary JS code and create a log from the output
 * @param text the JS code to run
 * @returns an array of logs created by eval call
 */
function createLog(text: string) {
    const time = new Date();
    try {
        // @ts-expect-error Any code inside `sanitizedInput` that gets evaluated by `eval()` will be executed in the context of the current this value.
        // eslint-disable-next-line no-eval, no-invalid-this
        const result = eval.call(this, text);

        if (result !== undefined) {
            return [
                {time, level: CONST.DEBUG_CONSOLE.LEVELS.INFO, message: `> ${text}`},
                {time, level: CONST.DEBUG_CONSOLE.LEVELS.RESULT, message: String(result)},
            ];
        }
        return [{time, level: CONST.DEBUG_CONSOLE.LEVELS.INFO, message: `> ${text}`}];
    } catch (error) {
        return [
            {time, level: CONST.DEBUG_CONSOLE.LEVELS.ERROR, message: `> ${text}`},
            {time, level: CONST.DEBUG_CONSOLE.LEVELS.ERROR, message: `Error: ${(error as Error).message}`},
        ];
    }
}

export {sanitizeConsoleInput, createLog, shouldAttachLog};
export type {Log};
