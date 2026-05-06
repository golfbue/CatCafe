#  NekoCafe: CatCafe Management System (Graph Database)

ยินดีต้อนรับสู่ **NekoCafe** — ระบบบริหารจัดการคาเฟ่แมวและบอร์ดเกมอัจฉริยะ ที่ขับเคลื่อนด้วยพลังของ **Graph Database (Neo4j)** เพื่อการจัดการความสัมพันธ์ของข้อมูลที่ซับซ้อนได้อย่างมีประสิทธิภาพ

---

##  จุดเด่นของโปรเจกต์ (Project Highlights)

ระบบนี้ไม่ได้เป็นเพียงแค่โปรแกรม POS ทั่วไป แต่ถูกออกแบบมาเพื่อจัดการความสัมพันธ์แบบโครงข่าย (Relationships) ระหว่าง:
- **ลูกค้า (Customers):** การเข้าใช้งาน (Visits) และพฤติกรรมการสั่งซื้อ
- **แมว (Cats):** การดูแลและปฏิสัมพันธ์กับลูกค้า
- **ออเดอร์ (Orders):** รายการอาหารและเครื่องดื่ม
- **บอร์ดเกม (Board Games):** ระบบยืม-คืนที่เชื่อมโยงกับช่วงเวลาการเข้าใช้งาน

---

##  ฟีเจอร์หลัก (Key Features)

###  สำหรับลูกค้า (Customer Side)
- **Visit Tracking:** บันทึกเวลาเข้า-ออกร้าน (Check-in/Check-out) อัตโนมัติ
- **Food & Drink Ordering:** สั่งเมนูอาหารและเครื่องดื่มผ่านหน้าเว็บ
- **Board Game Borrowing:** ระบบยืมบอร์ดเกมที่ผูกกับรอบการเข้าใช้งาน
- **Cat Profiles:** ดูข้อมูลน้องแมวประจำร้าน

###  สำหรับผู้ดูแลระบบ (Admin Dashboard)
- **Graph Analytics:** วิเคราะห์ข้อมูลความสัมพันธ์ในรูปแบบ Graph
- **Revenue Dashboard:** สรุปรายได้ รายการอาหารที่ขายดี และจำนวนผู้เข้าใช้งาน
- **Inventory Management:** จัดการข้อมูลแมว, เมนูอาหาร และบอร์ดเกม
- **Payment Processing:** ระบบสรุปยอดค้างชำระและยืนยันการจ่ายเงิน

---

##  เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend:** HTML5, Vanilla CSS3, JavaScript (ES6+) — *เน้นความเร็วและง่ายต่อการแก้ไข*
- **Backend:** Node.js (Express.js)
- **Database:** Neo4j (Graph Database) — *ใช้สำหรับเก็บข้อมูลความสัมพันธ์ที่ซับซ้อน*
- **Containerization:** Docker (สำหรับรัน Neo4j Instance)

---

##  โครงสร้างโฟลเดอร์ (Project Structure)

```text
CatCafe/
├── backend/                # ส่วนของ Server และ API
│   ├── data/               # ข้อมูลเริ่มต้น (JSON)
│   ├── routes/             # API Endpoints แบ่งตามฟีเจอร์
│   ├── db.js               # ตัวเชื่อมต่อ Neo4j
│   ├── seed.js             # สคริปต์สร้างข้อมูลจำลอง
│   └── server.js           # ไฟล์หลักสำหรับรัน Backend
├── frontend/               # ส่วนของหน้าเว็บ UI
│   ├── css/                # ไฟล์สไตล์ (Vanilla CSS)
│   ├── js/                 # Logic การส่งข้อมูล (Fetch API)
│   ├── pages/              # หน้าเว็บย่อยต่างๆ (Admin, Menu, etc.)
│   └── index.html          # หน้าหลักของระบบ
├── docker-compose.yml      # ไฟล์ตั้งค่า Docker สำหรับ Neo4j
└── README.md               # คู่มือการใช้งาน (ที่คุณกำลังอ่านอยู่)
```

---

##  ขั้นตอนการติดตั้งและรันระบบ (Installation Guide)

### 1. เตรียมฐานข้อมูล (Neo4j)
โปรเจกต์นี้ใช้ Docker เพื่อความสะดวกในการติดตั้งฐานข้อมูล:
```bash
docker compose up -d
```
*หลังจากรันคำสั่งนี้ Neo4j จะทำงานอยู่ที่ `http://localhost:7474`*

### 2. ติดตั้งและเริ่ม Backend
เข้าไปที่โฟลเดอร์ backend และติดตั้ง dependencies:
```bash
cd backend
npm install
```
สร้างข้อมูลจำลอง (Seed Data):
```bash
node seed.js
```
เริ่มรันเซิร์ฟเวอร์:
```bash
npm start
```
*เซิร์ฟเวอร์จะรันอยู่ที่ `http://localhost:5000`*

### 3. เปิดใช้งานหน้าเว็บ
1. เข้าไปที่โฟลเดอร์ `frontend`
2. เปิดไฟล์ `index.html` ด้วยเบราว์เซอร์ (หรือใช้ Live Server ใน VS Code)
3. เข้าสู่ระบบเพื่อเริ่มใช้งาน!

---

##  ข้อมูลเข้าสู่ระบบสำหรับทดสอบ (Test Credentials)

- **ลูกค้า:** `John Doe` / รหัสผ่าน: `password123`
- **ผู้ดูแลระบบ (Admin):** `sirapop` / รหัสผ่าน: `admin`

---

##  การเข้าดูฐานข้อมูลกราฟ (Neo4j Browser)

คุณสามารถดูโครงสร้าง Graph และรันคำสั่ง Cypher Query ได้ที่:
- **URL:** `http://localhost:7474`
- **Username:** `neo4j`
- **Password:** `catcafe2024`

### ตัวอย่างคำสั่ง Cypher ที่น่าสนใจ:
- **ดูข้อมูลทั้งหมดในระบบ:**
  ```cypher
  MATCH (n) RETURN n LIMIT 50
  ```
- **ดูความสัมพันธ์ระหว่างลูกค้าที่มาเล่นกับน้องแมว:**
  ```cypher
  MATCH (c:Customer)-[r:INTERACTED_WITH]->(cat:Cat) RETURN c, r, cat
  ```
- **ค้นหาลูกค้าที่มียอดการสั่งซื้อสูงสุด:**
  ```cypher
  MATCH (c:Customer)-[:PLACED]->(o:Order)
  RETURN c.name, sum(o.totalPrice) as total
  ORDER BY total DESC
  ```

---

##  ทีมผู้พัฒนา (Development Team)
จัดทำโดยทีมพัฒนา **คนใต้รักจริง** เพื่อการศึกษาและพัฒนาระบบจัดการธุรกิจด้วย Graph Database

---
