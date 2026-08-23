# Flemozi GIF Integration Assessment

## Reviewed project

- Repository: <https://github.com/KRTirtho/flemozi>
- License declared by the repository: GPLv3.

## Relevant implementation facts

Flemozi is a desktop emoji picker rather than an embeddable browser component. Its GIF tab queries the GIPHY REST API at `https://api.giphy.com/v1/gifs`, requires a `GIPHY_API_KEY`, uses the `trending` and `search` endpoints, filters requests to GIPHY's `g` rating, and copies a selected GIF URL or file to the desktop clipboard.

## Integration boundary

Aniraku must not copy Flemozi source or its desktop integration because the project is GPLv3 and has no web widget. A browser-native comment picker can follow the same high-level interaction pattern only if Aniraku uses its own compatible GIPHY integration and obtains its own permitted API credential. The existing Aniraku comment component already renders legacy `||GIF:` content suffixes, but its active GIF composer was intentionally disabled pending a public no-auth alternative.

## Official GIPHY integration constraints

The [GIPHY API documentation](https://developers.giphy.com/docs/api/) requires an API key for Trending and Search, requires these API calls to be made directly from the browser, and prohibits proxying GIPHY API or media requests. It also requires a distinct key for each web section, a conspicuous Powered By GIPHY attribution mark where the API is used, and direct use of returned media URLs. Therefore, the production repair must use an Aniraku-owned web comment key configured in the Vercel build environment; a local-only key cannot make the deployed picker work.
