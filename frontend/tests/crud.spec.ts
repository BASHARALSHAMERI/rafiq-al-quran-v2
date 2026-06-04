import { test, expect } from '@playwright/test';

test.describe('Web UI CRUD & Error State Testing', () => {
  let consoleErrors: string[] = [];
  let failedRequests: string[] = [];

  // State flags for dynamic mock control
  let isLoggedIn = false;
  let centersHttpStatus = 200;
  
  const mockCentersList = [
    { id: 1, name: 'مركز الخير', nameAr: 'مركز الخير', code: 'C01', gender: 'MALE', isActive: true, centerAdmin: { fullName: 'أحمد' }, centerSupervisors: [] },
    { id: 2, name: 'مركز الهداية', nameAr: 'مركز الهداية', code: 'C02', gender: 'FEMALE', isActive: false, centerAdmin: { fullName: 'فاطمة' }, centerSupervisors: [] }
  ];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    failedRequests = [];
    isLoggedIn = false;
    centersHttpStatus = 200;
    
    // Reset list
    mockCentersList.length = 0;
    mockCentersList.push(
      { id: 1, name: 'مركز الخير', nameAr: 'مركز الخير', code: 'C01', gender: 'MALE', isActive: true, centerAdmin: { fullName: 'أحمد' }, centerSupervisors: [] },
      { id: 2, name: 'مركز الهداية', nameAr: 'مركز الهداية', code: 'C02', gender: 'FEMALE', isActive: false, centerAdmin: { fullName: 'فاطمة' }, centerSupervisors: [] }
    );

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('401') || text.includes('ERR_CONNECTION_REFUSED') || text.includes('500')) return;
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // 1. Mock Branding Endpoint (Port 4000)
    await page.route('*://localhost:4000/public/branding', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 1, name: 'رفقاء القرآن', logoUrl: '/brand/rafiq-logo.svg' }
        })
      });
    });

    // 2. Mock Auth Me Endpoint (Port 4000)
    await page.route('*://localhost:4000/auth/me', async (route) => {
      if (isLoggedIn) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 99, username: 'admin', fullName: 'المدير العام', role: 'SUPER_ADMIN' }
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false })
        });
      }
    });

    // 3. Mock Auth Refresh Session Endpoint (Port 4000)
    await page.route('*://localhost:4000/auth/refresh', async (route) => {
      if (isLoggedIn) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: 'mock-access-token',
              user: { id: 99, username: 'admin', fullName: 'المدير العام', role: 'SUPER_ADMIN' }
            }
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false })
        });
      }
    });

    // 4. Mock Login Endpoint (Port 4000)
    await page.route('*://localhost:4000/auth/login', async (route) => {
      isLoggedIn = true; // Turn on auth flag upon successful login request
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock-access-token',
            user: { id: 99, username: 'admin', fullName: 'المدير العام', role: 'SUPER_ADMIN' }
          }
        })
      });
    });

    // 5. Mock Centers Endpoint (GET, POST) (Port 4000)
    await page.route('*://localhost:4000/org/centers', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        if (centersHttpStatus === 500) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, message: 'Internal Server Error' })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: mockCentersList })
          });
        }
      } else if (method === 'POST') {
        const payload = route.request().postDataJSON();
        const newCenter = {
          id: mockCentersList.length + 1,
          name: payload.nameAr,
          nameAr: payload.nameAr,
          code: `C0${mockCentersList.length + 1}`,
          gender: payload.gender,
          isActive: true,
          centerAdmin: { fullName: 'أحمد' },
          centerSupervisors: []
        };
        mockCentersList.push(newCenter);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: newCenter })
        });
      }
    });

    // 6. Mock Status PATCH Endpoint (Port 4000)
    await page.route(/\/org\/centers\/\d+\/status/, async (route) => {
      const url = route.request().url();
      const match = url.match(/\/centers\/(\d+)\/status/);
      const centerId = match ? Number(match[1]) : 1;
      const payload = route.request().postDataJSON();
      const center = mockCentersList.find(c => c.id === centerId);
      if (center) {
        center.isActive = payload.isActive;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: center })
      });
    });

    // 7. Mock Auxiliary data endpoints (Port 4000)
    await page.route('*://localhost:4000/users*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { items: [{ id: 1, fullName: 'أحمد', isActive: true }] } }) });
    });
    await page.route('*://localhost:4000/org/circles*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { items: [] } }) });
    });
    await page.route('*://localhost:4000/staff-schedules*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) });
    });
  });

  test('should handle login, render list, perform CRUD actions with confirmation, and handle tech errors', async ({ page }) => {
    
    // --- Phase 1: Authentication & Navigation ---
    
    // Navigate to dashboard - should redirect to /login
    await page.goto('/');
    await page.waitForSelector('.app-splash', { state: 'detached', timeout: 5000 });
    await expect(page).toHaveURL(/.*\/login/);

    // Fill login form
    await page.locator('input[autocomplete="username"]').fill('superadmin@rafiq.local');
    await page.locator('input[autocomplete="current-password"]').fill('Rafiq@1234');
    await page.locator('button[type="submit"]').click();

    // Wait for automatic redirect to /dashboard after login
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Navigate to centers page
    await page.goto('/org/centers');
    
    console.log('--- DEBUG INFO ---');
    console.log('Console Errors:', consoleErrors);
    console.log('Failed Requests:', failedRequests);
    console.log('Current URL:', page.url());
    console.log('------------------');

    await expect(page.locator('h1')).toContainText(/إدارة المراكز/);
    
    // Verify centers list renders correctly
    await expect(page.locator('text=مركز الخير')).toBeVisible();
    await expect(page.locator('text=مركز الهداية')).toBeVisible();

    // --- Phase 2: Create (Save) Operation ---

    // Click "إضافة مركز" (Add Center) button
    await page.locator('button:has-text("إضافة مركز")').click();

    // Fill form modal fields
    await page.locator('#ctr-name-ar').fill('مركز الإيمان');
    await page.locator('#ctr-gender').selectOption('MALE');
    await page.locator('#ctr-admin').selectOption({ value: '1' });
    await page.locator('button:has-text("إنشاء المركز")').click();

    // Verify modal is closed
    await expect(page.locator('#ctr-name-ar')).not.toBeVisible();

    // --- Phase 3: Deactivate Confirmation ---

    // Click the status toggle button (the Power button icon is the first action button in grid actions)
    const statusToggleButton = page.locator('.ctr-center-card__actions button').first();
    await statusToggleButton.click();

    // Verify that the ConfirmModal is displayed
    const confirmModalTitle = page.locator('text=تعطيل المركز');
    await expect(confirmModalTitle).toBeVisible();

    // Confirm the action by clicking "تعطيل" inside the modal
    await page.locator('.circlemod-footer button:has-text("تعطيل"), button:has-text("تعطيل")').first().click();

    // Verify modal is closed
    await expect(confirmModalTitle).not.toBeVisible();

    // --- Phase 4: Technical Error boundary Testing (500 Error handling) ---

    // Set HTTP status to 500 in state
    centersHttpStatus = 500;

    // Click Refresh to trigger reload and fail
    await page.locator('button:has-text("تحديث")').click();

    // Verify that the page shows the ErrorState component
    const errorStateText = page.locator('text=تعذر تحميل المراكز');
    await expect(errorStateText).toBeVisible();

    // Verify no programmer leakage (stack traces, raw JSON, undefined)
    const pageText = await page.innerText('body');
    const leakRegex = /(?:Cannot read properties of|stack trace|TypeError:)/i;
    expect(pageText).not.toMatch(leakRegex);

    // Verify that there are no uncaught JavaScript exceptions in console
    expect(consoleErrors).toEqual([]);
  });
});
