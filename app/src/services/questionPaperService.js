const { getDb } = require('../database/db');

class QuestionPaperService {
    static getQuestions(className, subjectId = null) {
        const db = getDb();
        let rows = [];
        if (subjectId) {
            rows = db.prepare(`
                SELECT q.*, s.subject_name
                FROM question_bank q
                JOIN subjects s ON q.subject_id = s.id
                WHERE q.class = ? AND q.subject_id = ?
                ORDER BY q.marks ASC, q.id ASC
            `).all(className, subjectId);
        } else {
            rows = db.prepare(`
                SELECT q.*, s.subject_name
                FROM question_bank q
                JOIN subjects s ON q.subject_id = s.id
                WHERE q.class = ?
                ORDER BY s.display_order ASC, q.marks ASC
            `).all(className);
        }

        // If no questions in bank for this subject, provide curriculum aligned defaults
        if (rows.length === 0 && subjectId) {
            const sub = db.prepare('SELECT subject_name FROM subjects WHERE id = ?').get(subjectId);
            const subName = sub ? sub.subject_name : 'Subject';
            const isHindi = /hindi|हिंदी|व्याकरण|संस्कृत/i.test(subName);

            if (isHindi) {
                rows = [
                    { id: 901, class: className, subject_id: subjectId, chapter_name: 'मूलभूत व्याकरण व परिचय', question_type: 'mcq', question_text: `निम्नलिखित में से '${subName}' के संबंध में सही कथन चुनिए।`, options_json: JSON.stringify(['(क) यह भाषा का प्रमुख आधार है', '(ख) यह केवल पठन हेतु प्रयुक्त होता है', '(ग) इसका कोई निश्चित नियम नहीं है', '(घ) उपर्युक्त में से कोई नहीं']), marks: 1, subject_name: subName },
                    { id: 902, class: className, subject_id: subjectId, chapter_name: 'परिभाषा एवं सिद्धांत', question_type: 'mcq', question_text: `'${subName}' के मुख्य नियमों में से कौन-सा नियम सर्वाधिक महत्वपूर्ण है?`, options_json: JSON.stringify(['(क) शुद्ध उच्चारण एवं वर्तनी', '(ख) वर्ण विन्यास', '(ग) शब्द भेद', '(घ) वाक्य रचना']), marks: 1, subject_name: subName },
                    { id: 903, class: className, subject_id: subjectId, chapter_name: 'लघु उत्तरीय व्याकरण', question_type: 'short', question_text: `'${subName}' की परिभाषा दीजिए तथा इसके दो प्रमुख भेदों/लक्षणों को उदाहरण सहित स्पष्ट कीजिए।`, options_json: '[]', marks: 2, subject_name: subName },
                    { id: 904, class: className, subject_id: subjectId, chapter_name: 'व्यावहारिक भाषा प्रयोग', question_type: 'short', question_text: `दैनिक जीवन एवं वाक्य प्रयोग में '${subName}' के नियमों का क्या महत्व है? दो उपयुक्त उदाहरण देकर समझाइए।`, options_json: '[]', marks: 3, subject_name: subName },
                    { id: 905, class: className, subject_id: subjectId, chapter_name: 'विस्तृत निबंधात्मक विश्लेषण', question_type: 'long', question_text: `'${subName}' के सभी प्रमुख अंगों, नियमों एवं इसके साहित्यिक महत्व पर एक विस्तृत एवं सारगर्भित निबंध लिखिए।`, options_json: '[]', marks: 5, subject_name: subName }
                ];
            } else {
                rows = [
                    { id: 901, class: className, subject_id: subjectId, chapter_name: 'Fundamentals', question_type: 'mcq', question_text: `Choose the correct statement regarding core concepts of ${subName}.`, options_json: JSON.stringify(['Option A is accurate', 'Option B is an exception', 'Option C is standard', 'None of the above']), marks: 1, subject_name: subName },
                    { id: 902, class: className, subject_id: subjectId, chapter_name: 'Key Principles', question_type: 'mcq', question_text: `Which of the following best defines the primary rule in ${subName}?`, options_json: JSON.stringify(['Principle 1', 'Principle 2', 'Principle 3', 'Principle 4']), marks: 1, subject_name: subName },
                    { id: 903, class: className, subject_id: subjectId, chapter_name: 'Basic Theory', question_type: 'short', question_text: `Define key terminology and principles of ${subName} with two suitable examples.`, options_json: '[]', marks: 2, subject_name: subName },
                    { id: 904, class: className, subject_id: subjectId, chapter_name: 'Applied Concepts', question_type: 'short', question_text: `Explain how the fundamental principles of ${subName} apply in daily practical scenarios.`, options_json: '[]', marks: 3, subject_name: subName },
                    { id: 905, class: className, subject_id: subjectId, chapter_name: 'Comprehensive Analysis', question_type: 'long', question_text: `Write an in-depth essay or solve a detailed case study explaining the main topics of ${subName} studied during this academic session.`, options_json: '[]', marks: 5, subject_name: subName }
                ];
            }
        }

        return rows.map(q => {
            let opts = [];
            try { opts = JSON.parse(q.options_json || '[]'); } catch (e) { opts = []; }
            return { ...q, options: opts };
        });
    }

    static addQuestion(className, subjectId, chapterName, questionType, questionText, optionsJson, correctAnswer, marks, difficulty = 'medium') {
        const db = getDb();
        const stmt = db.prepare(`
            INSERT INTO question_bank (class, subject_id, chapter_name, question_type, question_text, options_json, correct_answer, marks, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(className, subjectId, chapterName, questionType, questionText, JSON.stringify(optionsJson || []), correctAnswer || '', marks, difficulty);
    }

    static generatePaper(className, subjectId, examTitle = 'Annual Examination 2026-27', totalMarks = 80, timeDuration = '3 Hours', generalInstructions = null) {
        const db = getDb();
        const profile = db.prepare('SELECT * FROM institution_profile WHERE id = 1').get();
        const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId);
        if (!subject) throw new Error('Subject not found');

        const questions = this.getQuestions(className, subjectId);

        // Group questions into sections
        const sectionA = questions.filter(q => q.question_type === 'mcq' || q.marks === 1);
        const sectionB = questions.filter(q => q.question_type === 'short' || (q.marks >= 2 && q.marks <= 3));
        const sectionC = questions.filter(q => q.question_type === 'long' || q.marks >= 4);

        const instructions = generalInstructions || [
            'All questions are compulsory.',
            'Read each question carefully before attempting.',
            'Write neat, clean and legible answers in the provided answer booklet.',
            'Marks allotted to each question are indicated against it.'
        ];

        return {
            institution: profile,
            subject: subject.subject_name,
            class: className,
            exam_title: examTitle,
            total_marks: totalMarks,
            time_duration: timeDuration,
            instructions,
            sections: [
                {
                    title: 'Section A - Objective & Multiple Choice Questions (1 Mark Each)',
                    marks_each: 1,
                    questions: sectionA
                },
                {
                    title: 'Section B - Short Answer Questions (2 - 3 Marks Each)',
                    marks_each: 2,
                    questions: sectionB
                },
                {
                    title: 'Section C - Long & Detailed Descriptive Questions (4 - 5 Marks Each)',
                    marks_each: 5,
                    questions: sectionC
                }
            ]
        };
    }
}

module.exports = QuestionPaperService;
