import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import {pool,rows,tx} from './db.js';
import {defaults} from './domain.js';
import {migrate} from './migrate.js';
const sql=await fs.readFile(new URL('./schema.sql',import.meta.url),'utf8');for(const statement of sql.split(';').filter(s=>s.trim()))await pool.query(statement);
await migrate();
if((await rows(pool,'SELECT id FROM studios LIMIT 1')).length){console.log('Schema verified. Existing data preserved.');await pool.end();process.exit(0);}
const pw=await bcrypt.hash('StudioSync!2026',12);
await tx(async c=>{
 await c.query('INSERT INTO studios (name,email,address,settings) VALUES (?,?,?,?)',['Pura Yoga Makati','hello@pura.example','Ground Floor, Eton Residences Greenbelt, Legaspi Street, Makati',JSON.stringify(defaults)]);
 await c.query("INSERT INTO branches (studio_id,name,address,contact,is_main) VALUES (1,'Makati','Eton Residences Greenbelt, Legaspi Street, Makati','+63 906 013 4339',TRUE)");
 await c.query("INSERT INTO rooms (studio_id,branch_id,name,capacity,description) VALUES (1,1,'Main Practice Room',15,'A quiet, light-filled space for movement and mindfulness.')");
 for(const [name,role,mail,mid] of [['Studio Admin','Admin','admin@studiosync.local',null],['Front Desk','Staff','staff@studiosync.local',null],['Sofia Reyes','Member','member@studiosync.local',1]])await c.query('INSERT INTO users (studio_id,name,email,password_hash,role,branch_ids,member_id) VALUES (1,?,?,?,?,?,?)',[name,mail,pw,role,'[1]',mid]);
 const trainers=[['Talor','Hatha Vinyasa, Mat Pilates'],['Isabel','Hatha Vinyasa, Sound Healing'],['Helen','Vinyasa, Yin Yoga'],['Hanna','Yogilates'],['Natasha','Yogilates']];
 for(const [first_name,specialization] of trainers)await c.query('INSERT INTO trainers (studio_id,branch_id,first_name,email,specialization) VALUES (1,1,?,?,?)',[first_name,first_name.toLowerCase()+'@pura.example',specialization]);
 const classes=[['Hatha Yoga','Yoga',60,12,650],['Vinyasa Yoga','Yoga',60,12,700],['Hatha Vinyasa','Yoga',60,12,700],['Yin Yoga','Yoga',75,10,750],['Acro Yoga','Yoga',90,12,900],['Mat Pilates','Pilates',60,10,750],['Yogilates','Hybrid Fitness',60,12,750],['Guided Meditation','Meditation',60,15,550],['Breathwork','Wellness',60,12,700],['Sound Healing','Sound Therapy',60,12,1000],['Yin Yoga & Sound Healing','Workshop',90,10,1500]];
 for(const [name,type,duration,capacity,price] of classes)await c.query('INSERT INTO classes (studio_id,name,type,duration,capacity,price,description) VALUES (1,?,?,?,?,?,?)',[name,type,duration,capacity,price,'A mindful practice for every body. Sample class details and pricing.']);
 const plans=[['Single Class Drop-in',1,7,799],['Starter Package',5,30,3500],['Regular Package',10,60,6500],['Wellness Package',20,90,12000],['Monthly Unlimited',null,30,7500],['Private Yoga Session',1,30,2000]];
 for(const [name,credits,duration,price] of plans)await c.query('INSERT INTO plans (studio_id,name,credits,duration,price,description,branch_ids,class_ids) VALUES (1,?,?,?,?,?,\'[1]\',\'[]\')',[name,credits,duration,price,'Sample package — not an official Pura Yoga rate.']);
 const names=['Sofia Reyes','Miguel Santos','Isabella Cruz','Lucas Garcia','Amara Flores','Noah Mendoza','Mia Torres','Elijah Ramos','Ava Navarro','Liam Castillo','Chloe Bautista','Ethan Lim','Gabriela Tan','Daniel Rivera','Olivia Aquino','Mateo Fernandez','Luna Villanueva','Andres Dela Cruz','Camila Perez','Rafael Diaz','Julia Mercado','Sebastian Ong','Aria Pascual','Gabriel Chua'];
 for(let i=0;i<names.length;i++){
 const [first,...last]=names[i].split(' '),plan=(i%4)+2;await c.query('INSERT INTO members (studio_id,branch_id,first_name,last_name,email,contact,joined_at) VALUES (1,1,?,?,?,?,DATE_SUB(UTC_DATE(),INTERVAL ? DAY))',[first,last.join(' '),`${first.toLowerCase()}.${i+1}@example.com`,'+63 917 000 '+String(i+1).padStart(4,'0'),i*3+5]);
 const [p]=await rows(c,'SELECT * FROM plans WHERE id=?',[plan]);const [m]=await c.query("INSERT INTO memberships (studio_id,member_id,plan_id,start_at,end_at,available,price,terms) VALUES (1,?,?,DATE_SUB(UTC_DATE(),INTERVAL 5 DAY),DATE_ADD(UTC_DATE(),INTERVAL 25 DAY),?,?,?)",[i+1,plan,p.credits,p.price,JSON.stringify(p)]);
 await c.query("INSERT INTO credit_transactions (studio_id,membership_id,type,delta,user_id,notes) VALUES (1,?,'Issue',?,1,'Sample membership credits')",[m.insertId,p.credits||0]);
 const [inv]=await c.query("INSERT INTO invoices (studio_id,branch_id,member_id,customer,type,reference_id,amount,status,snapshot) VALUES (1,1,?,?,'Membership',?,?,'Paid',?)",[i+1,names[i],m.insertId,p.price,JSON.stringify(p)]);await c.query("INSERT INTO payments (studio_id,invoice_id,amount,method,reference,user_id,created_at) VALUES (1,?,?,?,'SAMPLE',1,DATE_SUB(UTC_TIMESTAMP(),INTERVAL ? DAY))",[inv.insertId,p.price,['GCash','Cash','Bank Transfer'][i%3],i%7]);
 }
 const base=new Date();base.setUTCHours(0,0,0,0);
 for(let day=-6;day<15;day++)for(let slot=0;slot<3;slot++){
 const start=new Date(+base+day*86400000+(slot===0?1:slot===1?8:10)*3600000),end=new Date(+start+3600000),cid=[1,6,3,2,7,10,3][((day+7)%7+slot)%7],trainer=[2,1,3,3,4,2,2][((day+7)%7+slot)%7];
 const [r]=await c.query('INSERT INTO schedules (studio_id,branch_id,room_id,trainer_id,class_id,start_at,end_at,capacity) VALUES (1,1,1,?,?,?,?,12)',[trainer,cid,start,end]);
 const booked=day<=0?4+(day+6+slot)%7:slot+2;
 for(let k=0;k<booked;k++){const mid=(k+slot*7)%24+1;if(day<0){const [b]=await c.query("INSERT INTO bookings (studio_id,schedule_id,member_id,membership_id,status) VALUES (1,?,?,?,'Present')",[r.insertId,mid,mid]);await c.query("INSERT INTO attendance (studio_id,booking_id,status,checked_in_at,user_id) VALUES (1,?,'Present',?,1)",[b.insertId,start]);}else if(day<3){const [m]=await rows(c,'SELECT * FROM memberships WHERE id=?',[mid]);if(m.available!==null&&m.available<1)continue;const [b]=await c.query("INSERT INTO bookings (studio_id,schedule_id,member_id,membership_id) VALUES (1,?,?,?)",[r.insertId,mid,mid]);await c.query('UPDATE memberships SET available=IF(available IS NULL,NULL,available-1),reserved=reserved+1 WHERE id=?',[mid]);await c.query("INSERT INTO credit_transactions (studio_id,membership_id,booking_id,type,delta,user_id) VALUES (1,?,?,'Reserve',-1,1)",[mid,b.insertId]);}}
 }
 for(const [title,venue,days,fee,capacity] of [['Weekend Yoga & Mindfulness Retreat','Batangas',14,8500,15],['Yoga & Sound Healing Retreat','Tagaytay',28,12500,12],['Meditation & Breathwork Day Retreat','Makati',21,3500,15]])await c.query('INSERT INTO retreats (studio_id,branch_id,title,description,venue,start_at,end_at,capacity,fee,registration_close,itinerary) VALUES (1,1,?,?,?,?,?,?,?,?,?)',[title,'Fictional sample retreat. Slow down, reconnect, and make room for yourself.',venue,new Date(+base+days*86400000),new Date(+base+(days+2)*86400000),capacity,fee,new Date(+base+(days-2)*86400000),JSON.stringify([{day:1,activity:'Arrival & grounding practice'},{day:1,activity:'Mindful movement and breathwork'},{day:2,activity:'Sunrise yoga & closing circle'}])]);
 await c.query("INSERT INTO notifications (studio_id,member_id,title,message) VALUES (1,1,'Welcome to your practice','Your sample membership is ready. Explore the schedule and find your next class.')");
 await c.query("INSERT INTO activity_logs (studio_id,user_id,module,action,reference) VALUES (1,1,'System','Sample studio created','Demo data')");
});
console.log('Sample studio seeded. Local demo accounts: admin@studiosync.local, staff@studiosync.local, member@studiosync.local — password: StudioSync!2026');await pool.end();
