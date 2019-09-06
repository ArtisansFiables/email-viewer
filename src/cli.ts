import { Command } from 'commander'

import { version } from '../package.json'

export function command(): string | null {
    const program = new Command()

    program
        .version(version)
        .option(
            '-w, --watch <directory>',
            'watch, compile and serve recursively the directory'
        )
        .parse(process.argv)

    if (program.watch === undefined) return null
    return program.watch
}
