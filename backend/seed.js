const { driver, getSession } = require('./db');

async function seedData() {
  const session = getSession();
  try {
    console.log('--- Clearing Database ---');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('--- Creating Nodes ---');
    
    // Customers
    await session.run("CREATE (:Customer {id: 'C001', name: 'Alice', email: 'alice@catcafe.com'})");
    await session.run("CREATE (:Customer {id: 'C002', name: 'Bob', email: 'bob@catcafe.com'})");
    await session.run("CREATE (:Customer {id: 'C003', name: 'Charlie', email: 'charlie@catcafe.com'})");

    // Staff
    await session.run("CREATE (:Staff {id: 'S001', name: 'Wichai', role: 'Barista'})");
    await session.run("CREATE (:Staff {id: 'S002', name: 'Suda', role: 'Cat Caretaker'})");

    // Cats
    await session.run("CREATE (:Cat {id: 'CAT01', name: 'Mochi', breed: 'British Shorthair', age: 2})");
    await session.run("CREATE (:Cat {id: 'CAT02', name: 'Luna', breed: 'Persian', age: 3})");
    await session.run("CREATE (:Cat {id: 'CAT03', name: 'Som-Zeed', breed: 'Thai', age: 1})");

    // Menu
    await session.run("CREATE (:Menu {id: 'M01', name: 'Matcha Latte', price: 85})");
    await session.run("CREATE (:Menu {id: 'M02', name: 'Iced Americano', price: 65})");
    await session.run("CREATE (:Menu {id: 'M03', name: 'Strawberry Cake', price: 95})");

    // Board Games
    await session.run("CREATE (:BoardGame {id: 'G01', name: 'Catan', type: 'Strategy', status: 'available'})");
    await session.run("CREATE (:BoardGame {id: 'G02', name: 'Exploding Kittens', type: 'Card Game', status: 'available'})");

    console.log('--- Creating Relationships (Graph logic) ---');

    // Alice's Journey: Visit -> Order -> Payment -> See Cat
    await session.run(`
      MATCH (c:Customer {name: 'Alice'}), (s:Staff {name: 'Wichai'}), (m:Menu {name: 'Matcha Latte'}), (cat:Cat {name: 'Mochi'})
      CREATE (v:Visit {id: 'V001', date: date(), duration: 60})
      CREATE (c)-[:VISITS]->(v)
      CREATE (v)-[:HANDLED_BY]->(s)
      CREATE (o:Order {id: 'ORD-101', status: 'paid', timestamp: timestamp()})
      CREATE (v)-[:ORDERED]->(o)
      CREATE (o)-[:CONTAINS]->(m)
      CREATE (p:Payment {id: 'P001', amount: 85, method: 'QR PromptPay'})
      CREATE (o)-[:PAID_BY]->(p)
      CREATE (v)-[:SEES]->(cat)
    `);

    // Bob's Journey: Borrow Game -> Visit
    await session.run(`
      MATCH (c:Customer {name: 'Bob'}), (bg:BoardGame {name: 'Catan'}), (cat1:Cat {name: 'Luna'}), (cat2:Cat {name: 'Som-Zeed'})
      CREATE (v:Visit {id: 'V002', date: date()})
      CREATE (c)-[:VISITS]->(v)
      CREATE (c)-[:BORROWS]->(bg)
      CREATE (v)-[:SEES]->(cat1)
      CREATE (v)-[:SEES]->(cat2)
      SET bg.status = 'unavailable'
    `);

    console.log('✅ Seed Completed Successfully!');
  } catch (err) {
    console.error('❌ Error Seeding Data:', err);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedData();
