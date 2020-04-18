import * as Hapi from '@hapi/hapi';
import {run} from './runner';

const init = async () => {
  const server = new Hapi.Server({
    port: 9001,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['http://localhost:3000'],
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/config',
    handler: async (request, h) => {
      await run();
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
