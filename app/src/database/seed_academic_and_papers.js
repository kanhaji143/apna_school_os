const { getDb, syncShadowVault } = require('./db');

function seedAcademicData() {
    const db = getDb();
    console.log('🌱 Starting academic marks and questions seeding...');

    const students = db.prepare('SELECT id, student_name, class FROM students').all();
    const terms = db.prepare('SELECT id, term_code, max_written, max_oral FROM exam_terms ORDER BY display_order ASC').all();

    console.log(`Found ${students.length} students and ${terms.length} terms.`);

    const insertAtt = db.prepare(`
        INSERT OR REPLACE INTO student_attendance_summary 
        (student_id, session, class, total_working_days, days_present, promotion_status, teacher_remarks)
        VALUES (?, '2026-27', ?, ?, ?, ?, ?)
    `);

    const insertMark = db.prepare(`
        INSERT OR REPLACE INTO marks 
        (student_id, session, class, exam_term_id, subject_id, written_marks, oral_marks, remarks)
        VALUES (?, '2026-27', ?, ?, ?, ?, ?, ?)
    `);

    const remarksOptions = [
        'Exemplary conduct, diligent in studies and respectful to teachers.',
        'Hardworking with keen interest in science and mathematics.',
        'Active classroom participation and consistent academic performance.',
        'Very sincere, punctual and shows strong analytical abilities.',
        'Enthusiastic learner with outstanding creative and literary skills.',
        'Consistent performer with excellent social and leadership qualities.'
    ];

    // Seed marks and attendance inside transaction
    db.exec('BEGIN TRANSACTION');
    try {
        for (const st of students) {
            // Aptitude factor between 0.72 and 0.94 based on student ID
            const seed = (st.id * 17) % 23;
            const aptitude = 0.72 + (seed / 100);

            const totalDays = 220;
            const presentDays = Math.min(218, Math.max(192, Math.round(totalDays * (0.88 + (seed % 10) / 100))));
            const attPct = parseFloat(((presentDays / totalDays) * 100).toFixed(2));
            const remark = remarksOptions[st.id % remarksOptions.length];

            insertAtt.run(st.id, st.class, totalDays, presentDays, 'Promoted', remark);

            const subjects = db.prepare('SELECT id, subject_name FROM subjects WHERE class = ?').all(st.class);
            for (const sub of subjects) {
                const subSeed = (sub.id * 7 + st.id * 3) % 15;
                const subApt = Math.min(0.96, Math.max(0.68, aptitude + (subSeed - 7) / 100));

                for (const tm of terms) {
                    const wMarks = parseFloat((tm.max_written * subApt).toFixed(1));
                    const oMarks = parseFloat((tm.max_oral * Math.min(0.98, subApt + 0.05)).toFixed(1));
                    insertMark.run(st.id, st.class, tm.id, sub.id, wMarks, oMarks, 'Satisfactory');
                }
            }
        }
        db.exec('COMMIT');
        console.log(`✅ Seeded attendance summary and 4-term marks for all ${students.length} students.`);
    } catch (err) {
        db.exec('ROLLBACK');
        console.error('Failed to seed marks:', err);
    }

    // Seed Question Bank
    seedQuestions(db);
    syncShadowVault();
}

