const API = 'http://localhost:5000/api';

async function testFlow() {
    try {
        console.log("1. Registering new customer...");
        const regRes = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'TestUser', phone: '0999999999', password: 'testpassword', role: 'customer' })
        });
        const newCust = await regRes.json();
        console.log("Registered:", newCust);

        console.log("\n2. Checking in...");
        const checkinRes = await fetch(`${API}/actions/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_id: newCust.user.customer_id, staff_id: 1 })
        });
        const visit = await checkinRes.json();
        console.log("Checked in. Visit ID:", visit.visit_id);

        console.log("\n3. Placing an order...");
        const orderRes = await fetch(`${API}/actions/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visit_id: visit.visit_id,
                items: [{ menu_id: 1, quantity: 2 }, { menu_id: 2, quantity: 1 }]
            })
        });
        const order = await orderRes.json();
        console.log("Order placed. Order ID:", order.order_id);

        console.log("\n4. Fetching as Admin (Verifying data)...");
        const ordersRes = await fetch(`${API}/orders`);
        const orders = await ordersRes.json();
        
        const detailsRes = await fetch(`${API}/order_details`);
        const details = await detailsRes.json();

        const myOrder = orders.find(o => o.order_id === order.order_id);
        const myDetails = details.filter(d => d.order_id === order.order_id);
        
        if (myOrder && myDetails.length === 2) {
            console.log("✅ SUCCESS: Order found in Admin DB with correct details!");
            console.log("Order:", myOrder);
            console.log("Details:", myDetails);
        } else {
            console.log("❌ FAILED: Order not found correctly.");
        }
    } catch(e) {
        console.error("Test failed:", e);
    }
}

testFlow();
