# Reference Aggregation API (raapi)
The Reference Aggregation API for the ConSolid Ecosystem is the second interaction layer to work with a discovery-focused Solid server (i.e. the Server exposes a SPARQL endpoint), based on the [Dataset Aggregation API (daapi)](https://github.com/LBD-Hackers/daapi), which is the first layer. Its development is part of the [ConSolid Project](https://content.iospress.com/articles/semantic-web/sw233396).

## Class: ReferenceRegistry

### Constructor

- `constructor(session, url, parent?)`
  - **Parameters:**
    - `session` (BrowserSession | NodeSession | TokenSession): The session object.
    - `url` (string): The URL of the reference registry.
    - `parent` (Catalog): Optional parent catalog object.
  - **Description:** Creates an instance of the ReferenceRegistry class.

### Methods

#### create

- `async create(parent, makePublic = true)`
  - **Parameters:**
    - `parent` (Catalog): The parent catalog object (see: [Dataset Aggregation API (daapi)](https://github.com/LBD-Hackers/daapi)).
    - `makePublic` (boolean): Initial access rights for the dataset (default is true).
  - **Returns:** `Promise<void>`
  - **Description:** Creates a Reference Registry within the active project.

#### createConcept

- `async createConcept(concept)`
  - **Parameters:**
    - `concept` (string, optional): Concept URL (default is the URL of the registry concatenated with a generated UUID).
  - **Returns:** `Promise<string>`
  - **Description:** Creates a new ConSolid Reference Collection.

#### registerAggregatedConcept

- `async registerAggregatedConcept(concept, aggregatedConcept)`
  - **Parameters:**
    - `concept` (string): The concept URL.
    - `aggregatedConcept` (string): The aggregated concept URL.
  - **Returns:** `Promise<void>`
  - **Description:** Registers an aggregated Reference Collection for a given Reference Collection.

#### createReference

- `async createReference(concept, reference = getRoot(this.url) + v4(), document, identifier, conformance)`
  - **Parameters:**
    - `concept` (string): The concept URL.
    - `reference` (string): Reference URL (default is a generated UUID).
    - `document` (string): Document URL.
    - `identifier` (string): Identifier for the reference.
    - `conformance` (string): Conformance string.
  - **Returns:** `Promise<string>`
  - **Description:** Creates a Reference for a Reference Collection, using the [Web Annotation Data Model](https://www.w3.org/TR/annotation-model/).

#### deleteReference

- `async deleteReference(reference)`
  - **Parameters:**
    - `reference` (string): The reference URL to delete.
  - **Returns:** `Promise<void>`
  - **Description:** Deletes a reference.

#### deleteConcept

- `async deleteConcept(concept)`
  - **Parameters:**
    - `concept` (string): The URL of the Reference Collection to delete.
  - **Returns:** `Promise<void>`
  - **Description:** Deletes a Reference Collection.

#### findConceptByIdentifier

- `async findConceptByIdentifier(activeDocument, selectedElement)`
  - **Parameters:**
    - `activeDocument` (string): The active document URL.
    - `selectedElement` (string): The selected element identifier.
  - **Returns:** `Promise<object>`
  - **Description:** Finds a Reference Collection by the identifier of one of its References.

#### update

- `async update(query)`
  - **Parameters:**
    - `query` (string): The SPARQL query for updating the dataset.
  - **Returns:** `Promise<void>`
  - **Description:** Updates the dataset with a SPARQL query (use with caution).

### Properties

- `fetch`: Fetch function from the session.
- `accessService`: Instance of AccessService.
- `dataService`: Instance of DataService.
- `projectId`: Project ID string.
- `url`: URL of the reference registry.
- `datasetUrl`: URL of the dataset.
- `session`: Session object (BrowserSession, NodeSession, or TokenSession).
- `parent`: Parent Catalog object.
- `queryEngine`: Query engine instance.