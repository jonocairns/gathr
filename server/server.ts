import * as Hapi from '@hapi/hapi';
import {run} from './runner';
import {badRequest} from '@hapi/boom';
require('dotenv').config();

interface MoviesRequest {
  movies: string[];
}

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
    path: '/similar',
    handler: async (request, h) => {
      await run();
    },
  });

  server.route({
    method: 'POST',
    path: '/similar',
    handler: async (request, h) => {
      const payload = request.payload as MoviesRequest;
      const movies = payload.movies;

      if (movies) {
        return await run(movies);
      } else {
        return badRequest('please supply an object with movies');
      }
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