function seedQuestions(db) {
    console.log('📚 Seeding comprehensive question bank for classes...');
    const insertQ = db.prepare(`
        INSERT OR IGNORE INTO question_bank 
        (class, subject_id, chapter_name, question_type, question_text, options_json, correct_answer, marks, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const classList = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];

    db.exec('BEGIN TRANSACTION');
    try {
        for (const cls of classList) {
            const mathSub = db.prepare('SELECT id FROM subjects WHERE class = ? AND subject_name LIKE \'%Math%\'').get(cls);
            const sciSub = db.prepare('SELECT id FROM subjects WHERE class = ? AND (subject_name LIKE \'%Sci%\' OR subject_name LIKE \'%EVS%\')').get(cls);
            const engSub = db.prepare('SELECT id FROM subjects WHERE class = ? AND subject_name LIKE \'%Eng%\'').get(cls);
            const hinSub = db.prepare('SELECT id FROM subjects WHERE class = ? AND subject_name LIKE \'%Hindi%\'').get(cls);
            const sstSub = db.prepare('SELECT id FROM subjects WHERE class = ? AND subject_name LIKE \'%Social%\'').get(cls);

            if (mathSub) {
                insertQ.run(cls, mathSub.id, 'Number System', 'mcq', 'What is the sum of the smallest 3-digit number and greatest 2-digit number?', JSON.stringify(['199', '200', '109', '189']), '199', 1, 'easy');
                insertQ.run(cls, mathSub.id, 'Fractions & Decimals', 'mcq', 'Which of the following fractions is equivalent to 1/2?', JSON.stringify(['2/4', '3/8', '2/6', '4/10']), '2/4', 1, 'easy');
                insertQ.run(cls, mathSub.id, 'Geometry', 'short', 'Define a right angle and draw an accurate labeled sketch showing a 90-degree angle.', JSON.stringify([]), '', 2, 'medium');
                insertQ.run(cls, mathSub.id, 'Perimeter & Area', 'short', 'A rectangle has length 12 cm and breadth 8 cm. Find its perimeter and area with appropriate units.', JSON.stringify([]), '', 3, 'medium');
                insertQ.run(cls, mathSub.id, 'Word Problems', 'long', 'A farmer harvested 3,450 kg of wheat. He sold 1,820 kg in the local market and kept 430 kg for family use. If the remaining wheat was packed in 5 equal sacks, how much wheat did each sack contain?', JSON.stringify([]), '', 5, 'hard');
            }

            if (sciSub) {
                insertQ.run(cls, sciSub.id, 'Plants & Life', 'mcq', 'Which green pigment present in leaves absorbs sunlight for photosynthesis?', JSON.stringify(['Chlorophyll', 'Carotene', 'Stomata', 'Xylem']), 'Chlorophyll', 1, 'easy');
                insertQ.run(cls, sciSub.id, 'Human Body', 'mcq', 'Which organ is responsible for pumping oxygenated blood throughout the human body?', JSON.stringify(['Lungs', 'Heart', 'Kidney', 'Brain']), 'Heart', 1, 'easy');
                insertQ.run(cls, sciSub.id, 'Water Cycle', 'short', 'Explain the process of Evaporation and Condensation with suitable daily life examples.', JSON.stringify([]), '', 2, 'medium');
                insertQ.run(cls, sciSub.id, 'Matter & Materials', 'short', 'Differentiate between Soluble and Insoluble substances giving two examples of each.', JSON.stringify([]), '', 3, 'medium');
                insertQ.run(cls, sciSub.id, 'Environment', 'long', 'Describe the structure of a plant cell. Draw a neat labeled diagram showing Cell Wall, Nucleus, Vacuole and Chloroplast.', JSON.stringify([]), '', 5, 'hard');
            }

            if (engSub) {
                insertQ.run(cls, engSub.id, 'Grammar', 'mcq', 'Identify the collective noun in the sentence: "A pride of lions rested under the tree."', JSON.stringify(['tree', 'lions', 'pride', 'rested']), 'pride', 1, 'easy');
                insertQ.run(cls, engSub.id, 'Vocabulary', 'mcq', 'Choose the correct antonym of the word "Courageous":', JSON.stringify(['Bold', 'Timid', 'Brave', 'Strong']), 'Timid', 1, 'easy');
                insertQ.run(cls, engSub.id, 'Comprehension', 'short', 'Change the following sentence into Passive Voice: "The teacher delivered an inspiring lecture."', JSON.stringify([]), '', 2, 'medium');
                insertQ.run(cls, engSub.id, 'Creative Writing', 'short', 'Write a short paragraph of 50-60 words on "The Importance of Reading Books in Student Life".', JSON.stringify([]), '', 3, 'medium');
                insertQ.run(cls, engSub.id, 'Formal Letter', 'long', 'Write an application to the Principal requesting 3 days leave of absence due to high fever and medical doctor advice.', JSON.stringify([]), '', 5, 'medium');
            }

            if (hinSub) {
                insertQ.run(cls, hinSub.id, 'व्याकरण', 'mcq', '‘सूर्योदय’ शब्द का सही संधि-विच्छेद क्या होगा?', JSON.stringify(['सूर्य + उदय', 'सूर्यो + दय', 'सूर्य + दय', 'सु + उदय']), 'सूर्य + उदय', 1, 'easy');
                insertQ.run(cls, hinSub.id, 'पर्यायवाची', 'mcq', '‘जल’ का सही पर्यायवाची शब्द कौन सा है?', JSON.stringify(['नीर', 'अग्नि', 'पवन', 'गगन']), 'नीर', 1, 'easy');
                insertQ.run(cls, hinSub.id, 'मुहावरे', 'short', '‘नौ दो ग्यारह होना’ मुहावरे का अर्थ लिखकर वाक्य में प्रयोग कीजिए।', JSON.stringify([]), '', 2, 'easy');
                insertQ.run(cls, hinSub.id, 'संज्ञा व सर्वनाम', 'short', 'संज्ञा किसे कहते हैं? इसके भेदों के नाम उदाहरण सहित लिखिए।', JSON.stringify([]), '', 3, 'medium');
                insertQ.run(cls, hinSub.id, 'निबंध लेखन', 'long', '‘हमारे विद्यालय का वार्षिक उत्सव’ अथवा ‘पर्यावरण संरक्षण’ विषय पर 150 शब्दों में सुंदर निबंध लिखिए।', JSON.stringify([]), '', 5, 'medium');
            }

            if (sstSub) {
                insertQ.run(cls, sstSub.id, 'Our Earth', 'mcq', 'Which imaginary line divides the globe into Northern and Southern Hemispheres?', JSON.stringify(['Tropic of Cancer', 'Equator', 'Prime Meridian', 'Arctic Circle']), 'Equator', 1, 'easy');
                insertQ.run(cls, sstSub.id, 'Civics & Rights', 'mcq', 'How many Fundamental Rights are guaranteed by the Constitution of India?', JSON.stringify(['5', '6', '7', '8']), '6', 1, 'easy');
                insertQ.run(cls, sstSub.id, 'History', 'short', 'Who is known as the "Father of the Indian Constitution"? State his prime role.', JSON.stringify([]), '', 2, 'easy');
                insertQ.run(cls, sstSub.id, 'Geography', 'short', 'Explain the difference between Weather and Climate with two suitable examples.', JSON.stringify([]), '', 3, 'medium');
                insertQ.run(cls, sstSub.id, 'National Movement', 'long', 'Describe the Non-Cooperation Movement launched by Mahatma Gandhi. What were its main objectives and causes for withdrawal?', JSON.stringify([]), '', 5, 'hard');
            }
        }
        db.exec('COMMIT');
        console.log('✅ Successfully seeded comprehensive question bank across Classes 1 to 8!');
    } catch (err) {
        db.exec('ROLLBACK');
        console.error('Failed to seed questions:', err);
    }
}

seedAcademicData();
