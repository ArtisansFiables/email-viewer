import { Command } from 'commander';
import { join, isAbsolute } from 'path';

import { version } from '../package.json';

export function command(): [string, number] | null {
    const program = new Command();

    program
        .version(version)
        .option('-w, --watch <directory>', 'watch, compile and serve recursively the directory')
        .option('-p, --port <port>', 'the port on which the server must listen', '3000')
        .parse(process.argv);

    if (typeof program.watch !== 'string') return null;

    if (!['string', 'number'].includes(typeof program.port)) return null;

    const trimmedDirectory = program.watch.trim();
    const port = Number(program.port);

    if (isAbsolute(trimmedDirectory)) return [trimmedDirectory, port];

    return [join(process.cwd(), trimmedDirectory), port];
}
