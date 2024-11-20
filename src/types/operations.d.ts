// MongoDB Operators and Query Types
import type { USFItem, LocationReference } from "./item";

/** MongoDB comparison operators */
export interface MongoComparisonOperators<T> {
  $eq?: T;
  $gt?: T;
  $gte?: T;
  $in?: T[];
  $lt?: T;
  $lte?: T;
  $ne?: T;
  $nin?: T[];
}

/** MongoDB logical operators */
export interface MongoLogicalOperators<T> {
  $and?: T[];
  $not?: T | RegExp;
  $nor?: T[];
  $or?: T[];
}

/** MongoDB element operators */
export interface MongoElementOperators<T> {
  $exists?: boolean;
  $type?: T extends string ? string : number;
}

/** MongoDB evaluation operators */
export interface MongoEvaluationOperators {
  $regex?: string | RegExp;
  $options?: string;
}

/** Combine all MongoDB operators */
export type MongoOperators<T> = MongoComparisonOperators<T> &
  MongoElementOperators<T> &
  MongoEvaluationOperators;

/** Make a field queryable with MongoDB operators */
export type QueryableField<T> = T | MongoOperators<T>;

/** Make all fields in an object queryable */
export type QueryableObject<T> = {
  [P in keyof T]?: T[P] extends object
    ? QueryableObject<T[P]> | QueryableField<T[P]>
    : QueryableField<T[P]>;
} & MongoLogicalOperators<QueryableObject<T>>;

/**
 * Find Operation Query Interface
 * Represents allowed query operations for finding items
 */
export interface FindQuery
  extends QueryableObject<Omit<USFItem, "createdAt" | "updatedAt">> {
  $text?: {
    $search: string;
    $language?: string;
  };
}

/**
 * Aggregate Operation Stages
 * Represents allowed stages in aggregation pipeline
 */
export interface AggregateStages {
  $match?: FindQuery;
  $project?: {
    [key: string]: 0 | 1 | Expression;
  };
  $group?: {
    _id: string | null | { [key: string]: Expression };
    [key: string]: Expression | string | null | { [key: string]: Expression };
  };
  $sort?: { [key in keyof USFItem]?: 1 | -1 };
  $limit?: number;
  $skip?: number;
  $unwind?:
    | string
    | {
        path: string;
        includeArrayIndex?: string;
        preserveNullAndEmptyArrays?: boolean;
      };
  $lookup?: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
  };
}

/** Aggregate Expression Operations */
export interface Expression {
  $sum?: number | string | Expression;
  $avg?: string | Expression;
  $min?: string | Expression;
  $max?: string | Expression;
  $first?: string | Expression;
  $last?: string | Expression;
  $push?: string | Expression;
  $addToSet?: string | Expression;
  $multiply?: Array<number | Expression>;
  $divide?: Array<number | Expression>;
  $subtract?: Array<number | Expression>;
  $add?: Array<number | Expression>;
}

/**
 * Update Operation Interface
 * Represents allowed update operations
 */
export interface UpdateQuery {
  $set?: Partial<
    Omit<USFItem, "_id" | "entities" | "metadata" | "locationHistory">
  >;
  $unset?: { [P in keyof USFItem]?: "" };
  $inc?: { packageQuantity?: number };
  $push?: {
    locationHistory?: LocationReference;
  };
  $pull?: {
    "metadata.types"?: string | MongoOperators<string>;
  };
}

/**
 * Options for find operations
 */
export interface FindOptions {
  sort?: { [key in keyof USFItem]?: 1 | -1 };
  limit?: number;
  skip?: number;
  projection?: { [key in keyof USFItem]?: 0 | 1 };
}

/**
 * Batch Create Operation Interface
 * @description Represents a batch creation operation with multiple items
 * @example
 * const batchCreate: BatchCreateQuery = {
 *   items: [
 *     { color: { name: 'Blue' }, packageQuantity: 10, ... },
 *     { color: { name: 'Red' }, packageQuantity: 20, ... }
 *   ],
 *   options: { ordered: true }
 * };
 */
export interface BatchCreateQuery {
  items: CreateUSFItem[];
  options?: {
    ordered?: boolean; // If true, stops on first error. If false, continues despite errors
    bypassValidation?: boolean;
  };
}

/**
 * Batch Update Operation Interface
 * @description Represents a batch update operation with multiple items
 * @example
 * const batchUpdate: BatchUpdateQuery = {
 *   filter: { packageQuantity: { $gt: 0 } },
 *   update: { $set: { 'color.name': 'New Color' } },
 *   options: { multi: true }
 * };
 */
export interface BatchUpdateQuery {
  filter: FindQuery;
  update: UpdateQuery;
  options?: {
    multi?: boolean; // If true, updates all matched documents. If false, updates only the first one
    upsert?: boolean; // If true, creates document if none is found
    bypassValidation?: boolean;
  };
}

/**
 * Batch Operation Results
 * @description Results returned from batch operations
 */
export interface BatchOperationResult {
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
// Export the new types
export type {
  FindQuery,
  UpdateQuery,
  BatchCreateQuery,
  BatchUpdateQuery,
  BatchOperationResult,
  FindOptions,
  AggregateStages,
  Expression,
  MongoOperators,
  QueryableField,
  QueryableObject,
};
