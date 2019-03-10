A Webpack loader for Python that supports both Transcrypt and Javascripthon, including source maps.

Example Webpack config is included. 

## Note on Transcrypt runtime

The Transcrypt runtime (`org.transcrypt.__runtime__.js`) will be copied by the loader to `projectroot/transcrypt/org.transcrypt.__runtime__.js` because Webpack loaders cannot emit multiple dependencies. For now, your Webpack config must have a resolve alias for this file, but this may be resolved in a future commit.
