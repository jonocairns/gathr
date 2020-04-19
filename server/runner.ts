import axios from 'axios';

const MIN_RATING = 6.5;
const MIN_VOTES = 1000;
const ROOT_FOLDER_PATH = '/movies/';
const LIBRARY_NAME = 'movie';

export const run = async (movies?: string[]) => {
  const tautApi = process.env.TAUTULLI_API_URL;
  const tautKey = process.env.TAUTULLI_API_KEY;
  const tasteDiveApi = process.env.TASTE_DIVE_API_URL;
  const tasteDiveKey = process.env.TASTE_DIVE_API_KEY;
  const radarrApi = process.env.RADARR_API_URL;
  const radarrKey = process.env.RADARR_API_KEY;
  const isDryRun = process.env.DRY_RUN === 'true';

  try {
    console.log(`${isDryRun ? 'running dry run.. nothing will be added to radarr' : 'running for real...'}`);

    let moviesToSearch = [];
    if (movies && movies.length > 0) {
      console.log('movies provided...');
      moviesToSearch = movies;
    } else {
      console.log('fetching most popular movies...');
      const data = await axios.get(`${tautApi}?apikey=${tautKey}&cmd=get_home_stats`);
      const {rows} = data.data.response.data[0];
      moviesToSearch = rows.map((r: any) => r.title);
    }
    console.log(`looking movies similar to ${moviesToSearch.join(', ')}`);

    console.log('fetching similar movies...');
    const resp = await axios.get(
      `${tasteDiveApi}/similar?q=${encodeURI(moviesToSearch.join(','))}&k=${tasteDiveKey}&type=movies&info=1&limit=100`,
    );

    const d = {
      original: resp.data.Similar.Info.map((i: any) => i.Name),
      similar: resp.data.Similar.Results.map((r: any) => r.Name),
    };

    const validateSuggestions = (
      payload: {votes: number; value: number},
      title: string,
      existsInRadarr: boolean,
      existsInPlex: boolean,
    ) => {
      const isValid = payload.value > MIN_RATING && payload.votes > MIN_VOTES && !existsInRadarr && !existsInPlex;

      if (isValid) {
        console.log(`movie: ${title}`);
        console.log(`exists: plex: ${existsInPlex} radarr: ${existsInRadarr}`);
        console.log(`meets criteria with rating: ${payload.value} votes: ${payload.votes}`);
      }

      if (existsInPlex && !existsInRadarr) {
        console.log(`${title} may exist in plex but not in radarr`);
      }

      return isValid;
    };

    const existingLibs = await axios.get(`${tautApi}?apikey=${tautKey}&cmd=get_libraries`);
    const movieLibs = existingLibs.data.response.data.filter((d: any) =>
      d.section_name.toLowerCase().includes(LIBRARY_NAME.toLowerCase()),
    );
    if (movieLibs.length > 1) {
      throw new Error('could not find target library matching the name {movies} or {movie}');
    }
    const target = movieLibs[0];

    const addedMovies: any = [];

    const promises = d.similar.map(async (similarItem: any) => {
      const lol = await axios.get(`${radarrApi}/movie/lookup?apikey=${radarrKey}&term=${encodeURI(similarItem)}`);

      if (lol.data.length === 0) {
        console.log(`could not find ${similarItem}.. skipping...`);
        return;
      }

      const firstMatch = lol.data[0];

      // ensure it doesnt exist in plex (and just not in radarr)
      const searchIfExistsInPlex = await axios.get(
        `${tautApi}?apikey=${tautKey}&cmd=get_library_media_info&section_id=${target.section_id}&search=${encodeURI(
          firstMatch.title,
        )}`,
      );
      const existsInPlex = searchIfExistsInPlex.data.response.data.data.length > 0;

      if (validateSuggestions(firstMatch.ratings, firstMatch.title, firstMatch.hasFile, existsInPlex)) {
        const payload = {
          ...firstMatch,

          rootFolderPath: ROOT_FOLDER_PATH, // fetch this?
          monitored: true,
          profileId: 6,
          qualityProfileId: 6,

          addOptions: {
            searchForMovie: true,
          },
        };
        const url = `${radarrApi}/movie?apikey=${radarrKey}`;

        let addedMovie;
        if (!isDryRun) {
          try {
            addedMovie = await axios.post(url, payload);
          } catch (err) {
            console.log('unable to create movie as it might already exist... attempting update...');
            try {
              addedMovie = await axios.put(url, payload);
            } catch (er) {
              console.log(`there was an issue attempting to add AND update ${firstMatch.title}...`);
            }
          }
          if (addedMovie) {
            addedMovies.push(addedMovie.data);
          }
        } else {
          console.log(`dry run enabled... this is where we would be adding ${firstMatch.title}`);
        }
      }
    });

    await Promise.all(promises);

    if (addedMovies.length > 0 && !isDryRun) {
      console.log('triggering movies search for added/updated movies');
      await axios.post(`${radarrApi}/command?apikey=${radarrKey}`, {
        name: 'MoviesSearch',
        movieIds: addedMovies.map((m: any) => m.id),
      });
    } else {
      console.log('no movies to be added');
    }

    return {
      added: addedMovies,
      total: d.similar.length,
    };
  } catch (err) {
    console.log(err);
  }
};
