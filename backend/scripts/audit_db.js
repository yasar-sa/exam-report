import mongoose from 'mongoose';

const mongoUri = "mongodb://127.0.0.1:27017/digiassess";

const audit = async () => {
    try {
        await mongoose.connect(mongoUri);
        const collections = await mongoose.connection.db.listCollections().toArray();
        const results = [];
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            results.push({ name: col.name, count });
        }
        
        // Find collections with similar names or matches for 1695
        console.log("Full Audit:");
        results.sort((a,b) => b.count - a.count).forEach(r => {
            console.log(`${r.name}: ${r.count}`);
        });

        const targetCountMatched = results.filter(r => r.count === 1695);
        if (targetCountMatched.length > 0) {
            console.log("\nMATCH FOUND for 1695:");
            targetCountMatched.forEach(r => console.log(`- ${r.name}`));
        }

        const hierarchyMatches = results.filter(r => r.name.toLowerCase().includes('hierarchy'));
        console.log("\nHierarchy Collections:");
        hierarchyMatches.forEach(r => console.log(`- ${r.name}: ${r.count}`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

audit();
