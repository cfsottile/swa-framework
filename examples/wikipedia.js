function getElementByXpath (path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

var select1 = gSelect(() => {
    return [document.getElementById("firstHeading")];
});

var extract1 = gExtract((node) => {
    return {"wikiPage": node.innerHTML};
});

var fetch1 = gFetch(
    "select ?thatPage ?appearsAs ?ofWPPage where {\n" +
        "?thatPage <http://xmlns.com/foaf/0.1/isPrimaryTopicOf> <http://en.wikipedia.org/wiki/{{wikiPage}}>.\n" +
        "?of <http://xmlns.com/foaf/0.1/isPrimaryTopicOf> ?ofWPPage.\n" +
        "?of ?appearsAs ?thatPage.} limit 100"
    ,
    (data) => {
        return data.results.bindings.map((result) => {
            return {
                "resource": result.ofWPPage.value,
                "as": result.appearsAs.value
            };
        });
    }
);

var build1 = gBuildNM1(
    '<li><a href="{{resource}}">{{resource}}</a> – <a href="{{as}}">{{as}}</a></li>',
    '<div><h2><span class="mw-headline" id="Semantic-related-resources">Semantic related resources</span></h2><h4>Resource – Semantic relation</h4><ul>{{data}}</ul></div>',
    '{{data}}');

var inject1 = gInject1(
  () => { return document.evaluate("//*[@id=\"mw-content-text\"]/p[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; },
  (node, built) => { node.appendChild(built); });

var select2 = gSelect(() => {
    var ul = Array.from(getElementByXpath('//*[@id="mw-content-text"]/p[1]/div/div/ul/div').children);
    return ul.map((li) => { return li.children[0]; });
});

var extract2 = gExtract((node) => {
    return {"wikiPage": node.innerHTML};
});

var fetch2 = gFetch([
    "select distinct ?o where {\
    ?s <http://xmlns.com/foaf/0.1/isPrimaryTopicOf> <{{wikiPage}}>.\
    ?s <http://www.w3.org/2000/01/rdf-schema#label> ?o.\
    filter(langMatches(lang(?o),\"EN\"))}"
],(data) => {
    if (data.results.bindings[0] !== undefined) {
        return { "data": data.results.bindings[0].o.value };
    } else {
        return { "data": "" };
    }
});

var build2 = gBuildNNN('<span>{{data}}</span>');

var inject2 = gInjectN((artifact) => {
    return artifact.selected;
},(node,built) => {
    if (built.innerHTML !== "") {
        node.innerHTML = "";
        node.appendChild(built);
    }
});

var select3 = gSelect(() => {
    var ul = Array.from(getElementByXpath('//*[@id="mw-content-text"]/p[1]/div/div/ul/div').children);
    // return [].concat.apply([],ul.map((li) => { return Array.from(li.children) }));
    return ul.map((li) => { return li.children[1]; });
});

var extract3 = gExtract((node) => {
    return {"label": node.innerHTML};
});

var fetch3 = gFetch([
    "select distinct ?o where {\
    <{{label}}> <http://www.w3.org/2000/01/rdf-schema#label> ?o.}"
],(data) => {
    if (data.results.bindings[0] !== undefined) {
        return { "data": data.results.bindings[0].o.value };
    } else {
        return { "data": "" };
    }

});

var build3 = gBuildNNN('<span>{{data}}</span>');

var inject3 = gInjectN((artifact) => {
    return artifact.selected;
},(node,built) => {
    if (built.innerHTML !== "") {
        // node.innerHTML = "";
        // node.appendChild(built);
        node.innerHTML += " (" + built.innerHTML + ")";
    }
});

augment(select1,extract1,fetch1,build1,inject1);
augment(select2,extract2,fetch2,build2,inject2);
augment(select3,extract3,fetch3,build3,inject3);
