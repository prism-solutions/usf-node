export interface Options {
  sort?: Record<string, 1 | -1>;
  select?: Record<string, boolean | 1 | 0>;
  returnNew?: boolean;
  protectProps?: boolean;
}

interface StatusDetails {
  orderId?: string;
  date?: Date | string;
  temporary?: boolean;
  expiration?: Date | string;
}
export interface BaseEditableItem {
  hardcode?: string;
  entities?: {
    factoryId?: string;
    brandId?: string;
  };
  currentLocation?: {
    id?: string;
    name?: string;
    details?: Record<string, any>;
  };
  transitTo?: {
    id?: string;
    client?: string;
  };
  availability?: Map<string, StatusDetails>;
  brandDetails?: {
    productId?: string;
    productReference?: string;
    productName?: string;
    productType?: string;
  };
  packageQuantity?: number;
  color?: {
    id?: string;
    name?: string;
  };
  factoryDetails?: {
    productId?: string;
    productReference?: string;
    productName?: string;
    productType?: string;
  };
  deleted?: {
    status?: boolean;
    deletionDate?: Date | string;
  };
}

export interface ItemCreatable {
  hardcode?: string;
  entities: {
    factoryId: string;
    brandId: string;
  };
  currentLocation?: {
    id?: string;
    name?: string;
    details?: Record<string, any>;
  };
  transitTo?: {
    id: string;
    client: string;
  };
  availability?: Map<string, StatusDetails>;
  brandDetails: {
    productId?: string;
    productReference: string;
    productName?: string;
    productType?: string;
  };
  packageQuantity: number;
  color: {
    id?: string;
    name: string;
  };
  factoryDetails: {
    productId: string;
    productReference?: string;
    productName?: string;
    productType: string;
  };
  metadata: {
    synthetizedType?: string;
  };
}

export interface ItemReturnable extends Omit<BaseEditableItem, "entities"> {
  _id?: string;
  entities?: {
    // readOnly
    apiId?: string;
    // readOnly
    entityId?: string;
    factoryId?: string;
    brandId?: string;
  };
  // readOnly
  locationHistory: {
    id?: string;
    name?: string;
    date?: Date | string;
  }[];
  // readOnly
  metadata: {
    types?: string[];
    synthetizedType?: string;
  };
}

export interface BatchUpdateResponse {
  insertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  deletedCount: number;
  upsertedCount: number;
  upsertedIds: Record<string, any>;
  insertedIds: Record<string, any>;
}
export interface BatchUpdateBody {
  filter: Record<string, any>;
  update: Record<string, any>;
}
type AnyRecord = Record<string, any>;

interface RequestBodyBase<T> {
  operation: string;
  query?: AnyRecord; // for find, update, delete operations
  document?: T | T[]; // for create and createBatch, use generic type to allow flexibility
  selectOptions?: Options; // select options applicable for all operations if needed
}

// Specific Request Bodies for each operation, leveraging the RequestBodyBase generic structure
type CreateRequestBody = RequestBodyBase<ItemCreatable> & {
  operation: "create";
};
type FindRequestBody = RequestBodyBase<null> & { operation: "find" };
type UpdateRequestBody = RequestBodyBase<Partial<BaseEditableItem>> & {
  operation: "update" | "updateOne" | "updateMany";
};
type DeleteRequestBody = RequestBodyBase<null> & {
  operation: "delete" | "deleteOne" | "deleteMany";
};
type CreateBatchRequestBody = RequestBodyBase<ItemCreatable[]> & {
  operation: "batchCreate";
};
export type UpdateBatchRequestBody = RequestBodyBase<BatchUpdateBody[]> & {
  operation: "batchUpdate";
};
type AggregateRequestBody = RequestBodyBase<Record<string, any>[]> & {
  operation: "aggregate";
};
export type ErrorResponse = { error: { message: string; code: string } };

export type DeleteResponse = { acknowledged: boolean; deletedCount: number };
export type UpdateResponse = {
  acknowledged: boolean;
  modifiedCount: number;
  upsertedId: number | null;
  upsertedCount: number;
  matchedCount: number;
};
export type ApiResponse =
  | ItemReturnable
  | ItemReturnable[]
  | ErrorResponse
  | UpdateResponse
  | DeleteResponse
  | BatchUpdateResponse;
// Union Type for All Request Bodies
type AllRequestBodies =
  | CreateRequestBody
  | FindRequestBody
  | UpdateRequestBody
  | DeleteRequestBody
  | CreateBatchRequestBody
  | UpdateBatchRequestBody
  | AggregateRequestBody;

// Export inventory item type
interface UsfItem {
  _id: string;
  entities: {
    apiId: string;
    entityId: string;
    factoryId: string;
    brandId: string;
  };
  currentLocation: {
    id: string;
    name: string;
    details?: Record<string, any>;
  };
  transitTo?: {
    id: string;
    client: string;
  };
  availability: {
    reserved?: {
      orderId: string;
      date?: string;
      temporary?: boolean;
      expiration?: string;
    };
  };
  brandDetails: {
    productId: string;
    productReference: string;
    productName?: string;
    productType: string;
  };
  packageQuantity: number;
  color: {
    id: string;
    name: string;
  };
  factoryDetails: {
    productId: string;
    productReference?: string;
    productName?: string;
    productType: string;
  };
  deleted: {
    status: boolean;
    deletionDate?: string;
  };
  locationHistory: Array<{
    id: string;
    name: string;
    date: string;
  }>;
  metadata: {
    types: string[];
    synthetizedType?: string;
  };
  createdAt: string;
  updatedAt: string;
}
