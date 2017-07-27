// helpers

function updateArtifact(curr,fn,prev) {
    return (artifact) => {
        artifact[curr] = fn(artifact[prev]);
        return artifact;
    };
}

function getValue(property) {
    return (obj) => {
        return obj[property];
    };
}

// augmentation functions

function augment(select, extract, fetch, build, inject) {
    inject(build(fetch(extract(select()))));
}

// selection functions

function gSelect(parser) {
    return () => {
        return parser().map((element) => { return {"selected": element}; });
    };
}

// extraction functions

// :: (HtmlNode -> [String]) -> ([{"selected": HtmlNode}] -> [{"selected": HtmlNode, "extracted": [String]}])
function gExtract(parser) {
    return function (artifacts) {
        return artifacts.map(updateArtifact("extracted",parser,"selected"));
    };
}

// fetching functions

// ::
function gFetch(baseQuery, parser) {
    return function(artifacts) {
        return artifacts
            .map(updateArtifact("fetched",query(baseQuery),"extracted"))
            .map(updateArtifact("fetched",parser,"fetched"));
    };
}

function query(base) {
    return function(data) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', buildURI(buildQuery(base, data)), false);
        xhr.send();
        return JSON.parse(xhr.responseText);
    };
}

function buildURI(query) {
    return "https://dbpedia.org/sparql?query=" + encodeURIComponent(query) + "&format=json";
}

function buildQuery(base, args) {
    return buildQueryR("", base, args);
}

function buildQueryR(res, [carBase, ...cdrBase], [carArgs, ...cdrArgs]) {
    if (cdrBase.length > 0) {
        return buildQueryR(
            res.concat(carBase).concat(carArgs),
            cdrBase,
            cdrArgs);
    } else {
        return res.concat(carBase);
    }
}

// building functions

function gBuildNNN(template) {
    return function(artifacts) {
        return artifacts.map(updateArtifact("built",fulfillHtml(template),"fetched"));
    };
}

function gBuildNN1(template1,template2) {
    return function(artifacts) {
        var tmpArtifacts = gBuildNNN(template1)(artifacts);
        return fulfillHtml(template2)({ "data": nodeToString(fold(tmpArtifacts.map(getValue("built")))) });
    };
}

function gBuildNMN(template1,template2) {
    return function(artifacts) {
        var tmpArtifacts = artifacts.map((artifact) => {
            artifact.built = artifact.fetched.map(fulfillHtml(template1));
            return artifact; });
        return tmpArtifacts.map((artifact) => {
            artifact.built = fulfillHtml(template2)({ "data": nodeToString(fold(artifact.built)) });
            return artifact;
        });
    };
}

function gBuildNM1(template1,template2,template3) {
    return function(artifacts) {
        var tmpArtifacts = gBuildNMN(template1,template2)(artifacts);
        return fulfillHtml(template3)({ "data": nodeToString(fold(tmpArtifacts.map(getValue("built")))) });
    };
}

function nodeToString(item) {
    var tmp = document.createElement("div");
    tmp.appendChild(item.getElementsByTagName("body")[0].firstChild);
    return tmp.innerHTML;
}

function fulfillHtml(template) {
    return (data) => { return htmlFromString(fulfillTemplate(template, data)); };
}

function fulfillTemplate(template, data) {
    var tmp = template;
    var toFulfill = tmp.match(/{{(.*?)}}/g);
    toFulfill.forEach(function (e, i, a) {
        tmp = tmp.replace(e, data[e.slice(2, e.length - 2)]);
    });
    return tmp;
}

function fold(htmls) {
    return htmls.reduce(
        (total, current) => {
            total.getElementsByTagName("body")[0].firstChild.appendChild(
                current.getElementsByTagName("body")[0].firstChild);
            return total; },
        (new DOMParser()).parseFromString("<div></div>", "text/html"));
}

function htmlFromString(string) {
    return (new DOMParser()).parseFromString(string, "text/html");
}

// injection functions

function gInjectN(nodeGetter, injection) {
    return function(artifacts) {
        artifacts.forEach((artifact) => {
            injection(nodeGetter(artifact), artifact.built.getElementsByTagName("body")[0].firstChild);
        });
    };
}

function gInject1(nodeGetter, injection) {
    return function(builtElement) {
        injection(nodeGetter(), builtElement.getElementsByTagName("body")[0].firstChild);
    };
}
function getElementByXpath (path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

var select1 = gSelect(() => {
    return [document.getElementById("firstHeading")];
});

var extract1 = gExtract((node) => {
    return [node.innerHTML];
});

var fetch1 = gFetch(
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

var build1 = gBuildNM1(
    '<li><a href="{{resource}}">{{resource}}</a> – <a href="{{as}}">{{as}}</a></li>',
    '<div><h2><span class="mw-headline" id="Semantic-related-resources">Semantic related resources</span></h2><h4>Resource – Semantic relation</h4><ul>{{data}}</ul></div>',
    '{{data}}');

var inject1 = gInject1(
  () => { return document.evaluate("//*[@id=\"mw-content-text\"]/p[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; },
  (node, built) => { node.appendChild(built); });

var select2 = gSelect(() => {
    var ul = Array.from(getElementByXpath('//*[@id="mw-content-text"]/p[1]/div/div/ul/div').children);
    // return [].concat.apply([],ul.map((li) => { return Array.from(li.children) }));
    return ul.map((li) => { return li.children[0]; });
});

var extract2 = gExtract((node) => {
    return [node.innerHTML];
});

var fetch2 = gFetch([
    "select distinct ?o where {\
    ?s <http://xmlns.com/foaf/0.1/isPrimaryTopicOf> <" , ">.\
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
    return [node.innerHTML];
});

var fetch3 = gFetch([
    "select distinct ?o where {\
    <" , "> <http://www.w3.org/2000/01/rdf-schema#label> ?o.}"
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
