import { watch } from 'chokidar'
import { command } from './cli'

async function server() {
    try {
        const directory = command()
        if (directory === null) {
            console.log('--watch flag must be specified')
            return
        }

        const watcher = watch(directory)

        const log = (...args: any[]) => console.log(...args)

        // Add event listeners.
        watcher
            .on('add', (path) => {
                log(`File ${path} has been added`)
            })
            .on('change', (path) => log(`File ${path} has been changed`))
            .on('unlink', (path) => {
                log(`File ${path} has been removed`)
            })

        // More possible events.
        watcher
            .on('addDir', (path) => log(`Directory ${path} has been added`))
            .on('unlinkDir', (path) =>
                log(`Directory ${path} has been removed`)
            )
            .on('error', (error) => log(`Watcher error: ${error}`))
            .on('ready', () => log('Initial scan complete. Ready for changes'))
            .on('raw', (event, path, details) => {
                // internal
                log('Raw event info:', event, path, details)
            })

        await new Promise((resolve) => watcher.on('error', resolve))
    } catch (e) {
        console.error(e)
    }
}

server().catch(console.error)
