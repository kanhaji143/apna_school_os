const assert = require('assert');
const VendorCrmService = require('../src/services/vendorCrmService');

console.log('--- TESTING VENDOR CLIENT PORTFOLIO & SALES CRM ---');

// Test 1: Fetch all clients
const res = VendorCrmService.getAll();
assert.strictEqual(res.success, true);
assert(res.clients.length >= 3, 'Should have initial sample clients');
assert(res.summary.total_clients >= 3);
assert(res.summary.total_deal_value > 0);
console.log(`✅ [TEST 1] Loaded ${res.clients.length} clients, Total Deal Value: ₹${res.summary.total_deal_value}, Collected: ₹${res.summary.total_received}, Due: ₹${res.summary.total_outstanding}`);

// Test 2: Upsert new client
const newClientPayload = {
    school_name: "Modern Public School",
    board: "CBSE",
    city: "Jodhpur",
    state: "Rajasthan",
    director_name: "Mr. Surendra Singh",
    phone: "9829988776",
    whatsapp: "9829988776",
    deal_value: 30000,
    received_amount: 20000,
    balance_due: 10000,
    next_due_date: "2026-12-15",
    hwid: "ASH-JDH-5512",
    running_status: "ACTIVE"
};
const upsertRes = VendorCrmService.upsertClient(newClientPayload);
assert.strictEqual(upsertRes.success, true);
assert(upsertRes.client.id.startsWith('CLT-'));
assert(upsertRes.client.license_key.startsWith('ASH-'));
console.log(`✅ [TEST 2] Added client: ${upsertRes.client.id} with auto-key: ${upsertRes.client.license_key}`);

// Test 3: Generate Key
const key = VendorCrmService.generateKey('ASH-TEST-9999', 365);
assert(key.startsWith('ASH-'));
console.log(`✅ [TEST 3] Cryptographic license key generated: ${key}`);

// Test 4: Delete the test client
const delRes = VendorCrmService.deleteClient(upsertRes.client.id);
assert.strictEqual(delRes.success, true);
console.log(`✅ [TEST 4] Deleted temporary test client successfully`);

console.log('✅ ALL VENDOR CRM TESTS PASSED WITH 100% SUCCESS!');
