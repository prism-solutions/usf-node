# USF-NODE

This node module allows you to interact with USF APIs.

## Installation

```bash
npm install usf-node
```

## Usage

Initilize the USF object with your `authorizerId`, `secret`, `privateKey` and `silentErrors` options.

You can create a new authorizer via the USF interface.

```javascript
const USF = require("usf-node");

const usf = new USF({
  authorizerId: "your_authorizerId",
  secret: "your_secret",
  privateKey: "your_privateKey",
  silentErrors: true | false,
});
```

## Basic Operations

Here's how you can use the primary methods provided by the module to interact with USF APIs.

### Finding Items

To find items based on a query:

```javascript
const query = { entities: { factoryId: "123", brandId: "456" } };
const selectOptions = { select: { name: true } };

usf
  .find(query, selectOptions)
  .then((items) => console.log(items))
  .catch((error) => console.error(error));
```

### Finding a Single Item

To find a single item:

```javascript
usf
  .findOne({ "entities.factoryId": "123" }, { select: { name: 1 } })
  .then((item) => console.log(item))
  .catch((error) => console.error(error));
```

### Creating an Item

To create a new item:

For reference to the required fields, please refer to the USF API documentation.

```javascript
const item = {
  entities: {
    factoryId: "789",
    brandId: "101",
  },
  metadata: {
    types: ["type1", "type2"],
    synthetizedType: "combinedType",
  },
};

usf
  .create(item)
  .then((response) => console.log(response))
  .catch((error) => console.error(error));
```

### Updating Items

To update items based on a query:

For reference to the updatable fields, please refer to the USF API documentation.

```javascript
const query = { "entities.factoryId": "123" };
const updates = { $set: { "currentLocation.name": "New Location" } };
const selectOptions = {}; // Optional, use if you need to specify options

usf
  .update(query, updates, selectOptions)
  .then((response) => console.log(response))
  .catch((error) => console.error(error));
```

### Deleting Items

To delete items based on a query:

```javascript
const query = { "entities.factoryId": "123" };

usf
  .delete(query)
  .then((response) => console.log(response))
  .catch((error) => console.error(error));
```

## Advanced Operations

### Batch Creating Items

For batch operations like creating multiple items at once:

```javascript
const items = [
  { entities: { factoryId: "111", brandId: "222" } },
  { entities: { factoryId: "333", brandId: "444" } },
];

usf
  .createBatch(items)
  .then((response) => console.log(response))
  .catch((error) => console.error(error));
```

### Handling Errors

If you have passed `silentErrors: true` during initialization, method calls will return errors as part of the response rather than throwing. This allows for checking the error property in the response:

```javascript
usf.findOne({ "entities.factoryId": "not-exist" }).then((response) => {
  if (response.error) {
    console.error("Error occurred:", response.error);
  } else {
    console.log("Item found:", response);
  }
});
```

## Select Options

The `selectOptions` parameter allow you to customize the return behavior of the create, find and update methods. Here are the available options:

### `sort`

Allows you to sort the returned items based on one or more fields. You can specify ascending (1) or descending (-1) order for each field.

Example:

```javascript
{ sort: { "currentLocation.name": 1 } }
```

### `select`

Determines which fields should be included (`true`, `1`) or excluded (`false`, `0`) in the returned items. By default, all fields are included.

Example:

```javascript
{ select: { name: true, "entities.factoryId": 1, "metadata.types": 0 } }
```

### `returnNew`

When performing `updateOne` operations, this option, if set to `true`, returns the modified document rather than the original. Default is `true`.

Example:

```javascript
{
  returnNew: true;
}
```

### Examples

#### Finding items with selectOptions:

```javascript
const query = {};
const selectOptions = {
  sort: { "currentLocation.name": -1 },
  select: { name: 1, "entities.factoryId": 1 },
};

usf
  .find(query, selectOptions)
  .then((items) => console.log(items))
  .catch((error) => console.error(error));
```

#### Updating an item and return the new document:

```javascript
const query = { "entities.factoryId": "123" };
const updates = { $set: { "currentLocation.name": "Updated Location" } };
const selectOptions = { returnNew: true };

usf
  .update(query, updates, selectOptions)
  .then((updatedItem) => console.log(updatedItem))
  .catch((error) => console.error(error));
```

This section aims to provide clarity on how to use `selectOptions` to better customize your queries and updates, making the interaction with the database more flexible and efficient.
