/**
 * seed.js — Populates the database with the admin user + realistic mock data.
 *
 * Run once:   node seed.js        OR   npm run seed
 *
 * What it creates (idempotent — safe to re-run):
 *   ✅ Admin user
 *   🪑 8 tables  (mix of 2 / 4 / 6 / 8 seat)
 *   📦 15 inventory items with realistic quantities
 *   🍴 12 menu items (starters, mains, desserts, beverages) with recipes
 *   📅 5 reservations (upcoming)
 *   🧾 10 orders (mix of paid / serving / pending)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const User          = require("./models/User");
const Table         = require("./models/Table");
const InventoryItem = require("./models/InventoryItem");
const MenuItem      = require("./models/MenuItem");
const Reservation   = require("./models/Reservation");
const Order         = require("./models/Order");

// ─── helpers ──────────────────────────────────────────────────────────────────
const id = () => new mongoose.Types.ObjectId();
const future = (days, hour = 19, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, min, 0, 0);
  return d;
};
const past = (hoursAgo) => new Date(Date.now() - hoursAgo * 3_600_000);

// ─── main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🔗  Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅  Connected.\n");

  // ── 1. Admin user ────────────────────────────────────────────────────────────
  let admin = await User.findOne({ email: "admin@restaurant.com" });
  if (!admin) {
    const hashed = await bcrypt.hash("admin123", 10);
    admin = await User.create({
      name: "Admin", email: "admin@restaurant.com",
      password: hashed, role: "admin",
    });
    console.log("👤  Admin user created  — admin@restaurant.com / admin123");
  } else {
    console.log("👤  Admin user already exists — skipping.");
  }

  // ── 2. Tables ────────────────────────────────────────────────────────────────
  const tableCount = await Table.countDocuments();
  let tables = [];
  if (tableCount === 0) {
    tables = await Table.insertMany([
      { number: 1,  seatingCapacity: 2, status: "available" },
      { number: 2,  seatingCapacity: 2, status: "reserved"  },
      { number: 3,  seatingCapacity: 4, status: "available" },
      { number: 4,  seatingCapacity: 4, status: "occupied"  },
      { number: 5,  seatingCapacity: 4, status: "available" },
      { number: 6,  seatingCapacity: 6, status: "occupied"  },
      { number: 7,  seatingCapacity: 8, status: "available" },
      { number: 8,  seatingCapacity: 10, status: "available"},
    ]);
    console.log(`🪑  ${tables.length} tables created.`);
  } else {
    tables = await Table.find().sort({ number: 1 });
    console.log(`🪑  Tables already exist (${tables.length}) — skipping.`);
  }

  // ── 3. Inventory ─────────────────────────────────────────────────────────────
  const invCount = await InventoryItem.countDocuments();
  let inv = {};
  if (invCount === 0) {
    const invDocs = await InventoryItem.insertMany([
      // name,              unit,    quantity,  lowStockThreshold
      { name: "Flour",           unit: "g",      quantity: 4200,  lowStockThreshold: 500  },
      { name: "Tomato Sauce",    unit: "ml",     quantity: 2400,  lowStockThreshold: 300  },
      { name: "Mozzarella",      unit: "g",      quantity: 1600,  lowStockThreshold: 200  },
      { name: "Chicken Breast",  unit: "g",      quantity: 2800,  lowStockThreshold: 300  },
      { name: "Beef",            unit: "g",      quantity: 1800,  lowStockThreshold: 200  },
      { name: "Lettuce",         unit: "g",      quantity:  850,  lowStockThreshold: 150  },
      { name: "Tomato",          unit: "g",      quantity:  180,  lowStockThreshold: 200  }, // ⚠️ low
      { name: "Olive Oil",       unit: "ml",     quantity:  160,  lowStockThreshold: 200  }, // ⚠️ low
      { name: "Pasta",           unit: "g",      quantity: 3200,  lowStockThreshold: 400  },
      { name: "Heavy Cream",     unit: "ml",     quantity: 1200,  lowStockThreshold: 300  },
      { name: "Eggs",            unit: "pcs",    quantity:   38,  lowStockThreshold:  10  },
      { name: "Potatoes",        unit: "g",      quantity: 4800,  lowStockThreshold: 500  },
      { name: "Garlic",          unit: "g",      quantity:   90,  lowStockThreshold: 100  }, // ⚠️ low
      { name: "Onion",           unit: "g",      quantity: 1900,  lowStockThreshold: 300  },
      { name: "Salmon",          unit: "g",      quantity: 1100,  lowStockThreshold: 200  },
    ]);
    // build lookup map
    for (const i of invDocs) inv[i.name] = i._id;
    console.log(`📦  ${invDocs.length} inventory items created.`);
  } else {
    const invDocs = await InventoryItem.find();
    for (const i of invDocs) inv[i.name] = i._id;
    console.log(`📦  Inventory already exists (${invDocs.length}) — skipping.`);
  }

  // ── 4. Menu items ────────────────────────────────────────────────────────────
  const menuCount = await MenuItem.countDocuments();
  let menuItems = [];
  if (menuCount === 0) {
    const menuDocs = [
      // ── Starters
      {
        name: "Garlic Bread", category: "Starter", price: 5.99, isAvailable: true,
        description: "Toasted ciabatta with roasted garlic butter and herbs.",
        recipe: [
          { inventoryItem: inv["Flour"],     amountUsed: 80  },
          { inventoryItem: inv["Garlic"],    amountUsed: 15  },
          { inventoryItem: inv["Olive Oil"], amountUsed: 20  },
        ],
      },
      {
        name: "Caesar Salad", category: "Starter", price: 9.50, isAvailable: true,
        description: "Crisp romaine, parmesan, croutons, and house Caesar dressing.",
        recipe: [
          { inventoryItem: inv["Lettuce"],   amountUsed: 120 },
          { inventoryItem: inv["Garlic"],    amountUsed: 5   },
          { inventoryItem: inv["Olive Oil"], amountUsed: 30  },
        ],
      },
      {
        name: "Onion Soup", category: "Starter", price: 8.00, isAvailable: true,
        description: "Classic French onion soup topped with gruyère crouton.",
        recipe: [
          { inventoryItem: inv["Onion"],       amountUsed: 200 },
          { inventoryItem: inv["Heavy Cream"], amountUsed: 50  },
          { inventoryItem: inv["Garlic"],      amountUsed: 8   },
        ],
      },

      // ── Mains
      {
        name: "Margherita Pizza", category: "Main Course", price: 14.99, isAvailable: true,
        description: "Stone-baked with San Marzano tomato, fresh mozzarella, and basil.",
        recipe: [
          { inventoryItem: inv["Flour"],        amountUsed: 250 },
          { inventoryItem: inv["Tomato Sauce"], amountUsed: 120 },
          { inventoryItem: inv["Mozzarella"],   amountUsed: 150 },
          { inventoryItem: inv["Olive Oil"],    amountUsed: 20  },
        ],
      },
      {
        name: "Grilled Chicken", category: "Main Course", price: 16.50, isAvailable: true,
        description: "Free-range chicken breast with herb marinade and seasonal vegetables.",
        recipe: [
          { inventoryItem: inv["Chicken Breast"], amountUsed: 220 },
          { inventoryItem: inv["Olive Oil"],      amountUsed: 25  },
          { inventoryItem: inv["Garlic"],         amountUsed: 10  },
        ],
      },
      {
        name: "Classic Beef Burger", category: "Main Course", price: 15.00, isAvailable: true,
        description: "200g beef patty, brioche bun, lettuce, tomato, and house sauce.",
        recipe: [
          { inventoryItem: inv["Beef"],    amountUsed: 200 },
          { inventoryItem: inv["Lettuce"], amountUsed: 40  },
          { inventoryItem: inv["Tomato"],  amountUsed: 60  },
          { inventoryItem: inv["Flour"],   amountUsed: 80  },
        ],
      },
      {
        name: "Spaghetti Carbonara", category: "Main Course", price: 13.50, isAvailable: true,
        description: "Al dente spaghetti, guanciale, eggs, pecorino romano, black pepper.",
        recipe: [
          { inventoryItem: inv["Pasta"],       amountUsed: 180 },
          { inventoryItem: inv["Eggs"],        amountUsed: 2   },
          { inventoryItem: inv["Heavy Cream"], amountUsed: 80  },
        ],
      },
      {
        name: "Pan-Seared Salmon", category: "Main Course", price: 22.00, isAvailable: true,
        description: "Atlantic salmon fillet with lemon butter sauce and asparagus.",
        recipe: [
          { inventoryItem: inv["Salmon"],    amountUsed: 200 },
          { inventoryItem: inv["Olive Oil"], amountUsed: 20  },
          { inventoryItem: inv["Garlic"],    amountUsed: 8   },
        ],
      },
      {
        name: "Crispy French Fries", category: "Side", price: 4.50, isAvailable: true,
        description: "Double-fried golden fries with sea salt.",
        recipe: [
          { inventoryItem: inv["Potatoes"],  amountUsed: 250 },
          { inventoryItem: inv["Olive Oil"], amountUsed: 30  },
        ],
      },

      // ── Desserts
      {
        name: "Chocolate Lava Cake", category: "Dessert", price: 8.50, isAvailable: true,
        description: "Warm dark chocolate fondant with vanilla ice cream.",
        recipe: [
          { inventoryItem: inv["Flour"],       amountUsed: 60  },
          { inventoryItem: inv["Eggs"],        amountUsed: 2   },
          { inventoryItem: inv["Heavy Cream"], amountUsed: 60  },
        ],
      },

      // ── Beverages
      {
        name: "Fresh Lemonade", category: "Beverage", price: 3.99, isAvailable: true,
        description: "House-squeezed lemonade with mint and honey.",
        recipe: [],
      },
      {
        name: "Sparkling Water", category: "Beverage", price: 2.50, isAvailable: true,
        description: "San Pellegrino 500ml.",
        recipe: [],
      },
    ];

    menuItems = await MenuItem.insertMany(menuDocs);
    console.log(`🍴  ${menuItems.length} menu items created.`);
  } else {
    menuItems = await MenuItem.find();
    console.log(`🍴  Menu already exists (${menuItems.length}) — skipping.`);
  }

  // Helper: find menu item by name
  const M = (name) => menuItems.find((m) => m.name === name);

  // ── 5. Reservations ──────────────────────────────────────────────────────────
  const resCount = await Reservation.countDocuments();
  if (resCount === 0) {
    const resTable = (num) => tables.find((t) => t.number === num);
    await Reservation.insertMany([
      {
        table: resTable(2)?._id, customerName: "Emily Johnson",
        customerPhone: "+1 555-0191", partySize: 2,
        dateTime: future(1, 18, 30), status: "confirmed",
      },
      {
        table: resTable(3)?._id, customerName: "Carlos Rivera",
        customerPhone: "+1 555-0142", partySize: 3,
        dateTime: future(1, 20, 0), status: "confirmed",
      },
      {
        table: resTable(5)?._id, customerName: "Priya Sharma",
        customerPhone: "+1 555-0173", partySize: 4,
        dateTime: future(2, 19, 0), status: "confirmed",
      },
      {
        table: resTable(7)?._id, customerName: "James O'Brien",
        customerPhone: "+1 555-0109", partySize: 7,
        dateTime: future(3, 19, 30), status: "confirmed",
      },
      {
        table: resTable(1)?._id, customerName: "Sofia Müller",
        customerPhone: "+1 555-0155", partySize: 2,
        dateTime: future(4, 21, 0), status: "confirmed",
      },
    ]);
    console.log("📅  5 reservations created.");
  } else {
    console.log(`📅  Reservations already exist (${resCount}) — skipping.`);
  }

  // ── 6. Orders ────────────────────────────────────────────────────────────────
  const orderCount = await Order.countDocuments();
  if (orderCount === 0) {
    const T = (num) => tables.find((t) => t.number === num)?._id;

    const orders = [
      // ── Past paid orders (history / revenue)
      {
        table: T(1), createdBy: admin._id,
        status: "paid", createdAt: past(5),
        items: [
          { menuItem: M("Margherita Pizza")._id,   quantity: 1, price: 14.99 },
          { menuItem: M("Fresh Lemonade")._id,      quantity: 2, price: 3.99  },
        ],
        total: 14.99 + 3.99 * 2,
      },
      {
        table: T(3), createdBy: admin._id,
        status: "paid", createdAt: past(4),
        items: [
          { menuItem: M("Grilled Chicken")._id,     quantity: 2, price: 16.50 },
          { menuItem: M("Caesar Salad")._id,        quantity: 2, price: 9.50  },
          { menuItem: M("Sparkling Water")._id,     quantity: 2, price: 2.50  },
        ],
        total: 16.50 * 2 + 9.50 * 2 + 2.50 * 2,
      },
      {
        table: T(5), createdBy: admin._id,
        status: "paid", createdAt: past(3),
        items: [
          { menuItem: M("Classic Beef Burger")._id, quantity: 2, price: 15.00 },
          { menuItem: M("Crispy French Fries")._id, quantity: 2, price: 4.50  },
          { menuItem: M("Fresh Lemonade")._id,      quantity: 2, price: 3.99  },
        ],
        total: 15.00 * 2 + 4.50 * 2 + 3.99 * 2,
      },
      {
        table: T(7), createdBy: admin._id,
        status: "paid", createdAt: past(2),
        items: [
          { menuItem: M("Pan-Seared Salmon")._id,   quantity: 3, price: 22.00 },
          { menuItem: M("Garlic Bread")._id,        quantity: 3, price: 5.99  },
          { menuItem: M("Chocolate Lava Cake")._id, quantity: 3, price: 8.50  },
          { menuItem: M("Sparkling Water")._id,     quantity: 3, price: 2.50  },
        ],
        total: 22.00 * 3 + 5.99 * 3 + 8.50 * 3 + 2.50 * 3,
      },
      {
        table: T(2), createdBy: admin._id,
        status: "paid", createdAt: past(1.5),
        items: [
          { menuItem: M("Spaghetti Carbonara")._id, quantity: 2, price: 13.50 },
          { menuItem: M("Onion Soup")._id,          quantity: 2, price: 8.00  },
        ],
        total: 13.50 * 2 + 8.00 * 2,
      },
      {
        table: T(1), createdBy: admin._id,
        status: "paid", createdAt: past(1),
        items: [
          { menuItem: M("Margherita Pizza")._id,   quantity: 1, price: 14.99 },
          { menuItem: M("Caesar Salad")._id,       quantity: 1, price: 9.50  },
          { menuItem: M("Sparkling Water")._id,    quantity: 2, price: 2.50  },
        ],
        total: 14.99 + 9.50 + 2.50 * 2,
      },
      // ── Today's paid orders (show revenue on dashboard)
      {
        table: T(3), createdBy: admin._id,
        status: "paid", createdAt: past(0.5),
        items: [
          { menuItem: M("Classic Beef Burger")._id, quantity: 1, price: 15.00 },
          { menuItem: M("Crispy French Fries")._id, quantity: 1, price: 4.50  },
          { menuItem: M("Fresh Lemonade")._id,      quantity: 1, price: 3.99  },
        ],
        total: 15.00 + 4.50 + 3.99,
      },
      {
        table: T(5), createdBy: admin._id,
        status: "paid", createdAt: past(0.25),
        items: [
          { menuItem: M("Grilled Chicken")._id,     quantity: 2, price: 16.50 },
          { menuItem: M("Garlic Bread")._id,        quantity: 2, price: 5.99  },
          { menuItem: M("Chocolate Lava Cake")._id, quantity: 2, price: 8.50  },
        ],
        total: 16.50 * 2 + 5.99 * 2 + 8.50 * 2,
      },
      // ── Active orders (currently in progress on occupied tables)
      {
        table: T(4), createdBy: admin._id,
        status: "preparing", createdAt: past(0.1),
        items: [
          { menuItem: M("Margherita Pizza")._id,    quantity: 2, price: 14.99 },
          { menuItem: M("Caesar Salad")._id,        quantity: 1, price: 9.50  },
          { menuItem: M("Sparkling Water")._id,     quantity: 2, price: 2.50  },
        ],
        total: 14.99 * 2 + 9.50 + 2.50 * 2,
      },
      {
        table: T(6), createdBy: admin._id,
        status: "served", createdAt: past(0.05),
        items: [
          { menuItem: M("Pan-Seared Salmon")._id,   quantity: 3, price: 22.00 },
          { menuItem: M("Onion Soup")._id,          quantity: 3, price: 8.00  },
          { menuItem: M("Chocolate Lava Cake")._id, quantity: 3, price: 8.50  },
          { menuItem: M("Fresh Lemonade")._id,      quantity: 3, price: 3.99  },
        ],
        total: 22.00 * 3 + 8.00 * 3 + 8.50 * 3 + 3.99 * 3,
      },
    ];

    await Order.insertMany(orders);
    console.log(`🧾  ${orders.length} orders created.`);
  } else {
    console.log(`🧾  Orders already exist (${orderCount}) — skipping.`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────────");
  console.log("🎉  Database seeded successfully!");
  console.log("─────────────────────────────────────────────");
  console.log("   URL : http://localhost:" + (process.env.PORT || 3000));
  console.log("─────────────────────────────────────────────\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
