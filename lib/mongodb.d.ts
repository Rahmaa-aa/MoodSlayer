import { MongoClient } from "mongodb"

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

declare const clientPromise: Promise<MongoClient>
export default clientPromise
