function augment(select, extract, get, build, inject) {
    inject(build(get(extract(select()))));
}

function gGet(baseQuery, parser) {
    return function(extractedElements) {
        return extractedElements.map(query(baseQuery));
    }
}

function query(base) {
    return function(args) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', buildURI(buildQuery(base, args)), false);
        xhr.send();
        return JSON.parse(xhr.responseText);
    }
}

function buildURI(query) {
    return encodeURI("http://dbpedia.org/sparql?query=" + query + "&format=json");
}

function buildQuery(base, args) {
    return buildQueryR("", base, args);
}

function buildQueryR(res, base, args) {
    if (args.length > 0) {
        return buildQueryR(
            res.concat(base[0]).concat(args[0]),
            base.slice(1),
            args.slice(1));
    } else {
        return res.concat(base[0]);
    }
}

function gBuildNtoN(htmlString) {
    return function(gottenDictionaries) {
        return gottenDictionaries.map(fulfillItemTemplate(itemTemplateNtoN(htmlString)));
    }
}

function itemTemplateNtoN(htmlString) {
    var htmlNode = (new DOMParser()).parseFromString(htmlString, "text/html");
    var itemTemplateNode = htmlNode.getElementById("itemTemplate")
    return itemTemplateNode.getElementsByTagName("body")[0];
}

function gBuildNto1(htmlString) {
    return function(gottenDictionaries) {
        var finalHTMLNode = gottenDictionaries.reduce(
            function(prev, curr) {
                return addFulfilledItem(
                    prev,
                    fulfillItemTemplate(itemTemplateNto1(htmlString))(curr)
                );
            },
            (new DOMParser()).parseFromString(htmlString, "text/html");
        );
        return removeItemTemplateFrom(finalHTMLNode).getElementsByTagName("body")[0].firstChild;
    }
}

function itemTemplateNto1(htmlString) {
    var htmlNode = (new DOMParser()).parseFromString(htmlString, "text/html");
    return htmlNode.getElementById("itemTemplate");
}

function addFulfilledItem(main, fulfilledItem) {
    main.getElementById("itemTemplate").parentNode.appendChild(fulfilledItem);
}

function removeItemTemplateFrom(finalHTMLNode) {
    finalHTMLNode.getElementById("itemTemplate").parentNode.removeChild(node);
}

function prepare(itemTemplate) {
    var item = itemTemplate.cloneNode(true);
    item.setAttribute("id", "item");
    return nodeToString(item);
}

function generateHTMLNode(itemStr) {
    return ((new DOMParser()).parseFromString(itemStr, "text/html")).getElementById("item");
}

function fulfillItemTemplate(itemTemplate) {
    return function(data) {
        var itemStr = prepare(itemTemplate);
        var toFulfill = itemStr.match(/{{(.*?)}}/g);
        toFulfill.forEach(function (e, i, a) {
            itemStr = itemStr.replace(e, data[e.slice(2, e.length - 2)]);
        });
        return generateHTMLNode(itemStr);
    }
}

function gInjectNtoN(nodeGetter, injection) {
    return function(builtElements) {
        builtElements.forEach(b => {
            injection(nodeGetter(), b)
        });
    }
}

function gInjectNto1(nodeGetter, injection) {
    return function(builtElement) {
        injection(nodeGetter(), builtElement);
    }
}
