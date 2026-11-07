import {rows,audit} from './db.js';
import {notify} from './domain.js';
export async function promoteRetreat(c,u,r){
 await c.query("UPDATE retreat_registrations SET status='Expired' WHERE retreat_id=? AND status='Offered' AND offer_expires_at<UTC_TIMESTAMP()",[r.id]);
 if(r.status!=='Published'||new Date(r.registration_close+'Z')<new Date())return;
 const [{n}]=await rows(c,"SELECT COALESCE(SUM(seats),0) n FROM retreat_registrations WHERE retreat_id=? AND status IN ('Confirmed','Offered')",[r.id]);
 const queue=await rows(c,"SELECT * FROM retreat_registrations WHERE retreat_id=? AND status='Waitlisted' ORDER BY created_at,id FOR UPDATE",[r.id]);const next=queue.find(q=>q.seats<=r.capacity-n);if(!next)return;
 await c.query("UPDATE retreat_registrations SET status='Offered',offer_expires_at=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 60 MINUTE) WHERE id=?",[next.id]);if(next.member_id)await notify(c,u,next.member_id,'Retreat places opened up','Accept your retreat waitlist offer within 60 minutes from Retreats → Registrations.');await audit(c,u,'Retreats','Waitlist offer',next.id);
}
