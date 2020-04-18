## gathr

An application that will do the following:

- get most watched items from tautatuli (current the home screen top 10)
- query [taste dive](https://tastedive.com/) api with all the top 10 entries and get suggestions
- verify that entires meet certain criteria (rating > 6.5 and votes > 1000 right now)
- ensure entry does not exist in plex (and not in radarr)
- add to radarr and trigger a search

#### get started

requirements: 

- [yarn](https://yarnpkg.com/)
- [nodejs](https://nodejs.org/)
- radarr and tautulli setup and running locally
- an [API key for taste dive](https://tastedive.com/account/api_access)

steps:

- clone the repo
- run `yarn install`
- change all required variables in `.env` to meet your setup needs
- run `yarn standalone`