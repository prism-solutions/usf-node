import { Types } from "mongoose";

export type ObjectIdString = string & { __isObjectId: true }; // Branded type for ObjectId strings

/** Helper type to handle both ObjectId and its string representation */
export type MongoId = ObjectIdString | Types.ObjectId;

/** Status details common structure for availability tracking */
export interface StatusDetails {
  orderId?: string;
  date: Date;
}

/** Extended status details for reservations */
export interface ReservedStatus extends StatusDetails {
  temporary?: boolean;
  expiration?: Date;
}

/** Mapping of different availability statuses */
export interface AvailabilityMap {
  produced?: StatusDetails;
  reserved?: ReservedStatus;
  sold?: StatusDetails;
}

/** Location reference structure */
interface LocationReference {
  id: MongoId;
  name: string;
  date: Date;
}

/** Entity identifiers and ownership */
interface EntityInfo {
  apiId: string; // API identifier for the creating entity
  entityId: MongoId; // ID of the creating entity
  factoryId: MongoId; // Factory that produced the item
  brandId: MongoId; // Brand that owns the item
}

/** Product details structure shared between brand and factory */
interface ProductDetails {
  productId?: string;
  productReference?: string;
  productName?: string;
  productType?: string;
}

/** Current location structure with optional details */
interface CurrentLocation {
  id: MongoId;
  name: string;
  details?: Record<string, unknown>; // Max 3 properties
}

/** Transit destination information */
interface TransitTo {
  id?: MongoId; // Must be a valid storage location
  client?: string; // External client reference
  // Note: Only one of id or client can be set
}

/** Color information */
interface Color {
  id?: string;
  name: string; // Required for item creation
}

/** Deletion tracking */
interface DeletionInfo {
  status: boolean; // Defaults to false
  deletionDate?: Date; // Auto-set when status becomes true
}

/** Metadata for item classification */
interface ItemMetadata {
  types: string[]; // 1-4 type identifiers
  synthetizedType?: string;
}

/**
 * Main USF Item interface
 * Represents an item in the USF inventory system
 */
export interface USFItem {
  _id?: MongoId; // MongoDB document ID
  id?: string;
  hardcode?: string; // Optional hardcoded identifier

  // Core entity information - Required on creation, immutable after
  entities: EntityInfo;

  // Location tracking
  currentLocation?: CurrentLocation;
  transitTo?: TransitTo;
  locationHistory: LocationReference[];

  // Item details
  color: Color;
  packageQuantity: number; // Must be positive

  // Availability tracking
  availability?: AvailabilityMap;

  // Product information
  brandDetails: {
    productId?: string;
    productReference: string; // Required
    productName?: string;
    productType?: string;
  } & ProductDetails;

  factoryDetails: {
    productId: string; // Required
    productReference?: string;
    productName?: string;
    productType: string; // Required
  } & ProductDetails;

  // Classification and tracking
  metadata: ItemMetadata;
  deleted: DeletionInfo;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;

  // Virtual field
  readonly productType?: string; // Computed from metadata.synthetizedType
}

export interface USFItemResponse
  extends Omit<
    USFItem,
    "_id" | "entities" | "currentLocation" | "transitTo" | "locationHistory"
  > {
  id: ObjectIdString; // Public facing identifier (always present in responses)
  entities: {
    apiId: string;
    entityId: ObjectIdString;
    factoryId: ObjectIdString;
    brandId: ObjectIdString;
  };
  currentLocation?: Omit<CurrentLocation, "id"> & {
    id: ObjectIdString;
  };
  transitTo?: Omit<TransitTo, "id"> & {
    id?: ObjectIdString;
  };
  locationHistory: Array<
    Omit<LocationReference, "id"> & {
      id: ObjectIdString;
    }
  >;
}

/**
 * Create operation requirements
 * @description Stricter type for item creation
 */
export interface CreateUSFItem extends Omit<USFItem, "_id"> {
  entities: Required<EntityInfo>;
  color: Required<Color>;
  brandDetails: Required<Pick<ProductDetails, "productReference">>;
  factoryDetails: Required<Pick<ProductDetails, "productId" | "productType">>;
  metadata: Required<ItemMetadata>;
}

/**
 * Update operation allowed fields
 * @description Excludes immutable fields and allows partial updates
 */
export type UpdateUSFItem = Partial<
  Omit<
    USFItem,
    | "_id"
    | "entities"
    | "metadata"
    | "locationHistory"
    | "createdAt"
    | "updatedAt"
  >
>;

// Utility function
export const isValidObjectId = (id: string): id is ObjectIdString => {
  return Types.ObjectId.isValid(id);
};
/**
 * Request shape when creating/updating items
 * Accepts both string (must be valid ObjectId) and ObjectId instances
 */
export type USFItemRequest = Omit<USFItem, "_id">;
