import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/digiassess";

const verifyData = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log(`Connected to: ${mongoUri}`);
        const collections = await mongoose.connection.db.listCollections().toArray();
        if (collections.length === 0) {
            console.log("No collections found in the database. It might be empty.");
        } else {
            for (const col of collections) {
                const count = await mongoose.connection.db.collection(col.name).countDocuments();
                console.log(`Collection: ${col.name}, Count: ${count}`);
            }
        }
    } catch (err) {
        console.error("Error verifying data:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

verifyData();
