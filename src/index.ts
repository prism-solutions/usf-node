import crypto from "crypto";

import {
  type BaseEditableItem,
  type ItemCreatable,
  type ItemReturnable,
  type Options,
  type CreateRequestBody,
  type FindRequestBody,
  type UpdateRequestBody,
  type DeleteRequestBody,
  type CreateBatchRequestBody,
  type AllRequestBodies,
  type ApiResponse,
  type ErrorResponse,
  type UpdateResponse,
  type DeleteResponse,
} from "./types/custom";

class usfNode {
  private readonly authorizerId: string;
  private readonly secret: string;
  private readonly privateKey: any;
  private readonly baseUrl: string = "https://api.usf.com/v1";
  private readonly silentReturn: boolean;
  constructor(
    {
      authorizerId,
      secret,
      privateKey,
    }: {
      authorizerId: string;
      secret: string;
      privateKey: any;
    },
    silentReturn: boolean = true,
    url: string = "https://api.usf.com/v1",
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
    if (body.document) {
      arrayBody.push(body.document);
    }
    arrayBody.push(body.selectOptions || {});

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

    const data = await response.json();
    return data;
  }

  public find(
    query: Record<string, any>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable[] | ErrorResponse> {
    return this.request<FindRequestBody>({
      operation: "find",
      query,
      selectOptions,
    }) as Promise<ItemReturnable[] | ErrorResponse>;
  }
  public async findOne(
    query: Record<string, any>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable | ErrorResponse> {
    const items = (await this.request<FindRequestBody>({
      operation: "find",
      query,
      selectOptions,
    })) as ItemReturnable[] | ErrorResponse;
    if (Array.isArray(items)) {
      return items[0];
    }
    return items;
  }
  public create(
    createBody: ItemCreatable,
    selectOptions: Options = {},
  ): Promise<ItemReturnable | ErrorResponse> {
    return this.request<CreateRequestBody>({
      operation: "create",
      document: createBody,
      selectOptions,
    }) as Promise<ItemReturnable | ErrorResponse>;
  }

  public createBatch(
    createBodies: ItemCreatable[],
    selectOptions: Options = {},
  ): Promise<ItemReturnable[] | ErrorResponse> {
    return this.request<CreateBatchRequestBody>({
      operation: "createBatch",
      document: createBodies,
      selectOptions,
    }) as Promise<ItemReturnable[] | ErrorResponse>;
  }

  private updateInternal(
    query: Record<string, any>,
    updateBody: Partial<BaseEditableItem>,
    selectOptions: Options = {},
    operation: "updateOne" | "update" | "updateMany", // Internal parameter to specify the operation
  ): Promise<ApiResponse> {
    return this.request<UpdateRequestBody>({
      operation,
      query,
      document: updateBody,
      selectOptions,
    }) as Promise<ApiResponse>;
  }
  public updateOne(
    query: Record<string, any>,
    updateBody: Partial<BaseEditableItem>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable | ErrorResponse> {
    return this.updateInternal(
      query,
      updateBody,
      selectOptions,
      "updateOne",
    ) as Promise<ItemReturnable | ErrorResponse>;
  }
  public update(
    query: Record<string, any>,
    updateBody: Partial<BaseEditableItem>,
    selectOptions: Options = {},
  ): Promise<UpdateResponse | ErrorResponse> {
    return this.updateInternal(
      query,
      updateBody,
      selectOptions,
      "update",
    ) as Promise<UpdateResponse | ErrorResponse>;
  }
  public updateMany(
    query: Record<string, any>,
    updateBody: Partial<BaseEditableItem>,
    selectOptions: Options = {},
  ): Promise<UpdateResponse | ErrorResponse> {
    return this.updateInternal(
      query,
      updateBody,
      selectOptions,
      "update",
    ) as Promise<UpdateResponse | ErrorResponse>;
  }

  private deleteInternal(
    query: Record<string, any>,
    selectOptions: Options = {},
    operation: "deleteOne" | "delete" | "deleteMany", // Internal parameter to specify the operation
  ): Promise<DeleteResponse | ErrorResponse> {
    return this.request<DeleteRequestBody>({
      operation,
      query,
      selectOptions,
    }) as Promise<DeleteResponse | ErrorResponse>;
  }
  public deleteOne(
    query: Record<string, any>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable | ErrorResponse> {
    return this.deleteInternal(query, selectOptions, "deleteOne") as Promise<
      ItemReturnable | ErrorResponse
    >;
  }
  public delete(
    query: Record<string, any>,
    selectOptions: Options = {},
  ): Promise<DeleteResponse | ErrorResponse> {
    return this.deleteInternal(query, selectOptions, "delete") as Promise<
      DeleteResponse | ErrorResponse
    >;
  }
  public deleteMany(
    query: Record<string, any>,
    selectOptions: Options = {},
  ): Promise<DeleteResponse | ErrorResponse> {
    return this.deleteInternal(query, selectOptions, "deleteMany") as Promise<
      DeleteResponse | ErrorResponse
    >;
  }
}

export default usfNode;
