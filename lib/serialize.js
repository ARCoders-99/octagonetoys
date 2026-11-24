/**
 * Convert a Mongoose lean document (ObjectId, Date, etc.) into a plain
 * JSON-safe object that can be passed from Server Components to Client
 * Components without serialization warnings.
 */
export function serialize(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

export default serialize;
