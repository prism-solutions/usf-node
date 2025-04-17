import { Types } from "mongoose";

export type ObjectIdString = string & { __isObjectId: true }; // Branded type for ObjectId strings

/** Helper type to handle both ObjectId and its string representation */
export type MongoId = ObjectIdString | Types.ObjectId;

/**
 * Status details for availability tracking
 * Note: The API validates these fields at runtime, but TypeScript cannot enforce all validations
 */
export interface StatusDetails {
  orderId?: string | null;
  date?: Date | string;
  temporary?: boolean;
  expiration?: Date;
}

/**
 * Availability status mapping
 * The API expects predefined keys but also accepts custom ones
 * Runtime validation enforces specific required fields for create operations
 */
export interface AvailabilityMap {
  produced?: StatusDetails;
  reserved?: StatusDetails;
  sold?: StatusDetails;
  [key: string]: StatusDetails | undefined;
}

/** Location reference structure */
export interface LocationReference {
  id: MongoId;
  name: string;
  date: Date;
}

/** Entity identifiers and ownership */
export interface EntityInfo {
  apiId: string; // API identifier for the creating entity
  entityId: MongoId; // ID of the creating entity
  factoryId: MongoId; // Factory that produced the item
  brandId: MongoId; // Brand that owns the item
}

/** Base details structure for both brand and factory */
export interface BaseDetails {
  id?: string;
  name?: string;
  type?: string;
  subType?: string;
}

/** Brand details extend base details */
export interface BrandDetails extends BaseDetails { }

/** Factory details extend base details */
export interface FactoryDetails extends BaseDetails { }

/** Current location structure with optional details */
export interface CurrentLocation {
  id?: MongoId;
  name?: string;
  details?: Record<string, unknown>; // Max 3 properties
}

/** Transit destination information */
export interface TransitTo {
  id?: MongoId; // Must be a valid storage location
  client?: string; // External client reference
  // Note: Only one of id or client can be set
}

/** Color information */
export interface Color {
  id?: string;
  name: string; // Required for item creation
}

/** Deletion tracking */
export interface DeletionInfo {
  status: boolean; // Defaults to false
  deletionDate?: Date; // Auto-set when status becomes true
}

/** Location history entry */
export interface LocationHistoryEntry {
  id: MongoId;
  name: string;
  date: Date;
}

/**
 * Main USF Item interface
 * Represents an item in the USF inventory system
 */
export interface USFItem {
  _id?: MongoId; // MongoDB document ID
  id?: string;
  hardcode?: string; // Optional hardcoded identifier
  sku?: string;

  // Core entity information - Required on creation, immutable after
  entities?: EntityInfo;

  // Location tracking
  // Note: Runtime validation ensures either currentLocation OR transitTo is provided on creation
  currentLocation?: CurrentLocation;
  transitTo?: TransitTo;
  locationHistory?: LocationHistoryEntry[];

  // Item details
  color?: Color;
  packageQuantity?: number; // Must be positive

  // Availability tracking
  availability?: AvailabilityMap;

  // Product information
  brandDetails?: BrandDetails;
  factoryDetails?: FactoryDetails;

  // Deletion tracking
  deleted?: DeletionInfo;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
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
  locationHistory?: Array<
    Omit<LocationReference, "id"> & {
      id: ObjectIdString;
    }
  >;
}

/**
 * Create operation requirements
 * @description Stricter type for item creation with required fields
 * Note: The API enforces additional validations that TypeScript cannot express:
 * - Either currentLocation OR transitTo must be provided, but not both
 * - Entity IDs must be valid MongoDB ObjectIDs
 */
export interface CreateUSFItem extends Omit<USFItem, "_id"> {
  // Required fields for creation
  entities: Required<EntityInfo>;
  color: Required<Color>;
  sku: string;
  packageQuantity: number;

  // Either currentLocation or transitTo is required (enforced at runtime)
  // TypeScript cannot express "one of these two must be present"

  // Required product details
  brandDetails: BrandDetails;
  factoryDetails: FactoryDetails;
}

/**
 * Update operation allowed fields
 * @description Excludes immutable fields and allows partial updates
 * Note: The API prevents updating certain fields that cannot be expressed in TypeScript
 */
export type UpdateUSFItem = Partial<
  Omit<
    USFItem,
    | "_id"
    | "entities"
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
