import { Model } from 'mongoose';

/**
 * Returns the MongoDB collection name for a given Mongoose model.
 *
 * This is useful when you need the raw collection name
 * (e.g., for aggregation pipelines, lookups, or logging)
 * without hardcoding it.
 *
 * @param model - A Mongoose model instance
 * @returns The underlying MongoDB collection name
 */
export function getCollectionName<T>(
  model: Model<T>
): string {
  return model.collection.name;
}