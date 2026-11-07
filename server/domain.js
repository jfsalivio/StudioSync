import {rows,tx,fail,audit} from './db.js';
import crypto from 'node:crypto';
export const defaults={cancellation_hours:12,no_show_forfeit:true,booking_window_days:30,waitlist_offer_minutes:60,checkin_before_minutes:30,checkin_after_minutes:60,rentals_enabled:true,retreats_enabled:true,timezone:'Asia/Manila',currency:'PHP'};
export const utc=v=>{const d=new Date(v);if(!Number.isFinite(+d))fail('A valid date and time is required.');return d.toISOString().slice(0,19).replace('T',' ');};
export async function owned(c,table,id,u,lock=false){const [r]=await rows(c,`SELECT * FROM ${table} WHERE id=? AND studio_id=? ${lock?'FOR UPDATE':''}`,[id,u.studio_id]);if(!r)fail('Record not found.',404);if(u.role!=='Admin'&&u.role!=='Member'){
 let branch=r.branch_id;if(table==='branches')branch=r.id;
 if(table==='memberships'){const [m]=await rows(c,'SELECT branch_id FROM members WHERE id=? AND studio_id=?',[r.member_id,u.studio_id]);branch=m?.branch_id;}
 if(table==='bookings'){const [s]=await rows(c,'SELECT branch_id FROM schedules WHERE id=? AND studio_id=?',[r.schedule_id,u.studio_id]);branch=s?.branch_id;}
 if(table==='payments'){const [i]=await rows(c,'SELECT branch_id FROM invoices WHERE id=? AND studio_id=?',[r.invoice_id,u.studio_id]);branch=i?.branch_id;}
 if(table==='retreat_registrations'){const [retreat]=await rows(c,'SELECT branch_id FROM retreats WHERE id=? AND studio_id=?',[r.retreat_id,u.studio_id]);branch=retreat?.branch_id;}
 if(branch&&!(u.branch_ids||[]).includes(branch))fail('This branch is outside your assigned scope.',403);
 }return r;}
