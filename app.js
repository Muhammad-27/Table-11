// TWA Initsializatsiyasi
const tg = window.Telegram.WebApp;
tg.ready();      // TWA tayyor ekanligini bildirish
tg.expand();     // Ilovani to'liq ekranda ochish

const API_URL = 'https://table-11-api.onrender.com/api'; // (Yoki hostinga qo'ygandagi manzil)

// DOM Elementlari
const groupsContainer = document.getElementById('groups-container');
const studentsTbody = document.getElementById('students-tbody');
const groupsView = document.getElementById('groups-view');
const studentsView = document.getElementById('students-view');
const currentGroupName = document.getElementById('current-group-name');

// Modal Elementlari
const modal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalError = document.getElementById('modal-error');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalSaveBtn = document.getElementById('modal-save-btn');

// Holat (State)
let currentGroupId = null; // Qaysi guruh ichidamiz
let modalConfig = {}; // Hozirgi ochiq modal qanday vazifani bajaryapti

async function init() {
    await fetchGroups();
}

// ==========================================
// GURUHLAR MANTIG'I
// ==========================================
async function fetchGroups() {
    try {
        const response = await fetch(`${API_URL}/groups`);
        const groups = await response.json();
        renderGroups(groups);
    } catch (error) { console.error(error); }
}

function renderGroups(groups) {
    groupsContainer.innerHTML = '';
    if (groups.length === 0) return groupsContainer.innerHTML = '<p>Hozircha guruhlar yo\'q.</p>';

    groups.forEach(group => {
        const div = document.createElement('div');
        div.className = 'group-item';
        div.onclick = (e) => { if (!e.target.closest('.btn')) openGroup(group); };
        div.innerHTML = `
            <div class="group-name">${group.name}</div>
            <div class="group-actions">
                <button class="btn btn-warning" onclick="openGroupModal('edit', ${group.id}, '${group.name}')" title="Tahrirlash"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger" onclick="deleteItem('group', ${group.id})" title="O'chirish"><i class="fas fa-trash"></i></button>
            </div>
        `;
        groupsContainer.appendChild(div);
    });
}

// Guruh Modalini ochish (Qo'shish / Tahrirlash)
document.getElementById('add-group-btn').addEventListener('click', () => openGroupModal('add'));

function openGroupModal(action, id = null, currentName = '') {
    modalTitle.textContent = action === 'add' ? "Yangi guruh qo'shish" : "Guruhni tahrirlash";
    modalBody.innerHTML = `<input type="text" id="groupNameInput" class="form-input" placeholder="Guruh nomi..." value="${currentName}">`;
    
    modalConfig = { type: 'group', action, id };
    openModal();
}

// ==========================================
// O'QUVCHILAR MANTIG'I
// ==========================================
async function openGroup(group) {
    currentGroupId = group.id;
    currentGroupName.textContent = group.name;
    
    groupsView.classList.remove('active');
    groupsView.classList.add('hidden');
    studentsView.classList.remove('hidden');
    studentsView.classList.add('active');
    
    await fetchStudents();
}

document.getElementById('back-btn').addEventListener('click', () => {
    currentGroupId = null;
    studentsView.classList.remove('active');
    studentsView.classList.add('hidden');
    groupsView.classList.remove('hidden');
    groupsView.classList.add('active');
    fetchGroups();
});

async function fetchStudents() {
    studentsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Yuklanmoqda...</td></tr>';
    try {
        const response = await fetch(`${API_URL}/groups/${currentGroupId}/students`);
        const students = await response.json();
        renderStudents(students);
    } catch (error) { console.error(error); }
}

function renderStudents(students) {
    studentsTbody.innerHTML = '';
    if(students.length === 0) return studentsTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">O'quvchilar yo'q</td></tr>`;
    
    students.forEach((student, index) => {
        studentsTbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.first_name}</td> 
                <td>${student.last_name}</td>
                <td>
                    <div class="group-actions">
                        <button class="btn btn-warning btn-sm" onclick="openStudentModal('edit', ${student.id}, '${student.first_name}', '${student.last_name}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteItem('student', ${student.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// O'quvchi Modalini ochish (Qo'shish / Tahrirlash)
document.getElementById('add-student-btn').addEventListener('click', () => openStudentModal('add'));

function openStudentModal(action, id = null, fName = '', lName = '') {
    modalTitle.textContent = action === 'add' ? "Yangi o'quvchi qo'shish" : "O'quvchini tahrirlash";
    modalBody.innerHTML = `
        <input type="text" id="firstNameInput" class="form-input" placeholder="Ism..." value="${fName}">
        <input type="text" id="lastNameInput" class="form-input" placeholder="Familiya..." value="${lName}">
    `;
    modalConfig = { type: 'student', action, id };
    openModal();
}

// ==========================================
// MODAL VA API MANTIG'I (UNIVERSAL)
// ==========================================
function openModal() {
    modalError.textContent = '';
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}
modalCancelBtn.addEventListener('click', closeModal);

modalSaveBtn.addEventListener('click', async () => {
    let url = '', method = '', bodyData = {};

    // 1. Ma'lumotlarni yig'ish va URL/Methodni aniqlash
    if (modalConfig.type === 'group') {
        const name = document.getElementById('groupNameInput').value.trim();
        if(!name) return modalError.textContent = "Iltimos, nom kiriting!";
        
        url = modalConfig.action === 'add' ? `${API_URL}/groups` : `${API_URL}/groups/${modalConfig.id}`;
        method = modalConfig.action === 'add' ? 'POST' : 'PUT';
        bodyData = { name };
    } 
    else if (modalConfig.type === 'student') {
        const first_name = document.getElementById('firstNameInput').value.trim();
        const last_name = document.getElementById('lastNameInput').value.trim();
        if(!first_name || !last_name) return modalError.textContent = "Ism va familiyani to'liq kiriting!";
        
        url = modalConfig.action === 'add' ? `${API_URL}/students` : `${API_URL}/students/${modalConfig.id}`;
        method = modalConfig.action === 'add' ? 'POST' : 'PUT';
        bodyData = { first_name, last_name, group_id: currentGroupId };
    }

    // 2. So'rov yuborish
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();

        // 3. Agar backend xato qaytarsa (masalan bir xil ism/nom)
        if (!response.ok) {
            modalError.textContent = data.error || "Xatolik yuz berdi!";
            return;
        }

        // Muvaffaqiyatli bo'lsa
        closeModal();
        modalConfig.type === 'group' ? fetchGroups() : fetchStudents();

    } catch (error) {
        modalError.textContent = "Server bilan bog'lanishda xatolik!";
    }
});

// O'chirish (Universal) - Bu yerda ham brauzer alertidan qochib Custom Confirm qilish mumkin, lekin hozircha standart `confirm` yetarli. (Juda chiroyli qilish uchun uni ham modalga ulasa bo'ladi).
async function deleteItem(type, id) {
    if(!confirm('Rostdan ham o\'chirmoqchimisiz?')) return;
    
    const url = type === 'group' ? `${API_URL}/groups/${id}` : `${API_URL}/students/${id}`;
    
    try {
        const response = await fetch(url, { method: 'DELETE' });
        if(response.ok) {
            type === 'group' ? fetchGroups() : fetchStudents();
        } else {
            alert("O'chirishda xatolik!");
        }
    } catch (error) { console.error(error); }
}

init();