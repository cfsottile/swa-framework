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

var select = gSelect(() => {
    return Array.from(getElementByXpath('//*[@id="titleCast"]/table/tbody').children).slice(1);
});

var extract = gExtract((node) => {
    return [node.children[1].children[0].children[0].innerHTML];
});

var fetch = gFetch(
    [
        "select count(?academyAward) as ?amount where {\n" +
        "?actor <http://www.w3.org/2000/01/rdf-schema#label> \"", "\"@en.\n" +
        "?academyAward <http://www.w3.org/2004/02/skos/core#broader> <http://dbpedia.org/resource/Category:Academy_Award_winners>.\n" +
        "?actor <http://purl.org/dc/terms/subject> ?academyAward.}"
    ], (data) => {
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
