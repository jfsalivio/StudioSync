import {test,expect} from '@playwright/test';
test('registration layout, password feedback, visibility, and required terms',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Register your studio',exact:true}).first().click();
 const modal=page.locator('.register-modal');await expect(modal).toBeVisible();
 const branch=await modal.getByLabel('Main Branch Address',{exact:true}).boundingBox(),password=await modal.getByLabel('Password',{exact:true}).boundingBox(),confirm=await modal.getByLabel('Confirm Password',{exact:true}).boundingBox();
 expect(Math.abs(branch.width-password.width)).toBeLessThan(2);expect(password.y).toBeGreaterThan(branch.y);expect(confirm.y).toBeGreaterThan(password.y);expect(Math.abs(password.x-confirm.x)).toBeLessThan(2);
 await modal.getByLabel('Password',{exact:true}).fill('weak');await expect(modal.locator('.password-rules .met')).toHaveCount(1);
 await modal.getByLabel('Password',{exact:true}).fill('MyStudio2026');await expect(modal.locator('.password-rules .met')).toHaveCount(4);
 await modal.getByRole('button',{name:'Show password',exact:true}).first().click();await expect(modal.getByLabel('Password',{exact:true})).toHaveAttribute('type','text');
 await modal.getByRole('button',{name:'Hide password',exact:true}).click();await expect(modal.getByLabel('Password',{exact:true})).toHaveAttribute('type','password');
 await modal.getByLabel('Confirm Password',{exact:true}).fill('Different123');await expect(modal.getByText('Passwords do not match',{exact:true})).toBeVisible();
 const terms=modal.getByRole('checkbox',{name:'I accept the platform terms',exact:true});await expect(terms).not.toBeChecked();await expect(terms).toHaveAttribute('required','');await terms.check();await expect(terms).toBeChecked();
 await expect(modal.getByRole('button',{name:'Create your studio'}).locator('svg')).toHaveCount(0);
 await page.screenshot({path:'.runtime/registration.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
