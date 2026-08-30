const test = async () => {
  const teachers = [
    "mahmood@gmail.com",
    "hoda@gmail.com",
    "basheer@gmail.com",
    "ans@gmail.com",
    "ismaell@gmail.com",
    "teacher@finance-test.invalid"
  ];

  for (const email of teachers) {
    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Rafiq@1234" })
    });
    const data = await res.json();
    console.log(`Teacher ${email} -> ${res.status} ${data.ok ? "✅ " + data.data.user.fullName + " (Role: " + data.data.user.role + ")" : "❌ " + data.message}`);
  }
};
test();
