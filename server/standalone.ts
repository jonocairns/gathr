import {run} from './runner';
require('dotenv').config();

var movies = process.argv.slice(2);

run(movies);
