import crypto from "crypto";

import type {
  FindQuery,
  UpdateQuery,
  FindOptions,
  AggregateStages,
  BatchCreateQuery,
  BatchUpdateQuery,
  BatchOperationResult,
  BulkWriteUpdateOneOperation,
  BulkWriteOperation,
  AggregateStage,
  AggregatePipeline,
} from "./types/operations";
import type {
  USFItem,
  USFItemResponse,
  CreateUSFItem,
  UpdateUSFItem,
} from "./types/item";

class UsfNode {
  private readonly authorizerId: string;
  private readonly secret: string;
  private readonly privateKey: string;
  private readonly baseUrl: string = "https://api.usf.prism-solutions.io/v1";
  private readonly silentReturn: boolean;
  constructor(
    {
      authorizerId,
      secret,
      privateKey,
    }: {
      authorizerId: string;
      secret: string;
      privateKey: string;
    },
    silentReturn: boolean = true,
    url: string = "https://api.usf.prism-solutions.io/v1",
  ) {
    if (!privateKey) {
      throw new Error("privateKey is required");
    }
    if (!secret) {
      throw new Error("secret is required");
    }
    if (!authorizerId) {
      throw new Error("authorizerId is required");
    }

    this.authorizerId = authorizerId;
    this.secret = secret;
    this.privateKey = privateKey;
    this.baseUrl = url;

    this.silentReturn = silentReturn;
  }

  private generateSignature(body: object): string {
    const time = Date.now().toString();
    const data = JSON.stringify(body) + time;

    try {
      const hmac = crypto
        .createHmac("sha256", this.privateKey)
        .update(data)
        .digest("hex");

      const b64Time = Buffer.from(time).toString("base64");
      return `${this.authorizerId}.${this.secret}.${hmac}.${b64Time}`;
    } catch (e) {
      console.error(e);
      throw new Error("Failed to generate signature");
    }
  }

