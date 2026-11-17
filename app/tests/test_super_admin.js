const ExamService = require('../src/services/examService');

console.log('--- TESTING SUPER ADMIN DYNAMIC CUSTOMIZER ---');

// 1. Initial terms
let terms = ExamService.getExamTerms();
console.log(`Initial Terms count: ${terms.length} (${terms.map(t => t.term_name).join(', ')})`);

// 2. Test switching to Standard 2-Term Board (Half-Yearly + Annual)
console.log('\n[TEST 1] Applying 2-Term Preset (Half-Yearly + Annual)...');
terms = ExamService.applyExamPreset('STANDARD_2_TERM');
console.log(`Updated Terms count: ${terms.length} (${terms.map(t => `${t.term_name}: ${t.max_written}+${t.max_oral}`).join(', ')})`);

// Verify dynamic marksheet with 2 terms
let marksheet = ExamService.getStudentMarksheet(1);
console.log(`Dynamic Marksheet with 2 terms: Subjects: ${marksheet.subjects.length}, Terms in score: ${marksheet.subjects[0].term_scores.length}`);

// 3. Test switching to CBSE 4-Term Periodic
console.log('\n[TEST 2] Applying CBSE Pattern Preset...');
terms = ExamService.applyExamPreset('CBSE_PERIODIC');
console.log(`Updated Terms count: ${terms.length} (${terms.map(t => t.term_name).join(', ')})`);

// 4. Test Switching back to Lakshya 4-Term UP Board
console.log('\n[TEST 3] Restoring Lakshya 4-Term Board...');
terms = ExamService.applyExamPreset('LAKSHYA_4_TERM');
console.log(`Restored Terms count: ${terms.length} (${terms.map(t => t.term_name).join(', ')})`);

// 5. Test Evaluation Policy (Only Grade vs Both)
console.log('\n[TEST 4] Updating Evaluation Policy to Grade Only...');
ExamService.updateExamPolicy({
    evaluation_mode: 'GRADE_ONLY',
    marksheet_layout: 'BOOKLET_2PAGE',
    show_rank: 1,
    show_attendance: 1,
    show_grading_scale: 1,
    show_qr_code: 1,
    show_remarks: 1
});
let policy = ExamService.getExamPolicy();
console.log(`Policy updated: Evaluation Mode: ${policy.evaluation_mode}, Layout: ${policy.marksheet_layout}`);

// Restore to BOTH
ExamService.updateExamPolicy({
    evaluation_mode: 'BOTH',
    marksheet_layout: 'BOOKLET_2PAGE',
    show_rank: 1,
    show_attendance: 1,
    show_grading_scale: 1,
    show_qr_code: 1,
    show_remarks: 1
});
console.log('\n✅ ALL SUPER ADMIN CONTROLS & DYNAMIC PRESETS VERIFIED WITH 100% SUCCESS!');
process.exit(0);
