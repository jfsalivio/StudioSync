import mysql from 'mysql2/promise';
export const pool=mysql.createPool({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3317),user:process.env.DB_USER||'studiosync',password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'studiosync',timezone:'Z',dateStrings:true,connectionLimit:10,decimalNumbers:true,multipleStatements:false});
export async function tx(fn){const c=await pool.getConnection();try{await c.beginTransaction();const r=await fn(c);await c.commit();return r;}catch(e){await c.rollback();throw e;}finally{c.release();}}
export const rows=async(c,sql,args=[])=>{const [r]=await c.query(sql,args);return r;};
export function fail(message,status=400){throw Object.assign(new Error(message),{status});}
export async function audit(c,u,module,action,ref){await c.query('INSERT INTO activity_logs (studio_id,user_id,module,action,reference) VALUES (?,?,?,?,?)',[u.studio_id,u.id,module,action,String(ref)]);}
