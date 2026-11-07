export const recordTypes:Record<string,[string,string]>={
 schedules:['CS','Class Sched ID'],members:['MEM','Member ID'],memberships:['MS','Membership ID'],bookings:['BK','Booking ID'],classes:['CL','Class ID'],trainers:['TR','Trainer ID'],plans:['PL','Plan ID'],branches:['BR','Branch ID'],rooms:['RM','Room ID'],rentals:['RNT','Rental ID'],retreats:['RT','Retreat ID'],retreat_registrations:['REG','Registration ID'],retreat_itinerary:['IT','Activity ID'],payments:['PAY','Payment ID'],invoices:['INV','Invoice ID'],refunds:['REF','Refund ID'],users:['USR','User ID'],studios:['ST','Studio ID'],credit_transactions:['CT','Credit ID'],activity_logs:['LOG','Log ID'],notification_rules:['NR','Rule ID'],notifications:['NT','Notification ID'],import_jobs:['IMP','Import ID'],trainer_availability:['TA','Availability ID'],trainer_unavailability:['TU','Time Off ID'],room_blocks:['RB','Room Block ID']
};
export const foreignResources:Record<string,string>={schedule_id:'schedules',member_id:'members',membership_id:'memberships',booking_id:'bookings',class_id:'classes',trainer_id:'trainers',plan_id:'plans',branch_id:'branches',room_id:'rooms',rental_id:'rentals',retreat_id:'retreats',registration_id:'retreat_registrations',invoice_id:'invoices',payment_id:'payments',user_id:'users',studio_id:'studios',rule_id:'notification_rules'};
export function displayId(prefix:string,id:unknown):string{return id===null||id===undefined||id===''?'?':`${prefix}-${String(id).padStart(3,'0')}`;}
export function recordId(resource:string,id:unknown):string{return displayId(recordTypes[resource]?.[0]||'REC',id);}
export function viewResource(page:string,tab:string):string{
 if(page==='Finance'||page==='My Payments')return tab==='Invoices'?'invoices':tab==='Refunds'?'refunds':'payments';
 if(page==='System')return ({Branches:'branches','Rooms & facilities':'rooms','Staff & users':'users',Reminders:'notification_rules','Activity logs':'activity_logs'} as Record<string,string>)[tab||'Branches']||'activity_logs';
 if(page==='Retreats')return tab==='Registrations'?'retreat_registrations':tab==='Itinerary'?'retreat_itinerary':'retreats';
 if((page==='Memberships'||page==='My Membership')&&tab==='Plans')return 'plans';
 if((page==='Memberships'||page==='My Membership')&&tab==='Credit ledger')return 'credit_transactions';
 return ({'Class Schedule':'schedules',Members:'members',Memberships:'memberships','My Membership':'memberships',Bookings:'bookings','My Bookings':'bookings',Attendance:'bookings','My Attendance':'bookings',Classes:'classes',Trainers:'trainers',Rentals:'rentals',Reports:'classes','Membership Plans':'plans'} as Record<string,string>)[page]||'notifications';
}
export function referenceResource(row:Record<string,any>):string|undefined{
 if(row.type==='Membership')return 'memberships';if(row.type==='Rental')return 'rentals';if(row.type==='Retreat')return 'retreat_registrations';
 const module=String(row.module||'').toLowerCase();
 if(module==='finance')return row.action==='Refund'?'refunds':'payments';
 if(module==='retreats')return row.action==='Add itinerary'?'retreats':'retreat_registrations';
 if(module==='trainers'&&row.action==='Availability added')return 'trainer_availability';
 if(module==='trainers'&&row.action==='Unavailability added')return 'trainer_unavailability';
 if(module==='rooms'&&row.action==='Block added')return 'room_blocks';
 if(module==='attendance'||module==='waitlist')return 'bookings';
 if(module==='import')return 'import_jobs';
 return ({schedules:'schedules',schedule:'schedules',bookings:'bookings',memberships:'memberships',users:'users',settings:'studios'} as Record<string,string>)[module]||(recordTypes[module]?module:undefined);
}
export function formatRecordValue(key:string,value:any,row:Record<string,any>,resource:string):any{
 if(key==='branch_ids'||key==='class_ids'){const values=typeof value==='string'?JSON.parse(value):value;return Array.isArray(values)?values.map(id=>recordId(key==='branch_ids'?'branches':'classes',id)):values;}
 if(key==='id')return recordId(resource,value);
 if(foreignResources[key])return recordId(foreignResources[key],value);
 if((key==='reference_id'||key==='reference')&&/^\d+$/.test(String(value))){const target=referenceResource(row);if(target)return recordId(target,value);}
 return value;
}
