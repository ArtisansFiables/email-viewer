#!/usr/bin/env node

import { watch, FSWatcher } from 'chokidar';
import { compile, TemplatesMap } from '@artisansfiables/template-compiler';
import clear from 'clear';

import { command } from './cli';
import { server, HOST } from './server';

export interface Context {
    serverPort: number;
    files: TemplatesMap | null;
    directory: string;
    cache: Map<string, string>;
    blacklist: Set<string>;
}

async function app() {
    try {
        const result = command();
        if (result === null) {
            console.log('--watch flag must be specified');
            return;
        }

        const [directory, port] = result;

        const context: Context = {
            directory,
            serverPort: port,
            files: null,
            cache: new Map(),
            blacklist: new Set(),
        };

        const watcher = watch(directory);
        watcher.on('error', (error) => {
            console.error(error);
            process.exit(1);
        });

        await setup(watcher, context);

        const events = ['add', 'change', 'unlink', 'addDir', 'unlinkDir'];

        events.forEach((event) => {
            watcher.on(event, () => onChange(context));
        });

        await server(context);
    } catch (e) {
        console.error(e);
    }
}

function setup(watcher: FSWatcher, context: Context) {
    return new Promise((resolve) => {
        watcher.on('ready', async () => {
            await onChange(context);

            resolve();
        });
    });
}

async function onChange(context: Context) {
    try {
        clear();

        console.log(`Compile ${context.directory} files …`);

        context.cache.clear();
        context.blacklist.clear();
        context.files = await compile(context.directory);

        console.log(`Compiled ${context.files.size} files`);

        console.log(`\nAPI can be accessed at http://${HOST}:${context.serverPort} 🚀\n`);
    } catch (e) {
        console.error(e);
    }
}

app().catch(console.error);
