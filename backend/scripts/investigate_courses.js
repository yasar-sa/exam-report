import mongoose from 'mongoose';

const mongoUri = "mongodb://127.0.0.1:27017/digiassess";

const investigate = async () => {
    try {
        await mongoose.connect(mongoUri);
        const col = mongoose.connection.db.collection('courses');
        const count = await col.countDocuments();
        console.log(`Collection: courses, Count: ${count}`);
        
        // Find a record with status.overall as PUBLISHED
        const publishedCourse = await col.findOne({ 'status.overall': 'PUBLISHED' });
        
        if (!publishedCourse) {
            console.log('No PUBLISHED course reports found.');
            return;
        }

        console.log('Sample PUBLISHED Course Report:');
        console.log(JSON.stringify(publishedCourse, null, 2));

        // Verify mapping
        console.log('\nVerifying Mapping:');
        console.log(`- Linked to exam_course_group (_courseGroup): ${publishedCourse._courseGroup}`);
        console.log(`- Course Hierarchy Name (courseHeirarchyCode): ${publishedCourse.courseHeirarchyCode}`);

        if (publishedCourse._courseGroup) {
            const group = await mongoose.connection.db.collection('exam_course_groups').findOne({ _id: publishedCourse._courseGroup });
            console.log(`- Exam Group Found: ${group ? 'Yes' : 'No'}`);
            if (group) {
                console.log(`- Exam Group Name (for cross-check): ${group.name}`);
            }
        }

        if (publishedCourse.courseHeirarchyCode) {
            const root = await mongoose.connection.db.collection('course_hierarchies').findOne({ name: publishedCourse.courseHeirarchyCode });
            console.log(`- Course Hierarchy Root Found: ${root ? 'Yes' : 'No'}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

investigate();