export function memberScope(u,id){if(u.role==='Member'&&u.member_id!==Number(id))fail('You can only manage your own records.',403);}
export async function notify(c,u,member,title,message){await c.query('INSERT INTO notifications (studio_id,member_id,title,message) VALUES (?,?,?,?)',[u.studio_id,member,title,message]);}
export async function ledger(c,u,m,b,type,delta,notes=''){await c.query('INSERT INTO credit_transactions (studio_id,membership_id,booking_id,type,delta,notes,user_id) VALUES (?,?,?,?,?,?,?)',[u.studio_id,m,b,type,delta,notes,u.id]);}
export async function invoice(c,u,{branch_id=null,member_id=null,customer,type,reference_id,amount,snapshot={}}){const [r]=await c.query('INSERT INTO invoices (studio_id,branch_id,member_id,customer,type,reference_id,amount,snapshot) VALUES (?,?,?,?,?,?,?,?)',[u.studio_id,branch_id,member_id,customer,type,reference_id,amount,JSON.stringify(snapshot)]);return r.insertId;}
export async function checkSpace(c,u,b){
 const room=await owned(c,'rooms',b.room_id,u);if(room.branch_id!==Number(b.branch_id))fail('Room does not belong to this branch.');
 await owned(c,'branches',b.branch_id,u,true);
 const branch=await owned(c,'branches',b.branch_id,u);const [studio]=await rows(c,'SELECT settings FROM studios WHERE id=?',[u.studio_id]);
 const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:studio.settings.timezone||'Asia/Manila',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const localStart=fmt.format(new Date(b.start_at+'Z')),localEnd=fmt.format(new Date(b.end_at+'Z'));
 if(localStart<branch.opening_time.slice(0,5)||localEnd>branch.closing_time.slice(0,5)||localEnd<=localStart)fail('Reservation must fit branch operating hours.');
 const args=[u.studio_id,b.branch_id,b.end_at,b.start_at];
 const schedules=await rows(c,"SELECT id,room_id,trainer_id FROM schedules WHERE studio_id=? AND branch_id=? AND start_at<? AND end_at>? AND status='Published'",args);
 if(schedules.some(s=>(!b.schedule_id||s.id!==b.schedule_id)&&(b.whole_venue||s.room_id===Number(b.room_id)||s.trainer_id===Number(b.trainer_id))))fail('Room or trainer has an overlapping class.',409);
 if(b.trainer_id){const conflicts=await rows(c,"SELECT id FROM schedules WHERE studio_id=? AND trainer_id=? AND start_at<? AND end_at>? AND status='Published' AND id<>?",[u.studio_id,b.trainer_id,b.end_at,b.start_at,b.schedule_id||0]);if(conflicts.length)fail('Trainer has an overlapping class.',409);}
 const rentals=await rows(c,"SELECT id,room_id,whole_venue FROM rentals WHERE studio_id=? AND branch_id=? AND start_at<? AND end_at>? AND status='Confirmed'",args);
 if(rentals.some(r=>r.whole_venue||b.whole_venue||r.room_id===Number(b.room_id)))fail('Space has an overlapping rental.',409);
 const blocks=await rows(c,'SELECT id FROM room_blocks WHERE studio_id=? AND room_id=? AND start_at<? AND end_at>?',[u.studio_id,b.room_id,b.end_at,b.start_at]);if(blocks.length)fail('Room is unavailable during this interval.',409);
 const itinerary=await rows(c,"SELECT i.id,i.room_id,i.trainer_id,rm.branch_id FROM retreat_itinerary i JOIN retreats r ON r.id=i.retreat_id LEFT JOIN rooms rm ON rm.id=i.room_id WHERE i.studio_id=? AND i.start_at<? AND i.end_at>? AND r.status IN ('Published','Ongoing')",[u.studio_id,b.end_at,b.start_at]);
 if(itinerary.some(i=>(i.room_id&&((b.whole_venue&&i.branch_id===Number(b.branch_id))||i.room_id===Number(b.room_id)))||(i.trainer_id&&i.trainer_id===Number(b.trainer_id))))fail('Room or trainer has an overlapping retreat activity.',409);
 if(b.trainer_id){
 const blocked=await rows(c,'SELECT id FROM trainer_unavailability WHERE studio_id=? AND trainer_id=? AND start_at<? AND end_at>?',[u.studio_id,b.trainer_id,b.end_at,b.start_at]);if(blocked.length)fail('Trainer is unavailable during this interval.',409);
 const availability=await rows(c,'SELECT * FROM trainer_availability WHERE studio_id=? AND trainer_id=?',[u.studio_id,b.trainer_id]);
 const dayName=new Intl.DateTimeFormat('en-US',{timeZone:studio.settings.timezone||'Asia/Manila',weekday:'short'}).format(new Date(b.start_at+'Z')),day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(dayName);
 if(availability.length&&!availability.some(a=>a.branch_id===Number(b.branch_id)&&a.day_of_week===day&&a.start_time.slice(0,5)<=localStart&&a.end_time.slice(0,5)>=localEnd))fail('Class is outside trainer availability.');
 }
 return room;
}
export async function book(u,b){return tx(async c=>{
 const s=await owned(c,'schedules',b.schedule_id,u,true);memberScope(u,b.member_id);await owned(c,'members',b.member_id,u);
 if(s.status!=='Published'||new Date(s.start_at+'Z')<=new Date())fail('This class is no longer open for booking.');
 const [studio]=await rows(c,'SELECT settings FROM studios WHERE id=?',[u.studio_id]);if(new Date(s.start_at+'Z')-Date.now()>studio.settings.booking_window_days*86400000)fail('Class is outside the booking window.');
 await promote(c,u,s);
 const m=await owned(c,'memberships',b.membership_id,u,true);if(m.member_id!==Number(b.member_id))fail('Membership belongs to another member.');
 if(m.status!=='Active'||m.start_at>s.start_at.slice(0,10)||m.end_at<s.start_at.slice(0,10))fail('Membership is not active for this class date.');
 if(m.terms.branch_ids?.length&&!m.terms.branch_ids.includes(s.branch_id))fail('Membership is not eligible at this branch.');
 if(m.terms.class_ids?.length&&!m.terms.class_ids.includes(s.class_id))fail('Membership does not include this class.');
 const [{n}]=await rows(c,"SELECT COUNT(*) n FROM bookings WHERE schedule_id=? AND status IN ('Confirmed','Offered','Present','Late','No-Show')",[s.id]);
 const status=n>=s.capacity?'Waitlisted':'Confirmed';if(status==='Confirmed'&&m.available!==null&&m.available<1)fail('No available credits.');
 const [r]=await c.query('INSERT INTO bookings (studio_id,schedule_id,member_id,membership_id,status) VALUES (?,?,?,?,?)',[u.studio_id,s.id,b.member_id,m.id,status]);
 if(status==='Confirmed'){await c.query('UPDATE memberships SET available=IF(available IS NULL,NULL,available-1),reserved=reserved+1 WHERE id=?',[m.id]);await ledger(c,u,m.id,r.insertId,'Reserve',-1);}
 await audit(c,u,'Bookings',status,r.insertId);await notify(c,u,b.member_id,`Booking ${status.toLowerCase()}`,status==='Waitlisted'?'You have joined the queue. No credit has been reserved.':'Your place is reserved. See My Bookings for check-in.');return {id:r.insertId,status};
 });}
