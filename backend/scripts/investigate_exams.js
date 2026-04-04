import mongoose from 'mongoose';

const mongoUri = "mongodb://127.0.0.1:27017/digiassess";

const investigate = async () => {
    try {
        await mongoose.connect(mongoUri);
        const col = mongoose.connection.db.collection('exam_course_groups');
        const count = await col.countDocuments();
        console.log(`Collection: exam_course_groups, Count: ${count}`);
        
        const samples = await col.find({}).limit(1).toArray();
        console.log('Sample Document:');
        console.log(JSON.stringify(samples[0], null, 2));
        
        // Let's check the fields mentioned by the user
        const sample = samples[0];
        console.log('\nRelevant fields check:');
        console.log('- Course Mapping:', sample.courseHierarchy || sample._courseHierarchy || 'Not found');
        console.log('- Students Count (M/F):', { male: sample.maleCount, female: sample.femaleCount });
        console.log('- Test Center:', sample.testCenter || 'Not found');
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

investigate();
