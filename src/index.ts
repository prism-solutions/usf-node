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
} from "./types/custom";

class UsfNode {
  private readonly authorizerId: string;
  private readonly secret: string;
  private readonly privateKey: any;

  constructor({
    authorizerId,
    secret,
    privateKey,
  }: {
    authorizerId: string;
    secret: string;
    privateKey: any;
  }) {
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
  ): Promise<ItemReturnable | ItemReturnable[]> {
    const signature = this.generateSignature(body);
    const response = await fetch("https://api.usfnode.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: signature,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to make a request");
    }

    const data = await response.json();
    return data;
  }

  public find(
    query: Record<string, any>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable[]> {
    return this.request<FindRequestBody>({
      operation: "find",
      query,
      selectOptions,
    }) as Promise<ItemReturnable[]>;
  }

  public create(
    createBody: ItemCreatable,
    selectOptions: Options = {},
  ): Promise<ItemReturnable> {
    return this.request<CreateRequestBody>({
      operation: "create",
      document: createBody,
      selectOptions,
    }) as Promise<ItemReturnable>;
  }

  public createBatch(
    createBodies: ItemCreatable[],
    selectOptions: Options = {},
  ): Promise<ItemReturnable[]> {
    return this.request<CreateBatchRequestBody>({
      operation: "createBatch",
      document: createBodies,
      selectOptions,
    }) as Promise<ItemReturnable[]>;
  }

  private updateInternal(
    query: Record<string, any>,
    updateBody: Partial<BaseEditableItem>,
    selectOptions: Options = {},
    operation: "updateOne" | "update" | "updateMany", // Internal parameter to specify the operation
  ): Promise<ItemReturnable | ItemReturnable[]> {
    return this.request<UpdateRequestBody>({
      operation,
      query,
      document: updateBody,
      selectOptions,
    });
  }
  public updateOne(
    query: Record<string, any>,
    updateBody: Partial<BaseEditableItem>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable> {
    return this.updateInternal(
      query,
      updateBody,
      selectOptions,
      "updateOne",
    ) as Promise<ItemReturnable>;
  }
  public update(
    query: Record<string, any>,
    updateBody: Partial<BaseEditableItem>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable[]> {
    return this.updateInternal(
      query,
      updateBody,
      selectOptions,
      "update",
    ) as Promise<ItemReturnable[]>;
  }
  public updateMany(
    query: Record<string, any>,
    updateBody: Partial<BaseEditableItem>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable[]> {
    return this.updateInternal(
      query,
      updateBody,
      selectOptions,
      "update",
    ) as Promise<ItemReturnable[]>;
  }

  private deleteInternal(
    query: Record<string, any>,
    selectOptions: Options = {},
    operation: "deleteOne" | "delete" | "deleteMany", // Internal parameter to specify the operation
  ): Promise<ItemReturnable | ItemReturnable[]> {
    return this.request<DeleteRequestBody>({
      operation,
      query,
      selectOptions,
    }) as Promise<ItemReturnable>;
  }
  public deleteOne(
    query: Record<string, any>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable> {
    return this.deleteInternal(
      query,
      selectOptions,
      "deleteOne",
    ) as Promise<ItemReturnable>;
  }
  public delete(
    query: Record<string, any>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable[]> {
    return this.deleteInternal(query, selectOptions, "delete") as Promise<
      ItemReturnable[]
    >;
  }
  public deleteMany(
    query: Record<string, any>,
    selectOptions: Options = {},
  ): Promise<ItemReturnable[]> {
    return this.deleteInternal(query, selectOptions, "deleteMany") as Promise<
      ItemReturnable[]
    >;
  }
}

module.exports = UsfNode;
