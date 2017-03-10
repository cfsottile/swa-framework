var select = gSelect(() => {
    return [document.getElementById("firstHeading")];
});

var extract = gExtract((node) => {
    return [node.innerHTML];
});

var fetch = gFetch(
    [
        "select ?thatPage ?appearsAs ?ofWPPage where {\n" +
        "?thatPage <http://xmlns.com/foaf/0.1/isPrimaryTopicOf> <http://en.wikipedia.org/wiki/", ">.\n" +
        "?of <http://xmlns.com/foaf/0.1/isPrimaryTopicOf> ?ofWPPage.\n" +
        "?of ?appearsAs ?thatPage.} limit 100"
    ],
    (data) => {
        return data.results.bindings.map((result) => {
            return {
                "resource": result.ofWPPage.value,
                "as": result.appearsAs.value
            };
        });
    }
);

var build = gBuildNM1(
    '<li style="font-size: small;">{{resource}} - {{as}}</li>',
    '<h2><span class="mw-headline" id="Semantic-related">Semantic related</span><ul>{{data}}</ul>',
    '{{data}}');

var inject = gInject1(
  () => { return document.evaluate("//*[@id=\"mw-content-text\"]/p[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; },
  (node, built) => { node.appendChild(built); });

augment(
    select,
    extract,
    fetch,
    build,
    inject
);
