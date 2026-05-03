// --- ROUTER & STATE ---
const API = window.location.origin + '/api';
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentVisit = JSON.parse(localStorage.getItem('currentVisit')) || null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentManageCollection = '';
let isEditMode = false;
let editingItemId = null;
let activePage = '';

async function loadPage(pageId) {
    activePage = pageId;
    const main = document.getElementById('main-content');
    
    // Determine the path based on user role
    let path = `pages/${pageId}.html`;
    if (pageId !== 'auth') {
        // If it's home, orders, or games, guests can see customer version
        const isGuestPage = ['home', 'orders', 'games'].includes(pageId);
        const dir = (currentUser && currentUser.role === 'customer') || (isGuestPage && !currentUser) ? 'customer' : 'admin';
        path = `pages/${dir}/${pageId}.html`;
    }
    
    // Fetch HTML if not loaded
    if (!document.getElementById(`page-${pageId}`)) {
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error('Page not found');
            const html = await res.text();
            
            // Extract the inner HTML of the .page div, or just append the whole thing if it's already a div
            // Actually, the files in pages/ already have <div id="..." class="page">
            // Let's replace their ID with page-pageId to avoid conflicts and track them
            const modifiedHtml = html.replace(/id="[^"]+"/, `id="page-${pageId}"`);
            main.insertAdjacentHTML('beforeend', modifiedHtml);
        } catch (e) {
            console.error(e);
            return;
        }
    }
    
    // Hide all, show target
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${pageId}`);
    if (target) target.classList.add('active');
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(n => n.getAttribute('onclick') && n.getAttribute('onclick').includes(`loadPage('${pageId}')`));
    if(activeNav) activeNav.classList.add('active');

    // Run page specific logic
    if(pageId === 'orders') { loadMenu(); loadOrders(); }
    if(pageId === 'games') loadGames();
    if(pageId === 'payment') loadPaymentSummary();
    if(pageId === 'graph') renderGraph();
    if(pageId === 'dashboard') loadStats();

    updateSidebar();
}

// Replace original navigateTo with loadPage in JS code

        
        
        

        // --- AUTHENTICATION LOGIC ---
        function setAuthTab(tab) {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            if (tab === 'login') {
                document.getElementById('login-form').style.display = 'block';
                document.getElementById('register-form').style.display = 'none';
            } else {
                document.getElementById('login-form').style.display = 'none';
                document.getElementById('register-form').style.display = 'block';
            }
        }

        async function handleLogin(e) {
            e.preventDefault();
            const id = document.getElementById('login-id').value;
            const pass = document.getElementById('login-pass').value;

            try {
                const res = await fetch(`${API}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone_or_name: id, password: pass })
                });
                
                if (!res.ok) throw new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
                
                currentUser = await res.json();
                loginSuccess();
            } catch (err) {
                alert(err.message);
            }
        }

        async function handleRegister(e) {
            e.preventDefault();
            const password = document.getElementById('reg-pass').value;
            const confirm = document.getElementById('reg-pass-confirm').value;

            if (password !== confirm) {
                alert('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง ❌');
                return;
            }

            const data = {
                name: document.getElementById('reg-name').value,
                phone: document.getElementById('reg-phone').value,
                password: password,
                role: 'customer'
            };

            try {
                const res = await fetch(`${API}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (!res.ok) throw new Error('สมัครสมาชิกไม่สำเร็จ โปรดลองอีกครั้ง');
                
                currentUser = await res.json();
                loginSuccess();
            } catch (err) {
                alert(err.message);
            }
        }

        function loginSuccess() {
            document.getElementById('auth-modal').classList.remove('active');
            document.getElementById('auth-controls').style.display = 'flex';
            document.getElementById('app-container').classList.add('active');
            
            const name = currentUser.role === 'customer' ? currentUser.user.name : currentUser.user.staff_name;
            const roleTh = currentUser.role === 'customer' ? 'ลูกค้า' : 'พนักงาน';
            document.getElementById('nav-user-info').innerText = `${name} (${roleTh})`;

            document.getElementById('guest-controls').style.display = 'none';
            updateSidebar();
            
            if (currentUser.role === 'customer') {
                loadPage('home');
            } else {
                loadPage('dashboard');
            }
        }

        function logout() {
            currentUser = null;
            currentVisit = null;
            cart = [];
            document.getElementById('auth-modal').classList.add('active');
            document.getElementById('auth-controls').style.display = 'none';
            document.getElementById('guest-controls').style.display = 'flex';
            document.getElementById('app-container').classList.add('active'); // Keep active for guest home
            updateSidebar();
            loadPage('home');
            
            // Clear inputs
            document.getElementById('login-id').value = '';
            document.getElementById('login-pass').value = '';
        }

        // --- APP LOGIC ---

        function updateSidebar() {
            const sidebar = document.getElementById('sidebar');
            if (!currentUser || currentUser.role === 'customer') {
                const active = (page) => activePage === page ? 'active' : '';
                sidebar.innerHTML = `
                    <div class="nav-item ${active('home')}" onclick="loadPage('home')">🏠 หน้าหลัก</div>
                    <div class="nav-item ${active('orders')}" onclick="loadPage('orders')">🍔 เมนูและสั่งอาหาร</div>
                    <div class="nav-item ${active('games')}" onclick="loadPage('games')">🎲 บอร์ดเกม</div>
                    ${currentUser ? `<div class="nav-item ${active('payment')}" onclick="loadPage('payment')">💳 ชำระเงิน</div>` : ''}
                `;
            } else {
                const active = (page) => activePage === page ? 'active' : '';
                sidebar.innerHTML = `
                    <div class="nav-item ${active('dashboard')}" onclick="loadPage('dashboard')">📊 แดชบอร์ด</div>
                    <div class="nav-item" onclick="openManage('customers')">👥 ลูกค้า</div>
                    <div class="nav-item" onclick="openManage('staff')">👨‍💼 พนักงาน</div>
                    <div class="nav-item" onclick="openManage('cats')">🐱 น้องแมว</div>
                    <div class="nav-item" onclick="openManage('menu')">🍔 เมนู</div>
                    <div class="nav-item" onclick="openManage('boardgames')">🎲 บอร์ดเกม</div>
                    <div class="nav-item" onclick="openManage('orders')">🧾 ออเดอร์</div>
                    <div class="nav-item ${active('graph')}" onclick="loadPage('graph')">🧠 ดูความสัมพันธ์ (Graph)</div>
                `;
            }
        }

        // --- CUSTOMER ACTIONS ---
        async function loadDropdowns() {
            const staff = await (await fetch(`${API}/staff`)).json();
            document.getElementById('ci-staff').innerHTML = staff.map(s => `<option value="${s.staff_id}">${s.staff_name}</option>`).join('');
        }

        async function doCheckin() {
            if(!currentUser || currentUser.role !== 'customer') return;
            
            const staff = await (await fetch(`${API}/staff`)).json();
            const staff_id = staff.length ? staff[0].staff_id : null;
            if (!staff_id) throw new Error('ไม่พบพนักงานสำหรับเช็คอิน');

            const data = {
                customer_id: currentUser.user.customer_id,
                staff_id
            };
            const res = await fetch(`${API}/actions/checkin`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('ไม่สามารถเช็คอินได้');
            currentVisit = await res.json();
            localStorage.setItem('currentVisit', JSON.stringify(currentVisit));
        }

        async function ensureVisit() {
            if (currentVisit) return;
            await doCheckin();
        }

        async function loadMenu() {
            const items = await (await fetch(`${API}/menu`)).json();
            const grid = document.getElementById('menu-grid');
            grid.innerHTML = items.map(i => {
                const price = parseFloat(i.price) || 0;
                return `
                    <div class="card" style="padding: 1.2rem; display: flex; flex-direction: column; justify-content: space-between; background: white; transition: transform 0.3s ease;">
                        <div class="cat-ears" style="height: 200px; width: 100%; border-radius: 1.5rem; overflow: visible; margin-bottom: 1.2rem; margin-top: 10px;">
                            <img src="${i.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'}" 
                                 style="width: 100%; height: 100%; object-fit: cover; border-radius: 1.5rem;" 
                                 alt="${i.menu_name}">
                        </div>
                        <div>
                            <h3 style="font-family: 'Playfair Display', serif; margin-bottom: 0.4rem; font-size: 1.3rem; color: var(--text);">${i.menu_name}</h3>
                            <p style="color: var(--primary); font-weight: 800; font-size: 1.4rem; margin-bottom: 0.8rem;">฿${price.toLocaleString()}</p>
                            <p style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 1.2rem; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">${i.category}</p>
                        </div>
                        <button class="btn btn-p" onclick="addToCart('${i.menu_id}', '${i.menu_name}', ${price})" style="width: 100%;">Add to Order 🐾</button>
                    </div>
                `;
            }).join('');
        }

        function addToCart(id, name, price) {
            if (!currentUser) {
                alert('กรุณาเข้าสู่ระบบก่อนสั่งอาหารนะเมี๊ยวว! 🐾');
                document.getElementById('auth-modal').classList.add('active');
                return;
            }
            const numericPrice = parseFloat(price) || 0;
            cart.push({ menu_id: id, name, price: numericPrice });
            renderCart();
            localStorage.setItem('cart', JSON.stringify(cart));
        }

        function renderCart() {
            const list = document.getElementById('cart-list');
            const summary = document.getElementById('cart-summary');
            if (!list || !summary) return;

            if (cart.length === 0) {
                list.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">ไม่มีสินค้าในตะกร้า 🐾</p>';
                summary.innerHTML = '';
                return;
            }

            let total = 0;
            list.innerHTML = cart.map((i, index) => {
                const itemPrice = parseFloat(i.price) || 0;
                total += itemPrice;
                return `
                    <div class="menu-item" style="padding: 1rem; margin-bottom: 0.8rem; background: white; border: 1px solid var(--border); border-radius: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 800; color: var(--text); font-size: 0.95rem;">${i.name}</span>
                            <span style="font-size: 0.9rem; color: var(--primary); font-weight: 700;">฿${itemPrice.toLocaleString()}</span>
                        </div>
                        <button onclick="removeFromCart(${index})" style="background: hsla(0, 85%, 60%, 0.1); border: none; color: var(--danger); cursor:pointer; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">×</button>
                    </div>
                `;
            }).join('');

            summary.innerHTML = `
                <div style="padding-top: 1rem; border-top: 2px dashed var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 800; color: var(--text);">ยอดรวมทั้งหมด:</span>
                    <span style="font-weight: 900; font-size: 1.8rem; color: var(--primary);">฿${total.toLocaleString()}</span>
                </div>
            `;
        }

        function clearCart() {
            if (confirm('คุณต้องการล้างรายการทั้งหมดในตะกร้าใช่หรือไม่? 🐾')) {
                cart = [];
                localStorage.removeItem('cart');
                renderCart();
            }
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            renderCart();
        }

        async function placeOrder() {
            if (cart.length === 0) return alert('กรุณาเลือกอาหารก่อนสั่งครับ 🐾');
            await ensureVisit();
            
            const items = cart.reduce((acc, item) => {
                const existing = acc.find(i => i.menu_id === item.menu_id);
                if (existing) existing.quantity++;
                else acc.push({ menu_id: item.menu_id, quantity: 1 });
                return acc;
            }, []);

            try {
                const res = await fetch(`${API}/actions/order`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ visit_id: currentVisit.visit_id, items })
                });
                if (!res.ok) throw new Error('สั่งอาหารไม่สำเร็จ');
                alert('ส่งรายการอาหารเข้าครัวแล้วครับ! 🍳');
                cart = [];
                localStorage.removeItem('cart');
                renderCart();
                loadOrders(); // Refresh order status list
            } catch (err) { alert(err.message); }
        }

        async function loadOrders() {
            if (!currentVisit) return;
            const orders = await (await fetch(`${API}/orders`)).json();
            const myOrders = orders.filter(o => o.visit_id == currentVisit.visit_id);
            const list = document.getElementById('order-status-list');
            if (!list) return;

            if (myOrders.length === 0) {
                list.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">ยังไม่มีรายการที่สั่งไปครับ</p>';
                return;
            }

            list.innerHTML = myOrders.reverse().map(o => `
                <div style="padding: 1rem; background: var(--bg); border-radius: 1rem; margin-bottom: 0.8rem; border-left: 5px solid ${o.status === 'เสร็จแล้ว' ? 'var(--success)' : 'var(--primary)'}; border: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: var(--text);">Order #${o.order_id.toString().slice(-4)}</span>
                        <span style="padding: 0.3rem 0.8rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 800; background: white; color: ${o.status === 'เสร็จแล้ว' ? 'var(--success)' : 'var(--primary)'}; border: 1px solid var(--border);">
                            ${o.status || 'Cooking ⏳'}
                        </span>
                    </div>
                </div>
            `).join('');
        }

        async function loadGames() {
            const items = await (await fetch(`${API}/boardgames`)).json();
            const grid = document.getElementById('game-grid');
            grid.innerHTML = items.map(i => `
                <div class="card" style="padding: 1.5rem; text-align: center; background: white; transition: transform 0.3s ease;">
                    <div class="cat-ears" style="height: 220px; width: 100%; border-radius: 1.5rem; overflow: visible; margin-bottom: 1.5rem; margin-top: 10px;">
                        <img src="${i.image || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400'}" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 1.5rem; box-shadow: 0 10px 20px rgba(0,0,0,0.05);" 
                             alt="${i.game_name}">
                    </div>
                    <h3 style="font-family: 'Playfair Display', serif; margin-bottom: 0.5rem; font-size: 1.4rem; color: var(--text);">${i.game_name}</h3>
                    <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 1.5rem; font-weight: 700; text-transform: uppercase;">${i.category}</p>
                    
                    <div style="margin-bottom: 1.5rem; padding: 0.8rem; border-radius: 1rem; background: ${i.status === 'available' ? 'hsla(140, 70%, 50%, 0.05)' : 'hsla(0, 70%, 50%, 0.05)'};">
                        <span style="color: ${i.status === 'available' ? 'var(--success)' : 'var(--danger)'}; font-weight: 800; font-size: 0.9rem;">
                            ${i.status === 'available' ? '✨ Available' : '🕒 In Use'}
                        </span>
                    </div>

                    ${i.status === 'available' 
                        ? `<button class="btn btn-p" onclick="borrowGame(${i.game_id})" style="width: 100%;">Borrow Game 🎲</button>` 
                        : `<button class="btn btn-danger" onclick="returnGame(${i.game_id})" style="width: 100%;">Return Game</button>`}
                </div>
            `).join('');
        }

        async function borrowGame(id) {
            if (!currentUser) {
                alert('กรุณาเข้าสู่ระบบก่อนยืมบอร์ดเกมนะเมี๊ยวว! 🐾');
                document.getElementById('auth-modal').classList.add('active');
                return;
            }
            if(!currentVisit) {
                await ensureVisit();
            }
            await fetch(`${API}/actions/borrow`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ visit_id: currentVisit.visit_id, game_id: id })
            });
            alert('ยืมบอร์ดเกมสำเร็จ! ขณะนี้คุณได้เข้าใช้บริการเรียบร้อยแล้ว');
            loadGames();
        }

        async function returnGame(id) {
            await fetch(`${API}/actions/return`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ game_id: id })
            });
            alert('คืนบอร์ดเกมสำเร็จ!');
            loadGames();
        }

        async function loadPaymentSummary() {
            if(!currentVisit) {
                document.getElementById('payment-content').innerHTML = '<p>ไม่พบการเช็คอิน กรุณาเช็คอินเพื่อดูค่าใช้จ่าย</p>';
                return;
            }
            const summary = await (await fetch(`${API}/actions/payment-summary/${currentVisit.visit_id}`)).json();
            document.getElementById('payment-content').innerHTML = `
                <h2>รายละเอียดการเข้าใช้บริการ รหัส #${currentVisit.visit_id}</h2>
                <div style="margin: 1.5rem 0;">
                    ${summary.items.length > 0 ? summary.items.map(i => `<div class="menu-item"><span>${i.name} (จำนวน ${i.quantity})</span><span>฿${i.subtotal}</span></div>`).join('') : '<p style="color:var(--text-muted); margin-bottom:1rem;">ยังไม่มีรายการสั่งอาหาร.</p>'}
                    <div class="menu-item" style="border-top: 1px solid #334155; padding-top: 1rem;"><span>ค่าบริการเริ่มต้น (Service Fee)</span><span>฿${summary.serviceFee}</span></div>
                    <div class="menu-item" style="font-size: 1.5rem; color: var(--accent); font-weight: 700;"><span>ยอดรวมทั้งสิ้น (Total)</span><span>฿${summary.grandTotal}</span></div>
                </div>
            `;
        }

        async function finishPayment() {
            if(!currentVisit) return alert('ไม่มีรายการให้ชำระเงิน');

            const res = await fetch(`${API}/actions/checkout`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ visit_id: currentVisit.visit_id })
            });

            if (!res.ok) {
                const error = await res.json();
                return alert('ไม่สามารถเช็คเอาท์ได้: ' + (error.message || 'เกิดข้อผิดพลาด'));
            }

            alert('ชำระเงินสำเร็จ! คุณได้รับการเช็คเอาท์เรียบร้อยแล้ว');
            currentVisit = null;
            localStorage.removeItem('currentVisit');
            loadPage('home');
        }

        // --- STAFF ACTIONS ---


        

        async function loadStats() {
            try {
                const [orders, details, menu, visits, cats, customers] = await Promise.all([
                    fetch(`${API}/orders`).then(r => r.json()),
                    fetch(`${API}/order_details`).then(r => r.json()),
                    fetch(`${API}/menu`).then(r => r.json()),
                    fetch(`${API}/visits`).then(r => r.json()),
                    fetch(`${API}/cats`).then(r => r.json()),
                    fetch(`${API}/customers`).then(r => r.json())
                ]);

                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

                const getRevenueForDate = (date) => {
                    const ordersOnDate = orders.filter(o => o.order_time.startsWith(date));
                    let total = 0;
                    ordersOnDate.forEach(o => {
                        const items = details.filter(d => d.order_id == o.order_id);
                        items.forEach(i => {
                            const menuItem = menu.find(m => m.menu_id == i.menu_id);
                            if (menuItem) total += menuItem.price * i.quantity;
                        });
                    });
                    // Add service fees from visits
                    const visitsOnDate = visits.filter(v => v.check_in.startsWith(date));
                    visitsOnDate.forEach(v => total += (v.service_fee || 50));
                    return total;
                };

                const visitsToday = visits.filter(v => v.check_in.startsWith(today)).length;
                const revenueToday = getRevenueForDate(today);
                const revenueYesterday = getRevenueForDate(yesterday);

                // Update UI
                document.getElementById('stat-revenue-today').innerText = `฿${revenueToday.toLocaleString()}`;
                document.getElementById('stat-visits-today').innerText = `${visitsToday} คน`;
                document.getElementById('stat-revenue-yesterday').innerText = `฿${revenueYesterday.toLocaleString()}`;

                // Top Menu
                const menuCounts = {};
                details.forEach(d => {
                    menuCounts[d.menu_id] = (menuCounts[d.menu_id] || 0) + d.quantity;
                });
                const topMenus = Object.entries(menuCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5);

                const topMenuHtml = topMenus.map(([id, qty]) => {
                    const item = menu.find(m => m.menu_id == id);
                    return `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; background: var(--bg); border-radius: 1rem;">
                            <span style="font-weight: 700;">${item ? item.menu_name : 'Unknown'}</span>
                            <span style="padding: 0.3rem 0.8rem; background: var(--primary-glow); color: var(--primary); border-radius: 2rem; font-size: 0.85rem; font-weight: 800;">${qty} ออเดอร์</span>
                        </div>
                    `;
                }).join('');
                document.getElementById('stat-top-menu').innerHTML = topMenuHtml;

                // Weekly Summary
                let weeklyHtml = '';
                for (let i = 0; i < 7; i++) {
                    const d = new Date(Date.now() - (i * 86400000)).toISOString().split('T')[0];
                    const rev = getRevenueForDate(d);
                    const label = i === 0 ? 'วันนี้' : (i === 1 ? 'เมื่อวาน' : d);
                    weeklyHtml += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border-bottom: 1px solid var(--border);">
                            <span style="color: var(--text-muted); font-size: 0.9rem;">${label}</span>
                            <span style="font-weight: 800; color: var(--text);">฿${rev.toLocaleString()}</span>
                        </div>
                    `;
                }
                document.getElementById('stat-weekly-revenue').innerHTML = weeklyHtml;

                // Overall Stats
                const totalRev = orders.reduce((sum, o) => {
                    const items = details.filter(d => d.order_id == o.order_id);
                    return sum + items.reduce((s, i) => {
                        const m = menu.find(mm => mm.menu_id == i.menu_id);
                        return s + (m ? m.price * i.quantity : 0);
                    }, 0);
                }, 0) + (visits.length * 50);

                document.getElementById('stat-rev').innerText = `฿${totalRev.toLocaleString()}`;
                document.getElementById('stat-visits').innerText = visits.length;
                document.getElementById('stat-cust').innerText = customers.length;
                document.getElementById('stat-cats').innerText = cats.length;
                document.getElementById('stat-orders').innerText = orders.length;
                document.getElementById('stat-staff').innerText = staff.length;
                document.getElementById('stat-in-progress').innerText = orders.filter(o => o.status !== 'เสร็จแล้ว').length;
                document.getElementById('stat-completed').innerText = orders.filter(o => o.status === 'เสร็จแล้ว').length;
            } catch (err) { console.error('Stats Error:', err); }
        }

        async function openManage(collection) {
            currentManageCollection = collection;
            
            // Ensure the manage page is loaded into the DOM
            await loadPage('manage');

            // Hide other pages (loadPage already does this, but just to be sure)
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-manage').classList.add('active');
            
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(n => n.getAttribute('onclick') && n.getAttribute('onclick').includes(collection));
            if(activeNav) activeNav.classList.add('active');

            const titleMap = { 'customers': 'จัดการลูกค้า', 'staff': 'จัดการพนักงาน', 'cats': 'จัดการข้อมูลแมว', 'menu': 'จัดการเมนูอาหาร', 'boardgames': 'จัดการบอร์ดเกม', 'orders': 'จัดการออเดอร์' };
            document.getElementById('manage-title').innerText = titleMap[collection] || 'ระบบจัดการ';
            
            const addBtn = document.getElementById('add-new-btn');
            if (addBtn) {
                if (['orders', 'customers'].includes(collection)) {
                    addBtn.style.display = 'none';
                } else {
                    addBtn.style.display = 'block';
                }
            }

            const data = await (await fetch(`${API}/${collection}`)).json();
            const head = document.getElementById('manage-head');
            const body = document.getElementById('manage-body');
            
            if(data.length > 0) {
                const keys = Object.keys(data[0]).filter(k => k !== 'password'); // Hide passwords
                head.innerHTML = keys.map(k => `<th>${k}</th>`).join('') + '<th>จัดการ (Action)</th>';
                body.innerHTML = data.map(item => `
                    <tr>
                        ${keys.map(k => `<td>${k === 'image' && item[k] ? `<img src="${item[k]}" width="50" height="50" style="object-fit: cover;">` : item[k]}</td>`).join('')}
                        <td>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                ${collection === 'boardgames' && item.status !== 'available' ? `<button onclick="returnGame(${item.game_id}); setTimeout(()=>openManage('boardgames'), 500);" class="btn-mini btn-success">คืนเกม</button>` : ''}
                                ${['staff', 'cats', 'menu', 'boardgames', 'orders'].includes(collection) ? `<button onclick="showEditModal('${collection}', '${item[keys[0]]}')" class="btn-mini btn-info">แก้ไข</button>` : ''}
                                <button onclick="viewDetails('${collection}', '${item[keys[0]]}')" class="btn-mini btn-warning">รายละเอียด</button>
                                <button onclick="deleteItem('${collection}', '${item[keys[0]]}')" class="btn-mini btn-danger">ลบ</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            } else {
                head.innerHTML = '<th>ไม่พบข้อมูลในระบบ</th>';
                body.innerHTML = '';
            }
        }

        async function viewDetails(collection, id) {
            try {
                const itemData = await (await fetch(`${API}/${collection}/${id}`)).json();
                
                let html = `<div style="background: var(--bg); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">`;
                for (const [key, value] of Object.entries(itemData)) {
                    if (key !== 'password') {
                        const displayValue = key === 'image' && value ? `<img src="${value}" width="100" height="100" style="object-fit: cover; border-radius: 0.5rem;">` : (value === null ? '-' : value);
                        html += `<div class="menu-item" style="background: transparent; border-bottom: 1px solid #334155; padding: 0.5rem 0;">
                                    <span style="color: var(--text-muted);">${key}</span>
                                    <span style="font-weight: bold; text-align: right;">${displayValue}</span>
                                 </div>`;
                    }
                }
                html += `</div>`;

                // Add special logic for orders to show items
                if (collection === 'orders') {
                    const details = await (await fetch(`${API}/order_details`)).json();
                    const menu = await (await fetch(`${API}/menu`)).json();
                    const orderItems = details.filter(d => d.order_id == id);
                    
                    html += `<h3 style="margin: 1rem 0 0.5rem 0; font-size: 1.1rem; color: var(--accent);">รายการเมนูที่สั่ง</h3>`;
                    if (orderItems.length === 0) {
                        html += `<p class="text-muted">ไม่พบรายละเอียดเมนูในออเดอร์นี้.</p>`;
                    } else {
                        let total = 0;
                        html += `<div style="background: var(--bg); padding: 1rem; border-radius: 0.5rem;">`;
                        orderItems.forEach(item => {
                            const menuItem = menu.find(m => m.menu_id == item.menu_id);
                            if (menuItem) {
                                const subtotal = menuItem.price * item.quantity;
                                total += subtotal;
                                html += `<div class="menu-item" style="background: transparent; border-bottom: 1px solid #334155; padding: 0.5rem 0;">
                                            <span>${menuItem.menu_name} (x${item.quantity})</span>
                                            <span>฿${subtotal}</span>
                                         </div>`;
                            }
                        });
                        html += `<div class="menu-item" style="background: transparent; padding: 1rem 0 0 0; font-weight: bold; color: var(--accent);">
                                    <span>ยอดรวมค่าอาหาร</span>
                                    <span>฿${total}</span>
                                 </div></div>`;
                    }
                }

                document.getElementById('info-modal-title').innerText = 'รายละเอียดข้อมูล';
                document.getElementById('info-modal-body').innerHTML = html;
                
                // Show delete button
                const delBtn = document.getElementById('info-modal-delete-btn');
                delBtn.style.display = 'block';
                delBtn.onclick = () => {
                    document.getElementById('info-modal').classList.remove('active');
                    deleteItem(collection, id);
                };

                document.getElementById('info-modal').classList.add('active');
            } catch (err) {
                alert('ไม่สามารถดึงข้อมูลได้');
            }
        }

        async function deleteItem(collection, id) {
            if(confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) {
                await fetch(`${API}/${collection}/${id}`, { method: 'DELETE' });
                openManage(collection);
            }
        }

        function showAddModal() {
            isEditMode = false;
            editingItemId = null;
            renderManageForm();
        }

        async function showEditModal(collection, id) {
            isEditMode = true;
            currentManageCollection = collection;
            editingItemId = id;
            const data = await (await fetch(`${API}/${collection}/${id}`)).json();
            renderManageForm(data);
        }

        function renderManageForm(values = {}) {
            const fieldsMap = {
                'staff': [
                    { name: 'staff_name', label: 'ชื่อพนักงาน', type: 'text' },
                    { name: 'position', label: 'ตำแหน่ง (เช่น Admin, Manager)', type: 'text' },
                    { name: 'password', label: 'รหัสผ่าน', type: 'password' },
                    { name: 'image', label: 'รูปภาพ', type: 'file' }
                ],
                'cats': [
                    { name: 'cat_name', label: 'ชื่อแมว', type: 'text' },
                    { name: 'breed', label: 'สายพันธุ์', type: 'text' },
                    { name: 'staff_id', label: 'รหัสพนักงานที่ดูแล (Staff ID)', type: 'number' },
                    { name: 'image', label: 'รูปภาพ', type: 'file' }
                ],
                'menu': [
                    { name: 'menu_name', label: 'ชื่อเมนู', type: 'text' },
                    { name: 'price', label: 'ราคา', type: 'number' },
                    { name: 'category', label: 'หมวดหมู่', type: 'text' },
                    { name: 'image', label: 'รูปภาพ', type: 'file' }
                ],
                'boardgames': [
                    { name: 'game_name', label: 'ชื่อเกม', type: 'text' },
                    { name: 'category', label: 'หมวดหมู่', type: 'select', options: ['Strategy', 'Party'] },
                    { name: 'status', label: 'สถานะ', type: 'select', options: ['available', 'borrowed'] },
                    { name: 'image', label: 'รูปภาพ', type: 'file' }
                ],
                'orders': [
                    { name: 'status', label: 'สถานะ', type: 'select', options: ['กำลังทำ', 'เสร็จแล้ว'] }
                ]
            };

            const fields = fieldsMap[currentManageCollection];
            if (!fields) {
                alert('ยังไม่รองรับการจัดการข้อมูลในส่วนนี้ผ่านหน้าเว็บโดยตรง');
                return;
            }

            const html = fields.map(f => {
                const value = values[f.name] !== undefined && values[f.name] !== null ? values[f.name] : '';
                if (f.type === 'select') {
                    return `<div class="form-group"><label>${f.label}</label>
                            <select id="add_${f.name}" required>${f.options.map(o => `<option value="${o}" ${o === value ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
                }
                if (f.type === 'file') {
                    const preview = value ? `<img src="${value}" width="100" style="margin-bottom: 10px;"><br>` : '';
                    return `<div class="form-group"><label>${f.label}</label>${preview}<input type="file" id="add_${f.name}" accept="image/*"></div>`;
                }
                return `<div class="form-group"><label>${f.label}</label>
                        <input type="${f.type}" id="add_${f.name}" value="${value}" required></div>`;
            }).join('');

            document.getElementById('add-form-fields').innerHTML = html;
            document.getElementById('add-modal-title').innerText = isEditMode ? 'แก้ไข ' + document.getElementById('manage-title').innerText.replace('จัดการ', '') : 'เพิ่ม ' + document.getElementById('manage-title').innerText.replace('จัดการ', '');
            document.getElementById('add-modal').classList.add('active');
        }

        async function submitAddForm(e) {
            e.preventDefault();
            const fieldsMap = {
                'staff': ['staff_name', 'position', 'password', 'image'],
                'cats': ['cat_name', 'breed', 'staff_id', 'image'],
                'menu': ['menu_name', 'price', 'category', 'image'],
                'boardgames': ['game_name', 'category', 'status', 'image'],
                'orders': ['status']
            };

            const fields = fieldsMap[currentManageCollection];
            const formData = new FormData();
            fields.forEach(f => {
                const input = document.getElementById('add_' + f);
                if (input.type === 'file' && input.files[0]) {
                    formData.append(f, input.files[0]);
                } else {
                    formData.append(f, input.value);
                }
            });

            try {
                await fetch(`${API}/${currentManageCollection}${isEditMode ? '/' + editingItemId : ''}`, {
                    method: isEditMode ? 'PUT' : 'POST',
                    body: formData
                });
                alert(isEditMode ? 'แก้ไขข้อมูลสำเร็จ!' : 'เพิ่มข้อมูลสำเร็จ!');
                document.getElementById('add-modal').classList.remove('active');
                openManage(currentManageCollection);
            } catch (err) {
                alert('เกิดข้อผิดพลาด: ' + err.message);
            } finally {
                isEditMode = false;
                editingItemId = null;
            }
        }

        // --- GRAPH VISUALIZATION ---
        async function renderGraph() {
            const custs = await (await fetch(`${API}/customers`)).json();
            const visits = await (await fetch(`${API}/visits`)).json();
            const orders = await (await fetch(`${API}/orders`)).json();
            const staff = await (await fetch(`${API}/staff`)).json();

            const nodes = [];
            const edges = [];

            custs.forEach(c => nodes.push({ id: 'c'+c.customer_id, label: c.name, color: '#6366f1' }));
            staff.forEach(s => nodes.push({ id: 's'+s.staff_id, label: s.staff_name, color: '#10b981' }));
            visits.forEach(v => {
                nodes.push({ id: 'v'+v.visit_id, label: 'การเข้าใช้บริการ', color: '#ec4899', shape: 'diamond' });
                edges.push({ from: 'c'+v.customer_id, to: 'v'+v.visit_id, label: 'VISITS (เข้ามา)' });
                edges.push({ from: 'v'+v.visit_id, to: 's'+v.staff_id, label: 'HANDLED_BY (ดูแลโดย)' });
            });
            orders.forEach(o => {
                nodes.push({ id: 'o'+o.order_id, label: 'ออเดอร์', color: '#f59e0b' });
                edges.push({ from: 'v'+o.visit_id, to: 'o'+o.order_id, label: 'ORDERED (สั่งอาหาร)' });
            });

            const container = document.getElementById('graph-container');
            const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
            const options = {
                physics: { stabilization: true },
                edges: { arrows: 'to', font: { size: 10, color: '#fff' } },
                nodes: { font: { color: '#fff' } }
            };
            new vis.Network(container, data, options);
        }

// Override login/logout to save state
const originalLoginSuccess = loginSuccess;
loginSuccess = function() {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    originalLoginSuccess();
};

const originalLogout = logout;
logout = function() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentVisit');
    localStorage.removeItem('cart');
    originalLogout();
};

// Persistent logic is now integrated into main functions
const originalDoCheckin = doCheckin;
doCheckin = async function() {
    await originalDoCheckin();
    localStorage.setItem('currentVisit', JSON.stringify(currentVisit));
};

const originalFinishPayment = finishPayment;
finishPayment = async function() {
    await originalFinishPayment();
    localStorage.removeItem('currentVisit');
};

// Initialize App
async function initApp() {
    // Load Auth Modal
    const authRes = await fetch('pages/auth.html');
    const authHtml = await authRes.text();
    document.body.insertAdjacentHTML('afterbegin', authHtml);

    // Setup Info & Add Modals (static in index)
    
    // Show app container by default to show Home page
    document.getElementById('app-container').classList.add('active');
    
    if (currentUser) {
        document.getElementById('auth-modal').classList.remove('active');
        document.getElementById('auth-controls').style.display = 'flex';
        document.getElementById('guest-controls').style.display = 'none';
        const name = currentUser.role === 'customer' ? currentUser.user.name : currentUser.user.staff_name;
        const roleTh = currentUser.role === 'customer' ? 'ลูกค้า' : 'พนักงาน';
        document.getElementById('nav-user-info').innerText = `${name} (${roleTh})`;
        updateSidebar();
        
        if (currentUser.role === 'customer') {
            loadPage('home');
        } else {
            loadPage('dashboard');
        }
    } else {
        // Not logged in, still show Home page
        document.getElementById('auth-controls').style.display = 'none';
        document.getElementById('guest-controls').style.display = 'flex';
        updateSidebar();
        loadPage('home');
    }
}

window.onload = initApp;
