import {test,expect} from '@playwright/test';
test('public site, authentication, all admin pages and mobile layout',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:/More room for/})).toBeVisible();
 await page.getByRole('button',{name:'Log in',exact:true}).first().click();
 await page.getByLabel('Email',{exact:false}).fill('admin@studiosync.local');await page.getByLabel('Password',{exact:false}).fill('StudioSync!2026');
 await page.getByRole('button',{name:'Log in',exact:true}).last().click();await expect(page.locator('h1')).toContainText('A good day');
 const pages=['Class Schedule','Bookings','Attendance','Members','Memberships','Classes','Trainers','Rentals','Retreats','Finance','Reports','System','Settings'];
 for(const name of pages){await page.locator('.nav-group').getByRole('button',{name:name==='Bookings'?/Bookings/:name,exact:name!=='Bookings'}).click();await expect(page.locator('h1')).toBeVisible();await expect(page.locator('.page-content>.alert.error')).toHaveCount(0);}
 await page.locator('.nav-group').getByRole('button',{name:'System',exact:true}).click();await page.getByRole('button',{name:'Reminders',exact:true}).click();await expect(page.getByRole('heading',{name:'Thoughtful reminders'})).toBeVisible();
 await page.getByRole('button',{name:'Rooms & facilities',exact:true}).click();await expect(page.getByRole('button',{name:'Block time'})).toBeVisible();
 await page.locator('.nav-group').getByRole('button',{name:'Class Schedule',exact:true}).click();await page.screenshot({path:'.runtime/schedule.png',fullPage:true});
 await page.locator('.nav-group').getByRole('button',{name:'Overview',exact:true}).click();await page.mouse.move(0,0);await page.waitForTimeout(800);await page.screenshot({path:'.runtime/dashboard.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await expect(page.getByRole('button',{name:'Toggle menu'})).toBeVisible();const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);expect(overflow).toBe(false);await page.screenshot({path:'.runtime/mobile.png',fullPage:true});expect(errors).toEqual([]);
});
test('member account has isolated records and can render booking QR codes',async({page,request})=>{
 await page.goto('/');await page.getByRole('button',{name:'Log in',exact:true}).first().click();await page.getByLabel('Email',{exact:false}).fill('member@studiosync.local');await page.getByLabel('Password',{exact:false}).fill('StudioSync!2026');await page.getByRole('button',{name:'Log in',exact:true}).last().click();await expect(page.locator('h1')).toContainText('Your practice');
 const r=await page.request.get('/api/data');const data=await r.json();expect(data.members).toHaveLength(1);expect(data.members[0].id).toBe(1);expect(data.bookings.every(b=>b.member_id===1)).toBe(true);expect(data.payments.every(p=>data.invoices.some(i=>i.id===p.invoice_id))).toBe(true);
 await page.locator('.nav-group').getByRole('button',{name:'My Bookings',exact:true}).click();const qr=page.getByRole('button',{name:'QR code',exact:true});if(await qr.count()){await qr.first().click();await expect(page.locator('.qr-modal svg').last()).toBeVisible();await expect(page.locator('.qr-modal code')).toHaveText(/^[a-f0-9]{64}$/);await page.getByRole('button',{name:'Close QR code'}).click();}
 const denied=await page.request.post('/api/manage/classes',{data:{name:'Unauthorized',type:'Yoga'}});expect(denied.status()).toBe(403);
 await page.locator('.nav-group').getByRole('button',{name:'My Membership',exact:true}).click();await expect(page.locator('h1')).toContainText('My membership');
});
test('admin can add, edit, search and archive a member through real forms',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Log in',exact:true}).first().click();await page.getByLabel('Email',{exact:false}).fill('admin@studiosync.local');await page.getByLabel('Password',{exact:false}).fill('StudioSync!2026');await page.getByRole('button',{name:'Log in',exact:true}).last().click();await expect(page.locator('h1')).toContainText('A good day');
 await page.locator('.nav-group').getByRole('button',{name:'Members',exact:true}).click();await page.getByRole('button',{name:'Add member',exact:true}).click();await page.getByLabel('First name').fill('Browser');await page.getByLabel('Last name').fill('Verification');await page.getByLabel('Email').fill(`browser-${Date.now()}@example.test`);await page.getByRole('button',{name:'Save changes'}).click();await expect(page.locator('.modal')).toHaveCount(0);await page.getByLabel('Search Members').fill('Browser');await expect(page.locator('tbody tr')).toHaveCount(1);
 await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Last name').fill('Verified');await page.getByRole('button',{name:'Save changes'}).click();await expect(page.locator('.modal')).toHaveCount(0);await expect(page.locator('tbody')).toContainText('Browser Verified');
 await page.getByRole('button',{name:'Archive',exact:true}).click();await page.getByRole('button',{name:'Save changes'}).click();await expect(page.locator('.modal')).toHaveCount(0);await expect(page.locator('tbody tr')).toHaveCount(0);
});
test('finance rejects overpayment, refunds above capture, and invalid tenant references',async({request})=>{
 const login=await request.post('/api/auth/login',{data:{email:'admin@studiosync.local',password:'StudioSync!2026'}});expect(login.ok()).toBe(true);
 const data=await(await request.get('/api/data')).json();const invoice=data.invoices.find(i=>i.status==='Paid');const over=await request.post('/api/payments',{data:{invoice_id:invoice.id,amount:1,method:'Cash'}});expect(over.status()).toBe(400);
 const refund=await request.post('/api/refunds',{data:{payment_id:data.payments[0].id,amount:999999,reason:'Test invalid refund'}});expect(refund.status()).toBe(400);
 const invalid=await request.post('/api/bookings',{data:{schedule_id:999999,member_id:1,membership_id:1}});expect(invalid.status()).toBe(404);
});
