export function passwordError(value){
 if(typeof value!=='string'||value.length<10||Buffer.byteLength(value,'utf8')>72)return 'Use 10–72 characters (maximum 72 UTF-8 bytes).';
 if(!/[A-Z]/.test(value)||!/[a-z]/.test(value)||!/[0-9]/.test(value))return 'Include an uppercase letter, a lowercase letter, and a number.';
 return '';
}
