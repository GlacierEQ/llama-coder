import { lineGenerator } from "./lineGenerator";
import { info, warn } from "./log";

export type OllamaToken = {
    model: string,
    response: string,
    done: boolean
};

export async function* ollamaTokenGenerator(url: string, data: any, bearerToken: string): AsyncGenerator<OllamaToken> {
    for await (let line of lineGenerator(url, data, bearerToken)) {
        info('Receive line: ' + line);
        let parsed: OllamaToken;
        try {
            parsed = JSON.parse(line) as OllamaToken;
        } catch (e) {
            warn('Receive wrong line: ' + line);
            continue;
        }
        yield parsed;
    }
}