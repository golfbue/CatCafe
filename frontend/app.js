// ฟังก์ชันพื้นฐานสำหรับดึงข้อมูลลูกค้า
async function fetchCustomers() {
    const list = document.getElementById('customer-list');
    if (!list) return;

    list.innerHTML = '<li>กำลังโหลดข้อมูล...</li>';
    
    try {
        const response = await fetch('http://localhost:5000/api/customers');
        const data = await response.json();
        list.innerHTML = '';
        
        if (data.length === 0) {
            list.innerHTML = '<li>ไม่มีข้อมูลลูกค้าในระบบ</li>';
            return;
        }

        data.forEach(customer => {
            const li = document.createElement('li');
            li.textContent = `รหัส: ${customer.id} | ชื่อ: ${customer.name}`;
            list.appendChild(li);
        });
    } catch (error) {
        list.innerHTML = `<li style="color: red;">เกิดข้อผิดพลาด: โปรดเช็คว่าเปิด Backend หรือยัง</li>`;
    }
}

// ฟังก์ชันสำหรับการสั่งอาหาร
async function placeOrder(menuName) {
    // ในโปรเจกต์จริงเราจะเอาชื่อลูกค้ามาจากระบบ Login
    // ตอนนี้ขอสมมติว่าเป็น Alice ไปก่อนเพื่อทดสอบ Graph
    const customerName = 'Alice'; 

    try {
        const response = await fetch('http://localhost:5000/api/actions/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerName, menuName })
        });

        const result = await response.json();
        if (response.ok) {
            alert(`สำเร็จ! ${result.message}\nเมนู: ${menuName}\n(ข้อมูลถูกบันทึกลง Neo4j เรียบร้อย)`);
        } else {
            alert(`ผิดพลาด: ${result.error}`);
        }
    } catch (error) {
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
}

// ฟังก์ชันสำหรับการยืมบอร์ดเกม
async function borrowGame(gameName) {
    const customerName = 'Alice'; 

    try {
        const response = await fetch('http://localhost:5000/api/actions/borrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerName, gameName })
        });

        const result = await response.json();
        if (response.ok) {
            alert(`สำเร็จ! ${result.message}\nเกม: ${gameName}\n(สร้างความสัมพันธ์ BORROWS ใน Graph แล้ว)`);
            location.reload(); // รีโหลดหน้าเพื่ออัปเดตสถานะ (ถ้ามี)
        } else {
            alert(`ผิดพลาด: ${result.error}`);
        }
    } catch (error) {
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
}
