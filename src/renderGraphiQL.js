/* @flow */

type GraphiQLData = { query: ?string, variables: ?Object, result?: Object };

// Current latest version of GraphiQL.
const GRAPHIQL_VERSION = '0.4.9';

/**
 * When express-graphql receives a request which does not Accept JSON, but does
 * Accept HTML, it may present GraphiQL, the in-browser GraphQL explorer IDE.
 *
 * When shown, it will be pre-populated with the result of having executed the
 * requested query.
 */
export function renderGraphiQL(data: GraphiQLData): string {
  const queryString = data.query;
  const variablesString =
    data.variables ? JSON.stringify(data.variables, null, 2) : null;
  const resultString =
    data.result ? JSON.stringify(data.result, null, 2) : null;

  /* eslint-disable max-len */
  return `<!--
The request to this GraphQL server provided the header "Accept: text/html"
and as a result has been presented GraphiQL - an in-browser IDE for
exploring GraphQL.
If you wish to receive JSON, provide the header "Accept: application/json" or
add "&raw" to the end of the URL within a browser.
-->
<!DOCTYPE html>
<html>
<head>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      overflow: hidden;
      width: 100%;
    }
  </style>
  <link href="//cdn.jsdelivr.net/graphiql/${GRAPHIQL_VERSION}/graphiql.css" rel="stylesheet" />
  <script src="//cdn.jsdelivr.net/fetch/0.9.0/fetch.min.js"></script>
  <script src="//cdn.jsdelivr.net/react/0.14.7/react.min.js"></script>
  <script src="//cdn.jsdelivr.net/react/0.14.7/react-dom.min.js"></script>
  <script src="//cdn.jsdelivr.net/graphiql/${GRAPHIQL_VERSION}/graphiql.min.js"></script>
</head>
<body>
  <script>
    // Collect the URL parameters
    var parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });
    // Produce a Location query string from a parameter object.
    function locationQuery(params) {
      return '?' + Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }
    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    };
    var otherParams = {};
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k];
      }
    }
    var fetchURL = locationQuery(otherParams);
    // Defines a GraphQL fetcher using the fetch API.
    function graphQLFetcher(graphQLParams) {
      return fetch(fetchURL, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphQLParams),
        credentials: 'include',
      }).then(function (response) {
        return response.text();
      }).then(function (responseBody) {
        try {
          return JSON.parse(responseBody);
        } catch (error) {
          return responseBody;
        }
      });
    }
    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery;
      updateURL();
    }
    function onEditVariables(newVariables) {
      parameters.variables = newVariables;
      updateURL();
    }
    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters));
    }
    // Render <GraphiQL /> into the body.
    React.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        query: ${JSON.stringify(queryString)},
        response: ${JSON.stringify(resultString)},
        variables: ${JSON.stringify(variablesString)}
      }),
      document.body
    );
  </script>
</body>
</html>`;
}
