const test = async () => {
  const res = await fetch("https://edwards-untitled-positions-reliability.trycloudflare.com/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mahmood@gmail.com", password: "Rafiq@1234" })
  });
  const data = await res.json();
  console.log("CLOUDFLARE LOGIN TEST:", res.status, JSON.stringify(data, null, 2));
};
test();
