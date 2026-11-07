import {pool,rows} from './db.js';
export async function migrate(){
 const columns=await rows(pool,"SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='bookings' AND COLUMN_NAME='offer_expires_at'");
 if(!columns.length)await pool.query('ALTER TABLE bookings ADD COLUMN offer_expires_at DATETIME NULL');
 const retreatColumns=await rows(pool,"SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='retreat_registrations' AND COLUMN_NAME='offer_expires_at'");
 if(!retreatColumns.length)await pool.query('ALTER TABLE retreat_registrations ADD COLUMN offer_expires_at DATETIME NULL');
 await pool.query('ALTER TABLE bookings MODIFY COLUMN active_key VARCHAR(100) GENERATED ALWAYS AS (CASE WHEN status IN (\'Confirmed\',\'Waitlisted\',\'Offered\',\'Present\',\'Late\',\'No-Show\') THEN CONCAT(member_id,\':\',schedule_id) ELSE NULL END) STORED');
}
