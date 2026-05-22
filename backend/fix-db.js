const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres:6dc2be2aea00728374bf2e867f0760604a4bf99375a61d9178debc5b52427eea@localhost:5432/rafiq_v2?schema=public"
  });
  await client.connect();
  
  try { await client.query("ALTER TABLE staff_attendance_records ALTER COLUMN check_in_geo_state TYPE VARCHAR USING check_in_geo_state::text;"); } catch(e) {}
  try { await client.query("ALTER TABLE staff_attendance_records ALTER COLUMN check_out_geo_state TYPE VARCHAR USING check_out_geo_state::text;"); } catch(e) {}
  try { await client.query("UPDATE staff_attendance_records SET check_in_geo_state = 'NOT_SENT' WHERE check_in_geo_state = 'UNAVAILABLE';"); } catch(e) {}
  try { await client.query("UPDATE staff_attendance_records SET check_out_geo_state = 'NOT_SENT' WHERE check_out_geo_state = 'UNAVAILABLE';"); } catch(e) {}
  try { await client.query("ALTER TABLE staff_attendance_records ALTER COLUMN check_in_geo_state DROP DEFAULT;"); } catch(e) {}
  try { await client.query("ALTER TABLE staff_attendance_records ALTER COLUMN check_out_geo_state DROP DEFAULT;"); } catch(e) {}
  
  console.log("Fixed GeoState enum");
  await client.end();
}

run().catch(console.error);
