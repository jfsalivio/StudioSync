import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const directory=path.resolve('.runtime/backups');fs.mkdirSync(directory,{recursive:true});
const file=path.join(directory,`studiosync-${new Date().toISOString().replaceAll(':','-')}.sql`);
const bin=process.env.MYSQL_BIN||'C:/Program Files/MySQL/MySQL Server 8.0/bin';
const output=fs.openSync(file,'wx');
const child=spawn(path.join(bin,'mysqldump.exe'),['--host=127.0.0.1','--port=3317','--user=studiosync','--single-transaction','--no-tablespaces','--set-gtid-purged=OFF','studiosync'],{env:{...process.env,MYSQL_PWD:process.env.DB_PASSWORD},stdio:['ignore',output,'pipe'],windowsHide:true});
let error='';child.stderr.on('data',d=>error+=d);child.on('error',e=>{console.error(e.message);process.exitCode=1;});child.on('close',code=>{fs.closeSync(output);if(code){console.error(error);process.exitCode=code;}else console.log('Database backup created: '+file);});
