import bcrypt from "bcryptjs";

import { connectDatabase } from "../config/db.js";
import {
  replaceBudgets,
  replaceExpenses,
  upsertUser as upsertUserRecord,
} from "../data/dataAccess.js";
import { generateMonthlyReport } from "../services/reportingService.js";
import { getMonthKey } from "../utils/formatters.js";

async function upsertUser(email, password, role = "user") {
  const passwordHash = await bcrypt.hash(password, 10);
  return upsertUserRecord({ email, passwordHash, role });
}

async function seed() {
  await connectDatabase();

  const demoUser = await upsertUser("user@example.com", "123456", "user");
  const adminUser = await upsertUser("admin@example.com", "123456", "admin");
  const month = getMonthKey();
  const [year, monthNumber] = month.split("-").map(Number);

  const demoExpenses = [
    { amount: 1200, category: "Food", paymentMethod: "UPI", notes: "Groceries", date: new Date(Date.UTC(year, monthNumber - 1, 2)) },
    { amount: 18000, category: "Rent", paymentMethod: "Net Banking", notes: "Monthly rent", date: new Date(Date.UTC(year, monthNumber - 1, 3)) },
    { amount: 2400, category: "Travel", paymentMethod: "Credit Card", notes: "Cab and metro", date: new Date(Date.UTC(year, monthNumber - 1, 8)) },
    { amount: 3200, category: "Shopping", paymentMethod: "UPI", notes: "Clothes", date: new Date(Date.UTC(year, monthNumber - 1, 14)) },
    { amount: 900, category: "Food", paymentMethod: "Cash", notes: "Dining out", date: new Date(Date.UTC(year, monthNumber - 1, 17)) },
    { amount: 1600, category: "Bills", paymentMethod: "Debit Card", notes: "Electricity and internet", date: new Date(Date.UTC(year, monthNumber - 1, 19)) },
  ];

  const adminExpenses = [
    { amount: 5000, category: "Travel", paymentMethod: "Credit Card", notes: "Team trip", date: new Date(Date.UTC(year, monthNumber - 1, 10)) },
    { amount: 2200, category: "Food", paymentMethod: "UPI", notes: "Office lunch", date: new Date(Date.UTC(year, monthNumber - 1, 12)) },
  ];

  await replaceExpenses([demoUser._id, adminUser._id], [
    ...demoExpenses.map((expense) => ({ ...expense, userId: demoUser._id })),
    ...adminExpenses.map((expense) => ({ ...expense, userId: adminUser._id })),
  ]);

  await replaceBudgets([demoUser._id, adminUser._id], [
    { userId: demoUser._id, category: "Food", month, limit: 3000 },
    { userId: demoUser._id, category: "Travel", month, limit: 2500 },
    { userId: demoUser._id, category: "Shopping", month, limit: 3500 },
    { userId: adminUser._id, category: "Travel", month, limit: 6000 },
  ]);

  await generateMonthlyReport(demoUser._id, month);
  await generateMonthlyReport(adminUser._id, month);

  console.log("Demo data seeded successfully.");
  console.log("User login: user@example.com / 123456");
  console.log("Admin login: admin@example.com / 123456");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Failed to seed demo data");
  console.error(error);
  process.exit(1);
});