  private async request<T extends AllRequestBodies>(
    body: T,
  ): Promise<ApiResponse> {
    const arrayBody = [body.operation, body.query];
    if (body.document && body.operation !== "aggregate") {
      arrayBody.push(body.document);
    }
    if (body.operation !== "aggregate" && body.operation !== "batchUpdate" && body.operation !== "bulkWrite") {
      arrayBody.push((body.selectOptions as Record<string, unknown>) || {});
    }

    const signature = this.generateSignature(arrayBody);
    let response;
    try {
      response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          sig: signature,
        },
        body: JSON.stringify(arrayBody),
      });
    } catch (networkError) {
      console.error("Network error:", networkError); // Consider more sophisticated logging in production
      throw new Error(
        "Network error occurred while attempting to reach the server.",
      );
    }

    if (!response.ok) {
      let errorMessage = {
        error: {
          message: "Failed to fetch",
          code: "NETWORK_ERROR",
        },
      }; // Default error message
      try {
        const errorJson = await response.json(); // Assuming the error message is plain text
        errorMessage = errorJson?.error || errorJson; // Customize based on your API's error response structure
      } catch (parseError) {
        console.error("Error parsing server response:", parseError);
        // Fallback to plain text error message
        errorMessage = {
          error: {
            message: await response.text(),
            code: "PARSE_ERROR",
          },
        };
      }
      if (this.silentReturn) {
        return errorMessage;
      }
      throw new Error(errorMessage.error.message);
    }
    try {
      const data = await response.json();
      return data;
    } catch (e) {
      throw new Error("Failed to parse response");
    }
  }

  public find(
    query: FindQuery,
    options: FindOptions = {},
  ): Promise<USFItemResponse[] | ErrorResponse> {
    return this.request<FindRequestBody>({
      operation: "find",
      query,
      selectOptions: options,
    }) as Promise<USFItemResponse[] | ErrorResponse>;
  }

  public async findOne(
    query: FindQuery,
    options: FindOptions = {},
  ): Promise<USFItemResponse | ErrorResponse> {
    const items = (await this.request<FindRequestBody>({
      operation: "find",
      query,
      selectOptions: { ...options, limit: 1 },
    })) as USFItemResponse[] | ErrorResponse;

    if (Array.isArray(items)) {
      return items[0];
    }
    return items;
  }

  public create(
    document: CreateUSFItem,
    options: FindOptions = {},
  ): Promise<USFItemResponse | ErrorResponse> {
    return this.request<CreateRequestBody>({
      operation: "create",
      document,
      selectOptions: options,
    }) as Promise<USFItemResponse | ErrorResponse>;
  }

  public createBatch({
    items,
  }: BatchCreateQuery): Promise<BatchOperationResult | ErrorResponse> {
    return this.request<CreateBatchRequestBody>({
      operation: "batchCreate",
      document: items,
    }) as Promise<BatchOperationResult | ErrorResponse>;
  }

  public updateBatch(
    queries: BatchUpdateQuery[],
  ): Promise<BatchOperationResult | ErrorResponse> {
    return this.request<UpdateBatchRequestBody>({
      operation: "batchUpdate",
      query: queries,
    }) as Promise<BatchOperationResult | ErrorResponse>;
  }

  /**
   * Perform bulk operations using MongoDB's bulkWrite pattern
   * @param operations Single operation or array of operations
   * @param options Options for the bulk operation
   * @returns Result of the bulk operation
   */
  public bulkWrite(
    operations: BulkWriteOperation,
    options: { ordered?: boolean } = {}
  ): Promise<BatchOperationResult | ErrorResponse> {
    // Normalize to array for consistent handling
    const ops = Array.isArray(operations) ? operations : [operations];

    return this.request<BulkWriteRequestBody>({
      operation: "bulkWrite",
      query: ops,
      selectOptions: options
    }) as Promise<BatchOperationResult | ErrorResponse>;
  }

  /**
   * Perform aggregation operations
   * @param pipeline Array of aggregation stages
   * @returns Aggregation results
   */
  public aggregate(
    pipeline: AggregateStages[] | AggregateStage[] | AggregatePipeline,
  ): Promise<USFItemResponse[] | ErrorResponse> {
    // Handle different input formats
    let normalizedPipeline: AggregateStages[];

    if ('pipeline' in pipeline) {
      // It's an AggregatePipeline
      normalizedPipeline = pipeline.pipeline.map(stage => stage.stage);
    } else if (Array.isArray(pipeline) && pipeline.length > 0 && 'stage' in pipeline[0]) {
      // It's an array of AggregateStage
      normalizedPipeline = (pipeline as AggregateStage[]).map(stage => stage.stage);
    } else {
      // It's already an array of AggregateStages
      normalizedPipeline = pipeline as AggregateStages[];
    }

    return this.request<AggregateRequestBody>({
      operation: "aggregate",
      query: normalizedPipeline,
    }) as Promise<USFItemResponse[] | ErrorResponse>;
  }

  private updateInternal(
    query: FindQuery,
    update: UpdateQuery,
    options: FindOptions = {},
    operation: "updateOne" | "update" | "updateMany",
  ): Promise<ApiResponse> {
    return this.request<UpdateRequestBody>({
      operation,
      query,
      document: update,
      selectOptions: options,
    });
  }

  public updateOne(
    query: FindQuery,
    update: UpdateQuery,
    options: FindOptions = {},
  ): Promise<USFItemResponse | ErrorResponse> {
    return this.updateInternal(query, update, options, "updateOne") as Promise<
      USFItemResponse | ErrorResponse
    >;
  }

  public update(
    query: FindQuery,
    update: UpdateQuery,
    options: FindOptions = {},
  ): Promise<UpdateResponse | ErrorResponse> {
    return this.updateInternal(query, update, options, "update") as Promise<
      UpdateResponse | ErrorResponse
    >;
  }

  public updateMany(
    query: FindQuery,
    update: UpdateQuery,
    options: FindOptions = {},
  ): Promise<UpdateResponse | ErrorResponse> {
    return this.updateInternal(query, update, options, "updateMany") as Promise<
      UpdateResponse | ErrorResponse
    >;
  }

  private deleteInternal(
    query: FindQuery,
    options: FindOptions = {},
    operation: "deleteOne" | "delete" | "deleteMany",
  ): Promise<DeleteResponse | ErrorResponse> {
    return this.request<DeleteRequestBody>({
      operation,
      query,
      selectOptions: options,
    }) as Promise<DeleteResponse | ErrorResponse>;
  }
  public deleteOne(
    query: FindQuery,
    options: FindOptions = {},
  ): Promise<USFItemResponse | ErrorResponse> {
    return this.deleteInternal(query, options, "deleteOne") as Promise<
      USFItemResponse | ErrorResponse
    >;
  }

  public delete(
    query: FindQuery,
    options: FindOptions = {},
  ): Promise<DeleteResponse | ErrorResponse> {
    return this.deleteInternal(query, options, "delete") as Promise<
      DeleteResponse | ErrorResponse
    >;
  }

  public deleteMany(
    query: FindQuery,
    options: FindOptions = {},
  ): Promise<DeleteResponse | ErrorResponse> {
    return this.deleteInternal(query, options, "deleteMany") as Promise<
      DeleteResponse | ErrorResponse
    >;
  }
}
export type {
  USFItem,
  USFItemResponse,
  CreateUSFItem,
  UpdateUSFItem,
  FindQuery,
  UpdateQuery,
  BatchCreateQuery,
  BatchUpdateQuery,
  BatchOperationResult,
  BulkWriteUpdateOneOperation,
  BulkWriteOperation,
  FindOptions,
  AggregateStages,
  AggregateStage,
  AggregatePipeline,
};
export default UsfNode;
