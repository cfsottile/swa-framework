import { gBuildNNN, gBuildNN1, gBuildNMN, gBuildNM1 } from './build'

function augment(select, extract, fetch, build, inject) {
    inject(build(fetch(extract(select()))));
}

// extraction functions

function gExtract(parser) {
    return function (selectedHTMLNodes) {
        return selectedHTMLNodes.map(parser);
    };
}

// fetching functions

function gFetch(baseQuery, parser) {
    return function(extractedElements) {
        return extractedElements.map(query(baseQuery)).map(parser);
    };
}

function query(base) {
    return function(args) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', buildURI(buildQuery(base, args)), false);
        xhr.send();
        return JSON.parse(xhr.responseText);
    };
}

function buildURI(query) {
    return encodeURI("https://dbpedia.org/sparql?query=" + query + "&format=json");
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
    return function(gottenDictionaries) {
        return gottenDictionaries.map(fulfillHtml(template));
    };
}

function gBuildNN1(template1,template2) {
    return function(gottenDictionaries) {
        var htmls = gottenDictionaries.map(fulfillHtml(template1));
        return fulfillHtml(template2)({ "data": nodeToString(fold(htmls)) });
    };
}

function gBuildNMN(template1,template2) {
    return function(gottenDictionariess) {
        var htmlss = gottenDictionariess.map(
            (gottenDictionaries) => { return gottenDictionaries.map( fulfillHtml(template1) ); });
        return htmlss.map((htmls) => {
            return fulfillHtml(template2)({ "data": nodeToString(fold(htmls)) });
        });
    };
}

function gBuildNM1(template1,template2,template3) {
    return function(gottenDictionariess) {
        var htmls = gBuildNMN(template1,template2)(gottenDictionariess);
        return fulfillHtml(template3)({ "data": nodeToString(fold(htmls)) });
    };
}

function nodeToString(item) {
    var tmp = document.createElement("div");
    tmp.appendChild(item.getElementsByTagName("body")[0].firstChild);
    return tmp.innerHTML;
}

function fulfillHtml(template) {
    return (data) => { return htmlFromString(fulfillTemplate(template, data)); }
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
    return function(builtElements) {
        builtElements.forEach(b => {
            injection(nodeGetter(), b.getElementsByTagName("body")[0].firstChild);
        });
    };
}

function gInject1(nodeGetter, injection) {
    return function(builtElement) {
        injection(nodeGetter(), builtElement.getElementsByTagName("body")[0].firstChild);
    };
}
