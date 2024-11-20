interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

interface DeleteResponse {
  acknowledged: boolean;
  deletedCount: number;
}

interface UpdateResponse {
  acknowledged: boolean;
  modifiedCount: number;
  upsertedId: string | null;
  upsertedCount: number;
  matchedCount: number;
}

type ApiResponse =
  | USFItemResponse
  | USFItemResponse[]
  | ErrorResponse
  | UpdateResponse
  | DeleteResponse
  | BatchOperationResult;

// Request body interfaces
interface RequestBodyBase<Q = unknown> {
  operation: string;
  query?: Q;
  document?: unknown;
  selectOptions?: FindOptions;
}

interface FindRequestBody extends RequestBodyBase<FindQuery> {
  operation: "find";
  query: FindQuery;
}

interface CreateRequestBody extends RequestBodyBase<never> {
  operation: "create";
  document: CreateUSFItem;
}

interface UpdateRequestBody extends RequestBodyBase<FindQuery> {
  operation: "update" | "updateOne" | "updateMany";
  query: FindQuery;
  document: UpdateQuery;
}

interface DeleteRequestBody extends RequestBodyBase<FindQuery> {
  operation: "delete" | "deleteOne" | "deleteMany";
  query: FindQuery;
}

interface CreateBatchRequestBody extends RequestBodyBase<never> {
  operation: "batchCreate";
  document: CreateUSFItem[];
}

interface UpdateBatchRequestBody extends RequestBodyBase<BatchUpdateQuery[]> {
  operation: "batchUpdate";
  query: BatchUpdateQuery[];
}

interface AggregateRequestBody extends RequestBodyBase<AggregateStages[]> {
  operation: "aggregate";
  query: AggregateStages[];
}

type AllRequestBodies =
  | FindRequestBody
  | CreateRequestBody
  | UpdateRequestBody
  | DeleteRequestBody
  | CreateBatchRequestBody
  | UpdateBatchRequestBody
  | AggregateRequestBody;
