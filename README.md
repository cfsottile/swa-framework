# Semantic Web Augmentation Framework

`swa-framework` is a JavaScript microframework for developing Web Augmentation scripts getting information from Semantic Web endpoints. In a general point of view, having a target Web page to be augmented, SWAF performs three main steps. Firstly, it extracts the desired information from the target website; following the previous section example, these would be cast’s names, such as _Marlon Brando_ and _Al Pacino_. Secondly, SWAF executes semantic queries against the Semantic Web (i.e., a SPARQL endpoint) to gain new information. Finally, it augments the target Web page adding the new information. Being a pipeline process, each component receives, as input, the output of its predecessor. Although the framework proposes a basic configuration, the user is able to provide customized functions and data for a more personalized augmentation. Figure 3 shows the framework architecture.

## Usage

The framework was designed following a functional programming approach. The higher order function augment receives as parameters 5 functions that are responsible for processing the framework steps. Each of these functions have the following behaviours, described in a simplified way:

* `select`: Receives an XPath list and retrieves the list of their corresponding DOM elements.
* `extract`: Receives a list of DOM elements (the ones retrieved by the previous function), collects the data of interest from them, and returns the list of data to be augmented. The framework includes different implementations of this collecting function, depending on the extraction strategy; e.g., cleaned textual content, anchor references. 6}
* `fetch`: Receives a generic SPARQL query and a list of data to be augmented. This function instantiates the generic query with specific values from each data element, and executes it against a SPARQL endpoint. Finally, it returns a list of augmentation data results, obtained after the processing of SPARQL queries’ answers.
* build: Takes an HTML template and fills it with the augmentation data results, generating one or more HTML augmentation elements. The amount of generated elements depends on the selected strategy, which may be a mapping (Listing 4), where one HTML element for each augmentation data result is generated, or a convergence (Listing 3), where only one HTML element that contains all the augmentation data results is generated.
* insert: Given the HTML augmentation elements, the list of HTML elements belonging to the DOM where the HTML augmentation elements, and a strategy for the insertion, this function inserts the HTML augmentation elements into the HTML elements of the list using the determined strategy (e.g. appending the element).

Once defined these 5 core functions, the augmentation script is ready to be applied not only to the current website, but to any that is of the same nature. For instance, the augmentation script to add cast’s birthdates defined within the context of The Godfather’s IMDb Web page will be applicable to all IMDb film pages.

In order to use it, the file augmentation.js must be imported, and the functions `gSelect`, `gExtract`, `gFetch`, `gBuild` and `gInject` must be used to construct the functions for each step.
