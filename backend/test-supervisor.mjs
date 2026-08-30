const test = async () => {
  const res = await fetch("https://edwards-untitled-positions-reliability.trycloudflare.com/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sami@gmail.com", password: "Rafiq@1234" })
  });
  const data = await res.json();
  console.log("SUPERVISOR LOGIN TEST:", res.status, data.ok ? "✅ " + data.data.user.fullName : "❌");
};
test();
