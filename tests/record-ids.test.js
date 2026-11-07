import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recordId,viewResource,formatRecordValue,recordTypes} from '../src/record-ids.ts';

test('record IDs stay unique by resource and do not truncate large IDs',()=>{
 const prefixes=Object.values(recordTypes).map(([prefix])=>prefix);
 assert.equal(new Set(prefixes).size,prefixes.length);
 assert.equal(recordId('schedules',1),'CS-001');
 assert.equal(recordId('members',12345),'MEM-12345');
 assert.equal(recordId('members',null),'?');
 assert.equal(recordId('members',undefined),'?');
});
test('each table uses the resource of its active tab',()=>{
 for(const [page,tab,expected] of [['Memberships','Plans','plans'],['Memberships','Credit ledger','credit_transactions'],['Finance','Refunds','refunds'],['Finance','Invoices','invoices'],['System','Reminders','notification_rules'],['System','','branches'],['Retreats','Registrations','retreat_registrations'],['Retreats','Itinerary','retreat_itinerary'],['Reports','','classes'],['Attendance','','bookings']])assert.equal(viewResource(page,tab),expected);
});
test('foreign IDs and references use the target entity without changing payment references',()=>{
 assert.equal(formatRecordValue('id',2,{},'refunds'),'REF-002');
 assert.equal(formatRecordValue('payment_id',3,{},'refunds'),'PAY-003');
 assert.equal(formatRecordValue('reference_id',4,{type:'Membership'},'invoices'),'MS-004');
 assert.equal(formatRecordValue('reference','5',{module:'Finance',action:'Refund'},'activity_logs'),'REF-005');
 assert.equal(formatRecordValue('reference','123456',{method:'GCash'},'payments'),'123456');
 assert.equal(formatRecordValue('reference','abc-123',{module:'Schedules'},'activity_logs'),'abc-123');
 assert.deepEqual(formatRecordValue('branch_ids','[1,2]',{},'users'),['BR-001','BR-002']);
 assert.equal(formatRecordValue('capacity',10,{},'classes'),10);
});
