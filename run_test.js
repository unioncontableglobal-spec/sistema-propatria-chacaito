const { POST } = require('./.next/server/app/api/asientos/masivo/route.js');
async function test() {
  const req = {
    json: async () => ({ mes: '2026-01' })
  };
  const res = await POST(req);
  if (res.status === 500) {
    const errorBody = await res.json();
    console.log("ERROR 500:", errorBody);
  } else {
    console.log("STATUS:", res.status, await res.json());
  }
}
test().catch(console.error);
