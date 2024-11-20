# USF-NODE

This node module allows you to interact with USF APIs, providing a type-safe interface for inventory management operations.

## Installation

```bash
npm install usf-node
```

## Usage

Initialize the USF object with your credentials and options:

```typescript
import USF from "usf-node";

const usf = new USF({
  authorizerId: "your_authorizerId",
  secret: "your_secret",
  privateKey: "your_privateKey",
}, true); // silentReturn = true
```

## Basic Operations

### Finding Items

```typescript
// Basic find
const query = {
  "entities.factoryId": "123",
  "packageQuantity": { $gt: 10 }
};
const options = {
  sort: { packageQuantity: -1 },
  limit: 10,
  projection: { hardcode: 1 }
};

const items = await usf.find(query, options);

// Find with complex query
const complexQuery = {
  $or: [
    { "brandDetails.productType": "TYPE1" },
    { "factoryDetails.productType": "TYPE2" }
  ],
  "availability.reserved": { $exists: false }
};
```

### Finding a Single Item

```typescript
const item = await usf.findOne({
  hardcode: "ABC123"
}, {
  projection: {
    hardcode: 1,
    "entities.factoryId": 1
  }
});
```

### Creating Items

```typescript
// Single item creation
const newItem = {
  entities: {
    factoryId: "factory123",
    brandId: "brand456"
  },
  brandDetails: {
    productReference: "REF123",
    productType: "TYPE1"
  },
  factoryDetails: {
    productId: "PROD789",
    productType: "TYPE1"
  },
  packageQuantity: 100,
  color: {
    name: "Blue"
  },
  metadata: {
    types: ["type1", "type2"]
  }
};

const created = await usf.create(newItem);

// Batch creation
const batchCreate = {
  items: [newItem, {...}],
  options: {
    ordered: true, // stops on first error
    bypassValidation: false
  }
};

const batchResult = await usf.createBatch(batchCreate);
```

### Updating Items

```typescript
// Single update
const updateQuery = { "hardcode": "ABC123" };
const updateOp = {
  $set: {
    "currentLocation.name": "New Location",
    packageQuantity: 50
  },
  $push: {
    "metadata.types": "newType"
  }
};

const updated = await usf.updateOne(updateQuery, updateOp);

// Batch update
const batchUpdates = [
  {
    filter: { "packageQuantity": { $lt: 10 } },
    update: { $set: { "availability.status": "LOW_STOCK" } },
    options: { multi: true }
  },
  {
    filter: { "hardcode": "DEF456" },
    update: { $inc: { packageQuantity: 5 } }
  }
];

const batchResult = await usf.updateBatch(batchUpdates);
```

### Deleting Items

```typescript
// Delete single item
const deleteOne = await usf.deleteOne({ hardcode: "ABC123" });

// Delete multiple items
const deleteMany = await usf.deleteMany({
  "currentLocation.id": "LOC123",
  "deleted.status": true
});
```

### Aggregation Pipeline

```typescript
const pipeline = [
  {
    $match: {
      "entities.factoryId": "factory123"
    }
  },
  {
    $group: {
      _id: "$brandDetails.productType",
      totalQuantity: { $sum: "$packageQuantity" }
    }
  },
  {
    $sort: { totalQuantity: -1 }
  }
];

const aggregateResult = await usf.aggregate(pipeline);
```

## Response Types

### Success Responses

#### Find Operations
```typescript
interface USFItemResponse {
  id: string;
  hardcode?: string;
  entities: {
    apiId: string;
    entityId: string;
    factoryId: string;
    brandId: string;
  };
  // ... other fields
}
```

#### Batch Operations
```typescript
interface BatchOperationResult {
  success: boolean;
  matchedCount?: number;
  modifiedCount?: number;
  upsertedCount?: number;
  insertedCount?: number;
  errors?: Array<{
    index: number;
    error: string;
    document?: CreateUSFItem | UpdateQuery;
  }>;
}
```

### Error Response
```typescript
interface ErrorResponse {
  error: {
    message: string;
    code: string;
  }
}
```

## Options

### FindOptions
```typescript
interface FindOptions {
  sort?: { [key: string]: 1 | -1 };
  limit?: number;
  skip?: number;
  projection?: { [key: string]: 0 | 1 };
}
```

### BatchOptions
```typescript
interface BatchOptions {
  ordered?: boolean;     // Stop on first error
  bypassValidation?: boolean;
  multi?: boolean;       // For updates
  upsert?: boolean;      // For updates
}
```

## Error Handling

With `silentReturn: true`:
```typescript
const result = await usf.find({ invalid: true });
if ('error' in result) {
  console.error('Error:', result.error);
} else {
  console.log('Items:', result);
}
```

With `silentReturn: false`:
```typescript
try {
  const items = await usf.find({ invalid: true });
  console.log('Items:', items);
} catch (error) {
  console.error('Error:', error.message);
}
```
