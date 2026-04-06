import mongoose from 'mongoose';

const mongoUri = "mongodb://127.0.0.1:27017/digiassess";

const investigate = async () => {
    try {
        await mongoose.connect(mongoUri);
        const col = mongoose.connection.db.collection('course_hierarchies');
        const count = await col.countDocuments();
        console.log(`Collection: course_hierarchies, Count: ${count}`);
        const sample = await col.findOne({});
        console.log('Sample Document:');
        console.log(JSON.stringify(sample, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

investigate();
