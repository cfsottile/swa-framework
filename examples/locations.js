var select = gSelect(() => {
    // in order to get a proper array, I have to do this
    var elements = document.getElementById("filming_locations_content").children;
    var arr = [].slice.call(elements);
    arr.splice(0, 1);
    return arr;
});

var extract = gExtract((locationContainer) => {
    return {"location": locationContainer.children[0].children[0].innerHTML.split(',')[0]};
});

var fetch = gFetch(
      "prefix dbpedia-owl: <http://dbpedia.org/ontology/>\n" +
      "prefix dbpprop: <http://dbpedia.org/property/>\n" +
      "select ?o where { ?s dbpprop:name \"{{location}}\"@en.\n" +
      "?s dbpedia-owl:thumbnail ?o }"
    ,
    (data) => {
        var results = {};
        if (data.results.bindings.length > 0) {
          results["thumbnail"] = data.results.bindings[0].o.value;
        }
        return results;
    }
);

var build = gBuildNN1(
    '<img id="itemTemplate" src={{thumbnail}}>',
    '<marquee id="semantic_augmented_image_container" class="article">{{data}}</marquee>');

var inject = gInject1(
    () => {
        return document.getElementById("main");
    },
    (node, built) => {
        node.insertBefore(built, document.getElementById("see_also"));
    }
);

augment(
    select,
    extract,
    fetch,
    build,
    inject
);
