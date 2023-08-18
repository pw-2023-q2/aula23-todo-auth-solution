import { MongoClient } from "mongodb";
import { config } from "../../conf/config";
import session from "express-session";
import ConnectMongoDBSession from "connect-mongodb-session";

export class Database {
    protected client: MongoClient

    constructor() {
        this.client = new MongoClient(config.db.url)
    }

    async connect() {
        try {
            await this.client.connect()
            console.log("Database connected")
        } catch(error) {
            console.log(error)
            throw error
        }
    }

    async disconnect() {
        try {
            await this.client.close()
            console.log("Database disconnected")
        } catch(error) {
            console.log(error)
            throw error
        }
    }

    getDb() {
        try {
            return this.client.db(config.db.name)
        } catch(error) {
            console.log(error)
            throw error
        }
        
    }
}

const Store = ConnectMongoDBSession(session)
export const sessionStore = new Store({
    uri: config.db.url,
    databaseName: config.db.name,
    collection: config.db.collections.sessions
})


// .({
//     uri: config.db.url,
//     databaseName: config.db.name,
//     collection: config.db.collections.sessions
// })