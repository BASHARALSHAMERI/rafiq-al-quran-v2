// Test creating an invoice directly via HTTP to the smoke server
const http = require('http');

const BASE_URL = 'http://127.0.0.1:4000';

async function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 1. Login
  const login = await request('POST', '/auth/login', {
    email: 'superadmin@rafiq.local',
    password: 'Rafiq@1234'
  }, null);
  console.log('Login:', login.status);
  const token = login.body.data.accessToken;

  // 2. Try creating fiscal year for 2027 (to see if it works)
  const fy = await request('POST', '/accounting/fiscal-years', {
    year: 2027,
    startDate: '2027-01-01',
    endDate: '2027-12-31',
    periodType: 'MONTHLY'
  }, token);
  console.log('FiscalYear 2027:', fy.status, JSON.stringify(fy.body));

  // 3. Get centers
  const centers = await request('GET', '/org/centers', null, token);
  const centerId = centers.body.data[0].id;
  console.log('Center:', centerId);

  // 4. Get a student
  const students = await request('GET', `/users?role=STUDENT&centerId=${centerId}`, null, token);
  const studentId = students.body.data[0].id;
  console.log('Student:', studentId);

  // 5. Try creating invoice for month 1, 2027
  const invoice = await request('POST', '/finance/v2/invoices', {
    studentId,
    centerId,
    month: 1,
    year: 2027,
    amount: 1000,
    invoiceType: 'TUITION_MONTHLY'
  }, token);
  console.log('Invoice 2027-01:', invoice.status, JSON.stringify(invoice.body));

  // 6. Try invoice for month 1, 2026
  const invoice2 = await request('POST', '/finance/v2/invoices', {
    studentId,
    centerId,
    month: 1,
    year: 2026,
    amount: 1000,
    invoiceType: 'TUITION_MONTHLY'
  }, token);
  console.log('Invoice 2026-01:', invoice2.status, JSON.stringify(invoice2.body));
}

main().catch(e => console.error('MAIN ERROR:', e));
