function getElementByXpath (path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

var select = gSelect(() => {
    return Array.from(getElementByXpath('//*[@id="titleCast"]/table/tbody').children).slice(1);
});

var extract = gExtract((node) => {
    return {"name": node.children[1].children[0].children[0].innerHTML};
});

var fetch = gFetch(
    "select count(?academyAward) as ?amount where {\n" +
        "?actor <http://www.w3.org/2000/01/rdf-schema#label> \"{{name}}\"@en.\n" +
        "?academyAward <http://www.w3.org/2004/02/skos/core#broader> <http://dbpedia.org/resource/Category:Academy_Award_winners>.\n" +
        "?actor <http://purl.org/dc/terms/subject> ?academyAward.}"
    , (data) => {
        return {"amount": data.results.bindings[0].amount.value};
    }
);

var build = gBuildNNN('<span><img src="http://25.media.tumblr.com/9e676733a01c7a0866957268e89320e5/tumblr_mivcm21GkB1r7e16io1_250.gif" width="10px"> x {{amount}}</span>');

var inject = gInjectN(
    (artifact) => {
        return artifact.selected;
    }, (node, html) => {
        if (Array.from(html.innerHTML)[122] != 0) {
            node.children[1].children[0].appendChild(html);
        }
    }
);


augment(select,extract,fetch,build,inject);
