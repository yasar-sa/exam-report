import mongoose from 'mongoose';

const mongoUri = "mongodb://127.0.0.1:27017/digiassess";

const verifyMapping = async () => {
    try {
        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;
        const examCol = db.collection('exam_course_groups');
        const hierarchyCol = db.collection('course_hierarchies');

        console.log('Finding a COMPLETED exam...');
        const completedExam = await examCol.findOne({ status: 'COMPLETED' });
        
        if (!completedExam) {
            console.log('No COMPLETED exams found.');
            return;
        }

        console.log('\nCOMPLETED Exam Data:');
        console.log(JSON.stringify(completedExam, null, 2));

        // Let's identify the name field to link back
        // Based on user request, we should look for a name field that matches root hierarchy name
        const courseName = completedExam.courseName || completedExam.courseHierarchyName; 
        console.log(`\nLinking back to hierarchy using name: "${courseName}"`);

        if (courseName) {
            const rootCourse = await hierarchyCol.findOne({ name: courseName });
            if (rootCourse) {
                console.log('Successfully linked to Course Hierarchy:');
                console.log(JSON.stringify(rootCourse, null, 2));
            } else {
                console.log('Could not find matching Course Hierarchy by name.');
            }
        } else {
            console.log('No name field found in exam_course_group to perform mapping.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

verifyMapping();
