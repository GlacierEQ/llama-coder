import * as vscode from 'vscode';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogData = Record<string, unknown>;

interface Logger {
    debug(message: string, data?: LogData): void;
    info(message: string, data?: LogData): void;
    warn(message: string, data?: LogData): void;
    error(message: string, error?: Error, data?: LogData): void;
}

class LoggerImpl implements Logger {
    private channel: vscode.LogOutputChannel;
    private logLevel: LogLevel = 'info'; // Only one declaration now

    constructor(channel: vscode.LogOutputChannel) {
        this.channel = channel;
    }

    setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }

    private formatMessage(level: LogLevel, message: string, data?: LogData): string {
        const timestamp = new Date().toISOString();
        const formattedData = data ? ` ${JSON.stringify(data)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedData}`;
    }

    debug(message: string, data?: LogData): void {
        if (this.shouldLog('debug')) {
            this.channel.debug(this.formatMessage('debug', message, data));
        }
    }

    info(message: string, data?: LogData): void {
        if (this.shouldLog('info')) {
            this.channel.info(this.formatMessage('info', message, data));
        }
    }

    warn(message: string, data?: LogData): void {
        if (this.shouldLog('warn')) {
            this.channel.warn(this.formatMessage('warn', message, data));
        }
    }

    error(message: string, error?: Error, data?: LogData): void {
        if (this.shouldLog('error')) {
            const errorDetails = error ? `\n${error.stack}` : '';
            this.channel.error(this.formatMessage('error', message, data) + errorDetails);
        }
    }
}

let logger: LoggerImpl | null = null;

export function registerLogger(channel: vscode.LogOutputChannel): void {
    logger = new LoggerImpl(channel);
}

export function setLogLevel(level: LogLevel): void {
    if (logger) {
        logger.setLogLevel(level);
    }
}

export function debug(message: string, data?: LogData): void {
    logger?.debug(message, data);
}

export function info(message: string, data?: LogData): void {
    logger?.info(message, data);
}

export function warn(message: string, data?: LogData): void {
    logger?.warn(message, data);
}

export function error(message: string, error?: Error, data?: LogData): void {
    logger?.error(message, error, data);
}