export async function expireOffers(c,u,s){
 await c.query("UPDATE bookings SET status='Expired' WHERE schedule_id=? AND status='Offered' AND offer_expires_at<UTC_TIMESTAMP()",[s.id]);
}
export async function promote(c,u,s){
 await expireOffers(c,u,s);
 const [{n}]=await rows(c,"SELECT COUNT(*) n FROM bookings WHERE schedule_id=? AND status IN ('Confirmed','Offered','Present','Late','No-Show')",[s.id]);if(n>=s.capacity)return;
 const [studio]=await rows(c,'SELECT settings FROM studios WHERE id=?',[u.studio_id]);
 const queue=await rows(c,"SELECT * FROM bookings WHERE schedule_id=? AND status='Waitlisted' ORDER BY booked_at,id FOR UPDATE",[s.id]);
 for(const b of queue){const m=await owned(c,'memberships',b.membership_id,u,true);if(m.status!=='Active'||m.end_at<s.start_at.slice(0,10)||(m.available!==null&&m.available<1))continue;
 await c.query("UPDATE bookings SET status='Offered',offer_expires_at=DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? MINUTE) WHERE id=?",[studio.settings.waitlist_offer_minutes||60,b.id]);await notify(c,u,b.member_id,'A place opened up','Accept your waitlist offer from My Bookings before it expires. Credits will be reserved when you accept.');await audit(c,u,'Waitlist','Offer',b.id);break;}
}
export async function bookingAction(u,id,action,body={}){return tx(async c=>{
 const initial=await owned(c,'bookings',id,u);memberScope(u,initial.member_id);const s=await owned(c,'schedules',initial.schedule_id,u,true),b=await owned(c,'bookings',id,u,true),m=await owned(c,'memberships',b.membership_id,u,true);
 if(action==='accept'){
 if(b.status!=='Offered'||new Date(b.offer_expires_at+'Z')<new Date())fail('This offer is no longer available.');
 if(m.status!=='Active'||m.end_at<s.start_at.slice(0,10)||m.start_at>s.start_at.slice(0,10)||(m.available!==null&&m.available<1))fail('Membership is no longer eligible.');
 await c.query("UPDATE bookings SET status='Confirmed',offer_expires_at=NULL WHERE id=?",[id]);await c.query('UPDATE memberships SET available=IF(available IS NULL,NULL,available-1),reserved=reserved+1 WHERE id=?',[m.id]);await ledger(c,u,m.id,id,'Reserve',-1,'Waitlist offer accepted');await audit(c,u,'Waitlist','Accept',id);return {message:'Your place is confirmed.'};
 }
 if(action==='token'){if(b.status!=='Confirmed')fail('Only confirmed bookings can check in.');const token=crypto.randomBytes(32).toString('hex');await c.query('UPDATE bookings SET checkin_hash=?,checkin_expires=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 10 MINUTE) WHERE id=?',[crypto.createHash('sha256').update(token).digest('hex'),id]);return {token,expires_in:600};}
 if(action==='cancel'){
 if(!['Confirmed','Waitlisted','Offered'].includes(b.status))fail('This booking cannot be cancelled.');
 const [studio]=await rows(c,'SELECT settings FROM studios WHERE id=?',[u.studio_id]);const eligible=new Date(s.start_at+'Z')-Date.now()>=studio.settings.cancellation_hours*3600000;
 if(b.status==='Confirmed'){await c.query('UPDATE memberships SET reserved=reserved-1,available=IF(available IS NULL,NULL,available+?),used=used+? WHERE id=?',[eligible?1:0,eligible?0:1,m.id]);await ledger(c,u,m.id,id,eligible?'Release':'Forfeit',eligible?1:0,body.reason||'Cancellation policy applied');}
 await c.query("UPDATE bookings SET status='Cancelled',cancelled_at=UTC_TIMESTAMP(),reason=? WHERE id=?",[body.reason||'Cancelled',id]);await promote(c,u,s);await audit(c,u,'Bookings','Cancel',id);return {message:eligible?'Booking cancelled; reserved credit released.':'Booking cancelled; cancellation cutoff passed, credit forfeited.'};
 }
 if(['Present','Late','No-Show'].includes(action)){
 if(b.status!=='Confirmed')fail('Booking has already been processed or is not confirmed.',409);
 const [studio]=await rows(c,'SELECT settings FROM studios WHERE id=?',[u.studio_id]);const now=Date.now(),start=+new Date(s.start_at+'Z'),end=+new Date(s.end_at+'Z');
 if(action==='No-Show'&&now<end)fail('No-show can only be recorded after the class ends.');
 if(action!=='No-Show'&&(now<start-studio.settings.checkin_before_minutes*60000||now>end+studio.settings.checkin_after_minutes*60000))fail('Outside the class check-in window.');
 if(u.role==='Member'){if(!body.token||crypto.createHash('sha256').update(body.token).digest('hex')!==b.checkin_hash||new Date(b.checkin_expires+'Z')<new Date())fail('Check-in token is invalid or expired.');}
 await c.query('INSERT INTO attendance (studio_id,booking_id,status,checked_in_at,user_id) VALUES (?,?,?,UTC_TIMESTAMP(),?)',[u.studio_id,id,action,u.id]);
 const release=action==='No-Show'&&!studio.settings.no_show_forfeit;
 await c.query('UPDATE memberships SET reserved=reserved-1,used=used+?,available=IF(available IS NULL,NULL,available+?) WHERE id=?',[release?0:1,release?1:0,m.id]);await ledger(c,u,m.id,id,release?'Release':action==='No-Show'?'Forfeit':'Consume',release?1:0);
 await c.query('UPDATE bookings SET status=?,checkin_hash=NULL WHERE id=?',[action,id]);await audit(c,u,'Attendance',action,id);return {message:'Attendance recorded.'};
 }fail('Unknown booking action.');});}
