import { Server } from '@hapi/hapi';
import heml from 'heml';
import pug from 'pug';
import vision from '@hapi/vision';
import { join } from 'path';

import { Context } from './index';

export const HOST = 'localhost';

export async function server(context: Context) {
    const PORT = context.serverPort;

    const server = new Server({
        port: PORT,
        host: HOST,
    });

    await server.register(vision);

    server.views({
        engines: { pug },
        relativeTo: __dirname,
        path: '../views',
        compileOptions: {
            // By default Pug uses relative paths (e.g. ../root.pug), when using absolute paths (e.g. include /root.pug), basedir is prepended.
            // https://pugjs.org/language/includes.html
            basedir: join(__dirname, '../views'),
        },
    });

    server.route([
        {
            method: 'GET',
            path: '/',
            handler(request, h) {
                if (context.files === null) return null;

                return h.view('index', {
                    title: `email-viewer list for ${context.directory}`,
                    templates: [...context.files.keys()].map((file) => ({
                        name: file,
                        link: `http://${HOST}:${PORT}/file/${file}`,
                    })),
                });
            },
        },
        {
            method: 'GET',
            path: '/directory',
            handler(): string {
                return context.directory;
            },
        },
        {
            method: 'GET',
            path: '/list',
            handler(): string[] | null {
                if (context.files === null) return null;
                return [...context.files.keys()];
            },
        },
        {
            method: 'GET',
            path: '/links',
            handler(): string[] | null {
                if (context.files === null) return null;

                return [...context.files.keys()].map((filename) => `http://${HOST}:${PORT}/file/${filename}`);
            },
        },
        {
            method: 'GET',
            path: '/file/{file}',
            async handler(request): Promise<string | null> {
                const file = request.params.file;
                const cache = context.cache;
                const files = context.files;

                const cachedResult = cache.get(file);
                if (cachedResult !== undefined && !context.blacklist.has(file)) {
                    return cachedResult;
                }

                if (files === null) return null;

                const template = files.get(file);
                if (template === undefined) return null;

                const params = request.query;

                const { html: view } = await heml(template(params));

                if (Object.entries(params).length === 0) cache.set(file, view);
                else context.blacklist.add(file);

                return view;
            },
        },
    ]);

    await server.start();
}
