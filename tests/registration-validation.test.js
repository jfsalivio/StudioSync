import {test} from 'node:test';
import assert from 'node:assert/strict';
import {passwordError} from '../server/registration-validation.js';
test('new passwords require uppercase, lowercase, numbers, and sufficient length',()=>{
 for(const value of ['shortA1','alllowercase123','ALLUPPERCASE123','NoNumbersHere','a'.repeat(73)+'A1'])assert.ok(passwordError(value));
 assert.equal(passwordError('MyStudio2026'),'');
 assert.ok(passwordError('Ä'.repeat(36)+'A1'));
});
