import {rows,tx} from './db.js';
import {notify} from './domain.js';
export async function deliverReminders(studioId,userId){return tx(async c=>{
 const rules=await rows(c,'SELECT * FROM notification_rules WHERE studio_id=? AND enabled=TRUE',[studioId]);let delivered=0;
 for(const rule of rules){let events=[];
 if(rule.event_type==='Class reminder')events=await rows(c,"SELECT b.id,b.member_id FROM bookings b JOIN schedules s ON s.id=b.schedule_id WHERE b.studio_id=? AND b.status='Confirmed' AND s.start_at>UTC_TIMESTAMP() AND s.start_at<=DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? MINUTE)",[studioId,rule.lead_minutes]);
 if(rule.event_type==='Membership expiry')events=await rows(c,"SELECT id,member_id FROM memberships WHERE studio_id=? AND status='Active' AND end_at>=UTC_DATE() AND end_at<=DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? MINUTE)",[studioId,rule.lead_minutes]);
 if(rule.event_type==='Payment reminder')events=await rows(c,"SELECT id,member_id FROM invoices WHERE studio_id=? AND member_id IS NOT NULL AND status IN ('Pending','Partially Paid')",[studioId]);
 if(rule.event_type==='Retreat reminder')events=await rows(c,"SELECT reg.id,reg.member_id FROM retreat_registrations reg JOIN retreats r ON r.id=reg.retreat_id WHERE reg.studio_id=? AND reg.member_id IS NOT NULL AND reg.status='Confirmed' AND r.start_at>UTC_TIMESTAMP() AND r.start_at<=DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? MINUTE)",[studioId,rule.lead_minutes]);
 for(const event of events){const [r]=await c.query('INSERT IGNORE INTO reminder_deliveries (studio_id,rule_id,event_ref,member_id) VALUES (?,?,?,?)',[studioId,rule.id,rule.event_type+':'+event.id,event.member_id]);if(r.affectedRows){await notify(c,{studio_id:studioId,id:userId},event.member_id,rule.event_type,rule.template);delivered++;}}
 }
 return {delivered};
});}
