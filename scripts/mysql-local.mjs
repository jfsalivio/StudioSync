import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import {spawn,spawnSync} from 'node:child_process';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({quiet:true});
const root=process.cwd(), dir=path.join(root,'.runtime/mysql'), bin=process.env.MYSQL_BIN||'C:/Program Files/MySQL/MySQL Server 8.0/bin';
const command=process.argv[2];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function free(port){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve));});}
async function start(){
 await free(3317).catch(()=>{throw Error('Port 3317 is already occupied. Refusing to start or modify any running database.');});
 const p=spawn(path.join(bin,'mysqld.exe'),[`--defaults-file=${path.join(dir,'my.ini')}`],{windowsHide:true,detached:true,stdio:'ignore'});p.unref();
 for(let i=0;i<60;i++){try {const c=await mysql.createConnection({host:'127.0.0.1',port:3317,user:command==='setup'?'root':process.env.DB_USER,password:command==='setup'?'':process.env.DB_PASSWORD});return c;}catch{await wait(500);}}
 throw Error('Dedicated MySQL did not start. Inspect .runtime/mysql/error.log.');
}
if(command==='setup'){
 if(fs.existsSync(path.join(dir,'data'))||fs.existsSync('.env'))throw Error('Existing StudioSync database or .env found; setup will not overwrite it. Use npm run db:start.');
 await free(3317);fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'my.ini'),`[mysqld]\nbasedir="${bin}"\ndatadir="${dir.replaceAll('\\','/')}/data"\nport=3317\nbind-address=127.0.0.1\nmysqlx=OFF\nlog-error="${dir.replaceAll('\\','/')}/error.log"\ncharacter-set-server=utf8mb4\ncollation-server=utf8mb4_0900_ai_ci\ndefault-time-zone=+00:00\n`);
 const init=spawnSync(path.join(bin,'mysqld.exe'),[`--defaults-file=${path.join(dir,'my.ini')}`,'--initialize-insecure'],{windowsHide:true,encoding:'utf8'});
 if(init.status!==0)throw Error(init.stderr||'MySQL initialization failed; see .runtime/mysql/error.log.');
 const c=await start(), password=crypto.randomBytes(24).toString('hex'),rootPassword=crypto.randomBytes(32).toString('hex');
 await c.query('CREATE DATABASE studiosync CHARACTER SET utf8mb4');
 await c.query("CREATE USER 'studiosync'@'127.0.0.1' IDENTIFIED BY ?",[password]);
 await c.query("GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON studiosync.* TO 'studiosync'@'127.0.0.1'");
 await c.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?",[rootPassword]);
 fs.writeFileSync('.env',`DB_HOST=127.0.0.1\nDB_PORT=3317\nDB_NAME=studiosync\nDB_USER=studiosync\nDB_PASSWORD=${password}\nAPI_PORT=4017\nAPP_ORIGIN=http://127.0.0.1:5177\nNODE_ENV=development\n`);
 fs.writeFileSync(path.join(dir,'root-credentials.json'),JSON.stringify({user:'root',password:rootPassword}));await c.end();console.log('Dedicated MySQL ready at 127.0.0.1:3317. Credentials saved to ignored .env. Run npm run db:seed.');
}else if(command==='start'){const c=await start();await c.end();console.log('StudioSync MySQL started on port 3317.');}
else if(command==='stop'){const credentials=JSON.parse(fs.readFileSync(path.join(dir,'root-credentials.json'),'utf8'));const c=await mysql.createConnection({host:'127.0.0.1',port:3317,...credentials});try{await c.query('SHUTDOWN');}finally{await c.end();}console.log('Stopped only the dedicated StudioSync instance.');}
else throw Error('Use setup, start, or stop.');
