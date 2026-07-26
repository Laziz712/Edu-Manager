/* =======================================================================
   SOZLAMALAR — shu yerga o'zingizning ma'lumotlaringizni kiriting
   ======================================================================= */
const CONFIG = {
  // Google Cloud Console > APIs & Services > Credentials dan olingan OAuth Client ID
  // https://console.cloud.google.com/apis/credentials
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  // Telegram bot tokeni va chat ID endi bu yerda emas — server.js ichidagi
  // .env faylida (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) sozlanadi. Bu xavfsizroq,
  // chunki tokeningiz brauzer kodida ochiq ko'rinmaydi.
};

const STORAGE_KEY = 'dataTalimAdminState_v2';

const admin = { email:'admin', password:'admin123', name:'Administrator', role:'Administrator' };

let state = null;
let currentUser = null;
let editing = { course:null, student:null, instructor:null, news:null, lesson:null };
let sidebarOpen = false;

function defaultState(){
  return {
    ids:{ course:7, student:4, instructor:7, grade:4, attendance:4, news:4, lesson:4, enrollment:1 },
    courses:[
      {id:1,name:'Frontend Dasturlash',price:'900000',description:'HTML, CSS, JavaScript va zamonaviy freymvorklar asosida veb-saytlar yaratishni o\'rganing.',instructor:'Botir Rustamov',createdAt:'10.07.2026'},
      {id:2,name:'Grafik Dizayn',price:'700000',description:'Photoshop va Illustrator dasturlarida professional grafik dizayn ko\'nikmalarini egallang.',instructor:'Malika Yusupova',createdAt:'08.07.2026'},
      {id:3,name:'SMM va Marketing',price:'650000',description:'Ijtimoiy tarmoqlarda brend yuritish, targetli reklama va kontent strategiyasini o\'rganing.',instructor:'Diyor Ergashev',createdAt:'05.07.2026'},
      {id:4,name:'Videografiya va Mobilografiya',price:'750000',description:'Telefon va kamera orqali sifatli video su\'ratga olish, montaj va kontent yaratishni o\'rganing.',instructor:'Sardor Nazarov',createdAt:'01.07.2026'},
      {id:5,name:'Buxgalteriya (1C)',price:'600000',description:'1C dasturida buxgalteriya hisobini yuritish va moliyaviy hisobotlar tuzishni o\'rganing.',instructor:'Gulnora Xolova',createdAt:'28.06.2026'},
      {id:6,name:'Kids: Robototexnika',price:'450000',description:'7-14 yoshdagi bolalar uchun robototexnika va dasturlash asoslari bo\'yicha qiziqarli mashg\'ulotlar.',instructor:'Aziz Karimov',createdAt:'25.06.2026'}
    ],
    students:[
      {id:1,name:'Jasur Tojiyev',email:'jasur@edumanager.uz',phone:'+998 90 123 45 67',password:'12345678',courseIds:[1,3],joinedAt:'01.07.2026'},
      {id:2,name:'Nilufar Sobirova',email:'nilufar@edumanager.uz',phone:'+998 91 234 56 78',password:'12345678',courseIds:[2,3,6],joinedAt:'03.07.2026'},
      {id:3,name:'Sherzod Umarov',email:'sherzod@edumanager.uz',phone:'+998 93 345 67 89',password:'12345678',courseIds:[1,3,4],joinedAt:'05.07.2026'}
    ],
    instructors:[
      {id:1,name:'Botir Rustamov',subject:'FRONTEND',bio:'Frontend dasturlash yo\'nalishi bo\'yicha 2 yillik tajribaga ega mutaxassis.',experience:'2 yillik tajriba'},
      {id:2,name:'Malika Yusupova',subject:'DIZAYN',bio:'O\'zbekiston Milliy universiteti bitiruvchisi, 20 dan ortiq dizayn loyihalari muallifi.',experience:'1+ yillik tajriba'},
      {id:3,name:'Diyor Ergashev',subject:'SMM',bio:'Ijtimoiy tarmoqlarda marketing va targetli reklama bo\'yicha mutaxassis.',experience:'3 yillik tajriba'},
      {id:4,name:'Sardor Nazarov',subject:'MEDIA',bio:'Video su\'ratga olish va montaj bo\'yicha professional mutaxassis.',experience:'2 yillik tajriba'},
      {id:5,name:'Gulnora Xolova',subject:'BUXGALTERIYA',bio:'1C dasturida buxgalteriya hisobi bo\'yicha malakali mutaxassis.',experience:'5 yillik tajriba'},
      {id:6,name:'Aziz Karimov',subject:'KIDS',bio:'Bolalar uchun robototexnika va dasturlash bo\'yicha o\'qituvchi.',experience:'2 yillik tajriba'}
    ],
    grades:[
      {id:1,studentId:1,courseId:1,score:88,date:'12.07.2026'},
      {id:2,studentId:2,courseId:3,score:76,date:'12.07.2026'},
      {id:3,studentId:3,courseId:4,score:92,date:'13.07.2026'}
    ],
    attendance:[
      {id:1,studentId:1,date:'14.07.2026',status:'Keldi',note:''},
      {id:2,studentId:2,date:'14.07.2026',status:'Kechikdi',note:'15 daqiqa kechikdi'},
      {id:3,studentId:3,date:'14.07.2026',status:'Kelmadi',note:'Kasal'}
    ],
    news:[
      {id:1,title:'Yangi kurs: Python dasturlash',category:'Kurs',content:'Python dasturlash kursi 1-avgustdan boshlanadi. Dastlabki 10 talabaga 20% chegirma!',date:'20.07.2026',createdAt:'20.07.2026'},
      {id:2,title:'Yozgi ta\'til jadvali',category:'Elon',content:'1-avgustdan 15-avgustgacha markazimizda yozgi ta\'til e\'lon qilinadi.',date:'18.07.2026',createdAt:'18.07.2026'},
      {id:3,title:'Dasturchilar musobaqasi',category:'Tadbir',content:'15-avgust kuni markazimizda dasturchilar o\'rtasida musobaqalar o\'tkaziladi.',date:'15.07.2026',createdAt:'15.07.2026'}
    ],
    lessons:[
      {id:1,courseId:1,day:'Dushanba',time:'10:00',room:'301-xona'},
      {id:2,courseId:1,day:'Chorshanba',time:'10:00',room:'301-xona'},
      {id:3,courseId:2,day:'Seshanba',time:'14:00',room:'205-xona'},
      {id:4,courseId:3,day:'Payshanba',time:'16:00',room:'102-xona'}
    ],
    enrollments:[]
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ state = JSON.parse(raw); return; }
  }catch(e){ console.error('State load error', e); }
  state = defaultState();
  persist();
}

function persist(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    flashSaveIndicator();
  }catch(e){
    console.error('State save error', e);
    showToast('Ma\'lumotni saqlashda xatolik yuz berdi', 'bad');
  }
}

function flashSaveIndicator(){
  const el = document.getElementById('saveIndicator');
  el.classList.add('show');
  clearTimeout(flashSaveIndicator._t);
  flashSaveIndicator._t = setTimeout(()=> el.classList.remove('show'), 1400);
}

/* ================= TOASTS ================= */
function showToast(msg, type='info', icon){
  const host = document.getElementById('toastHost');
  const t = document.createElement('div');
  t.className = 'toast ' + (type==='ok'?'ok':type==='bad'?'bad':'');
  const ic = icon || (type==='ok'?'fa-circle-check':type==='bad'?'fa-circle-xmark':'fa-circle-info');
  t.innerHTML = '<i class="fas ' + ic + '"></i><span>' + msg + '</span>';
  host.appendChild(t);
  setTimeout(()=>{
    t.style.animation = 'toastOut .3s forwards';
    setTimeout(()=> t.remove(), 300);
  }, 2800);
}

/* ================= CONFIRM MODAL ================= */
let pendingConfirmAction = null;
function askConfirm(title, text, onConfirm){
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  pendingConfirmAction = onConfirm;
  document.getElementById('confirmModal').classList.add('show');
}
function closeConfirm(){
  document.getElementById('confirmModal').classList.remove('show');
  pendingConfirmAction = null;
}
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('confirmActionBtn').addEventListener('click', ()=>{
    if(pendingConfirmAction) pendingConfirmAction();
    closeConfirm();
  });

  const googleConfigured = CONFIG.GOOGLE_CLIENT_ID && !CONFIG.GOOGLE_CLIENT_ID.startsWith('YOUR_');
  if(!googleConfigured){
    // Sozlanmagan bo'lsa, Google skripti yuklanishini kutmasdan darhol yashiramiz
    initGoogleSignIn();
    return;
  }

  // Google Identity Services skripti yuklanishi biroz vaqt olishi mumkin
  const tryInitGoogle = setInterval(()=>{
    if(typeof google !== 'undefined' && google.accounts){
      initGoogleSignIn();
      clearInterval(tryInitGoogle);
    }
  }, 200);
  setTimeout(()=> clearInterval(tryInitGoogle), 5000);
});

/* ================= MOBILE SIDEBAR ================= */
function toggleSidebar(){
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebarOpen = !sidebarOpen;
  if(sidebarOpen){
    sidebar.classList.add('open');
    overlay.classList.add('show');
  } else {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }
}

/* ================= LOGIN ================= */
function togglePassword(icon){
  const passInput = icon.closest('.input-group').querySelector('input');
  if(passInput.type === 'password'){
    passInput.type = 'text'; icon.classList.replace('fa-eye','fa-eye-slash');
  }else{
    passInput.type = 'password'; icon.classList.replace('fa-eye-slash','fa-eye');
  }
}

function handleForgotPassword(e){
  e.preventDefault();
  showToast("Parolni tiklash uchun administratorga murojaat qiling.", 'ok');
}

function handleLogin(e){
  e.preventDefault();
  const input = document.getElementById('loginInput').value.trim();
  const password = document.getElementById('loginPass').value;

  if(input === admin.email && password === admin.password){
    currentUser = { ...admin };
    showDashboard();
    return;
  }
  const student = state.students.find(s => (s.email===input || s.name===input) && s.password===password);
  if(student){
    currentUser = { ...student, role:'Talaba' };
    showDashboard();
    return;
  }
  const errorEl = document.getElementById('loginError');
  document.getElementById('errorMsg').textContent = 'Email yoki parol noto\'g\'ri!';
  errorEl.classList.add('show');
  setTimeout(()=> errorEl.classList.remove('show'), 4000);
}

/* ================= TABS: KIRISH / RO'YXATDAN O'TISH ================= */
function switchLoginTab(tab){
  document.getElementById('tabLoginBtn').classList.toggle('active', tab==='login');
  document.getElementById('tabRegisterBtn').classList.toggle('active', tab==='register');
  document.getElementById('loginTab').classList.toggle('hidden', tab!=='login');
  document.getElementById('registerTab').classList.toggle('hidden', tab!=='register');
}

/* ================= RO'YXATDAN O'TISH (email/parol) ================= */
function handleRegister(e){
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPass').value;

  const errorEl = document.getElementById('registerError');
  const showRegError = (msg) => {
    document.getElementById('registerErrorMsg').textContent = msg;
    errorEl.classList.add('show');
    setTimeout(()=> errorEl.classList.remove('show'), 4000);
  };

  if(email === admin.email || state.students.some(s => s.email === email)){
    showRegError("Bu email bilan hisob allaqachon mavjud. Kirish bo'limidan foydalaning.");
    return;
  }

  const newStudent = {
    id: state.ids.student++,
    name,
    email,
    phone,
    password,
    courseIds: [],
    joinedAt: todayFormatted(),
    registeredVia: 'email',
  };
  state.students.push(newStudent);
  persist();

  notifyTelegramNewUser(newStudent);

  currentUser = { ...newStudent, role:'Talaba' };
  showDashboard();
  showToast("Ro'yxatdan muvaffaqiyatli o'tdingiz!", 'ok');
}

/* ================= GOOGLE ORQALI KIRISH ================= */
function initGoogleSignIn(){
  const googleConfigured = CONFIG.GOOGLE_CLIENT_ID && !CONFIG.GOOGLE_CLIENT_ID.startsWith('YOUR_');

  if(!googleConfigured){
    // Google sozlanmagan — tugma va "yoki" chizig'ini yashirib, formani tekis qilib qo'yamiz
    document.querySelectorAll('.google-btn-wrap, .or-divider').forEach(el => el.classList.add('hidden'));
    console.warn('Google Sign-In ishlashi uchun CONFIG.GOOGLE_CLIENT_ID ni to\'ldiring.');
    return;
  }

  if(typeof google === 'undefined' || !google.accounts) return;

  google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse,
  });
  ['googleSignInLogin','googleSignInRegister'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) google.accounts.id.renderButton(el, { theme:'outline', size:'large', width:280, text:'continue_with' });
  });
}

function decodeJwt(token){
  try{
    const payload = token.split('.')[1];
    return JSON.parse(decodeURIComponent(escape(atob(payload.replace(/-/g,'+').replace(/_/g,'/')))));
  }catch(e){
    console.error('JWT decode error', e);
    return null;
  }
}

function handleGoogleCredentialResponse(response){
  const profile = decodeJwt(response.credential);
  if(!profile || !profile.email){
    showToast('Google orqali kirishda xatolik yuz berdi.', 'bad');
    return;
  }

  if(profile.email === admin.email){
    currentUser = { ...admin };
    showDashboard();
    return;
  }

  let student = state.students.find(s => s.email === profile.email);
  if(!student){
    student = {
      id: state.ids.student++,
      name: profile.name || profile.email.split('@')[0],
      email: profile.email,
      phone: '',
      password: null, // Google orqali ro'yxatdan o'tgan, parol yo'q
      courseIds: [],
      joinedAt: todayFormatted(),
      registeredVia: 'google',
    };
    state.students.push(student);
    persist();
    notifyTelegramNewUser(student);
    showToast("Google orqali ro'yxatdan o'tdingiz!", 'ok');
  }

  currentUser = { ...student, role:'Talaba' };
  showDashboard();
}

/* ================= TELEGRAM BOTGA XABAR YUBORISH (umumiy) ================= */
async function sendTelegramMessage(text){
  // Endi to'g'ridan-to'g'ri Telegram'ga emas, o'z serverimizga (server.js) yuboramiz —
  // u yerda bot tokeni xavfsiz saqlanadi va serverdan Telegram'ga yuboriladi.
  try{
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  }catch(e){
    console.error('Telegram notify error', e);
  }
}

async function notifyTelegramNewUser(user){
  // users.json'ga yozish + Telegram xabari — hammasi backendda (server.js) amalga oshadi
  try{
    const res = await fetch('/api/register-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        registeredVia: user.registeredVia || 'email',
      }),
    });
    return await res.json();
  }catch(e){
    console.error('register-user error', e);
    return null;
  }
}

function notifyTelegramNewEnrollment(student, course){
  const text =
    `📝 *Yangi kursga yozilish!*\n\n` +
    `👤 Talaba: ${student ? student.name : "Noma'lum"}\n` +
    `📚 Kurs: ${course ? course.name : "Noma'lum"}\n` +
    `🕒 Vaqt: ${new Date().toLocaleString('uz-UZ')}`;
  sendTelegramMessage(text);
}

function notifyTelegramCourseDeleted(course){
  const text =
    `🗑 *Kurs o'chirildi*\n\n` +
    `📚 Kurs: ${course.name}\n` +
    `🕒 Vaqt: ${new Date().toLocaleString('uz-UZ')}`;
  sendTelegramMessage(text);
}

function notifyTelegramNewTeacher(teacher){
  const text =
    `👨‍🏫 *Yangi o'qituvchi qo'shildi!*\n\n` +
    `👤 Ism: ${teacher.name}\n` +
    `🧭 Yo'nalish: ${teacher.subject || '—'}\n` +
    `📈 Tajriba: ${teacher.experience || '—'}\n` +
    `🕒 Vaqt: ${new Date().toLocaleString('uz-UZ')}`;
  sendTelegramMessage(text);
}

function todayFormatted(){
  const d = new Date();
  return String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear();
}

function showDashboard(){
  document.getElementById('loginContainer').classList.add('hidden');
  document.getElementById('dashboardWrapper').classList.remove('hidden');
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = currentUser.role;
  document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

  const studentMenu = document.getElementById('studentMenuSection');
  if(currentUser.role === 'Talaba'){
    studentMenu.style.display = 'block';
  } else {
    studentMenu.style.display = 'none';
  }

  updateTopbar();
  switchSection('dashboard', document.querySelector('.nav-item'));
  renderAll();
  showToast('Xush kelibsiz, ' + currentUser.name + '!', 'ok');
}

function handleLogout(){
  askConfirm('Tizimdan chiqasizmi?', 'Qaytadan kirish uchun login va parolni kiritishingiz kerak bo\'ladi.', ()=>{
    currentUser = null;
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('dashboardWrapper').classList.add('hidden');
    document.getElementById('loginForm').reset();
    sidebarOpen = false;
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  });
  document.getElementById('confirmActionBtn').textContent = 'Chiqish';
}

/* ================= NAV ================= */
function switchSection(section, btn){
  document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));
  document.getElementById(section).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(btn) btn.classList.add('active');

  const meta = {
    dashboard:{icon:'fa-chart-pie', title:'Dashboard', sub:'Umumiy ko\'rsatkichlar'},
    courses:{icon:'fa-book-open', title:'Kurslar', sub:'Barcha faol kurslar ro\'yxati'},
    students:{icon:'fa-users', title:'Talabalar', sub:'Ro\'yxatga olingan talabalar'},
    instructors:{icon:'fa-chalkboard-user', title:'O\'qituvchilar', sub:'Jamoa a\'zolari'},
    grades:{icon:'fa-star', title:'Baholar', sub:'Talabalar bahosi'},
    attendance:{icon:'fa-clipboard-list', title:'Davomat', sub:'Kunlik davomat holati'},
    myCourses:{icon:'fa-book-reader', title:'Mening kurslarim', sub:'Siz yozilgan kurslar'},
    news:{icon:'fa-newspaper', title:'Yangiliklar', sub:'So\'nggi yangiliklar va e\'lonlar'},
    lessons:{icon:'fa-chalkboard', title:'Darslar jadvali', sub:'Haftalik darslar jadvali'}
  }[section];
  document.getElementById('pageIcon').className = 'fas ' + meta.icon;
  document.getElementById('pageTitle').textContent = meta.title;
  document.getElementById('pageSubtitle').textContent = meta.sub;
  updateTopbar(section);

  if(sidebarOpen && window.innerWidth < 768){
    toggleSidebar();
  }
}

function updateTopbar(section){
  section = section || document.querySelector('.page-section.active')?.id;
  const isAdmin = currentUser.role === 'Administrator';
  const actions = document.getElementById('topbarActions');
  actions.innerHTML = '';

  if(!isAdmin){
    if(section === 'courses'){
      actions.innerHTML += '<button class="btn-ghost" onclick="switchSection(\'myCourses\', document.querySelectorAll(\'.nav-item\')[6])"><i class="fas fa-book-reader"></i> Mening kurslarim</button>';
    }
    return;
  }

  if(section === 'courses' || section === 'dashboard'){
    actions.innerHTML += '<button class="btn-primary" onclick="openCourseModal()"><i class="fas fa-plus"></i> Kurs qo\'shish</button>';
  }
  if(section === 'students' || section === 'dashboard'){
    actions.innerHTML += '<button class="btn-primary" onclick="openStudentModal()"><i class="fas fa-plus"></i> Talaba qo\'shish</button>';
  }
  if(section === 'instructors'){
    actions.innerHTML += '<button class="btn-primary" onclick="openInstructorModal()"><i class="fas fa-plus"></i> O\'qituvchi qo\'shish</button>';
  }
  if(section === 'grades'){
    actions.innerHTML += '<button class="btn-primary" onclick="openGradeModal()"><i class="fas fa-plus"></i> Baho qo\'shish</button>';
  }
  if(section === 'attendance'){
    actions.innerHTML += '<button class="btn-primary" onclick="openAttendanceModal()"><i class="fas fa-plus"></i> Davomat qo\'shish</button>';
  }
  if(section === 'news'){
    actions.innerHTML += '<button class="btn-primary" onclick="openNewsModal()"><i class="fas fa-plus"></i> Yangilik qo\'shish</button>';
  }
  if(section === 'lessons'){
    actions.innerHTML += '<button class="btn-primary" onclick="openLessonModal()"><i class="fas fa-plus"></i> Dars qo\'shish</button>';
  }
  if(section === 'students'){
    actions.innerHTML += '<div class="search-box"><i class="fas fa-magnifying-glass"></i><input type="text" id="studentSearch" placeholder="Qidirish..." oninput="renderStudents()"></div>';
  }
  if(section === 'courses'){
    actions.innerHTML += '<div class="search-box"><i class="fas fa-magnifying-glass"></i><input type="text" id="courseSearch" placeholder="Qidirish..." oninput="renderCourses()"></div>';
  }
}

/* ================= MODALS ================= */
function openModal(id){ document.getElementById(id).classList.add('show'); }
function closeModal(id){
  document.getElementById(id).classList.remove('show');
  const formIds = { courseModal:'courseForm', studentModal:'studentForm', instructorModal:'instructorForm',
                    gradeModal:'gradeForm', attendanceModal:'attendanceForm', enrollModal:'enrollForm',
                    newsModal:'newsForm', lessonModal:'lessonForm' };
  const f = document.getElementById(formIds[id]);
  if(f) f.reset();
}

/* ---- Course modal ---- */
function openCourseModal(course){
  editing.course = course ? course.id : null;
  const title = course
    ? '<i class="fas fa-pen"></i> Kursni tahrirlash'
    : '<i class="fas fa-plus-circle"></i> Yangi kurs qo\'shish';
  document.getElementById('courseModalTitle').innerHTML = title;
  const f = document.getElementById('courseForm');
  f.reset();
  if(course){
    f.name.value = course.name; f.price.value = course.price;
    f.description.value = course.description; f.instructor.value = course.instructor;
  }
  openModal('courseModal');
}
function saveCourse(e){
  e.preventDefault();
  const f = e.target;
  if(editing.course){
    const c = state.courses.find(c=>c.id===editing.course);
    Object.assign(c, { name:f.name.value, price:f.price.value, description:f.description.value, instructor:f.instructor.value });
    showToast('Kurs yangilandi', 'ok');
  } else {
    state.courses.push({
      id: state.ids.course++, name:f.name.value, price:f.price.value,
      description:f.description.value, instructor:f.instructor.value,
      createdAt: new Date().toLocaleDateString('uz-UZ')
    });
    showToast('Yangi kurs qo\'shildi', 'ok');
  }
  editing.course = null;
  persist();
  closeModal('courseModal');
  renderAll();
}
function deleteCourse(id){
  const course = state.courses.find(c=>c.id===id);
  askConfirm('"' + course.name + '" o\'chirilsinmi?', 'Bu kursga oid barcha bog\'lanishlar ham olib tashlanadi.', ()=>{
    state.courses = state.courses.filter(c=>c.id!==id);
    state.students.forEach(s=> s.courseIds = s.courseIds.filter(cid=>cid!==id));
    state.grades = state.grades.filter(g=>g.courseId!==id);
    state.lessons = state.lessons.filter(l=>l.courseId!==id);
    persist();
    renderAll();
    showToast('Kurs o\'chirildi', 'bad');
    notifyTelegramCourseDeleted(course);
  });
  document.getElementById('confirmActionBtn').textContent = 'O\'chirish';
}

/* ---- Student modal ---- */
function fillCourseSelectMultiple(selected){
  const sel = document.getElementById('studentCoursesSelect');
  sel.innerHTML = state.courses.map(c=>'<option value="' + c.id + '"' + (selected && selected.includes(c.id)?' selected':'') + '>' + c.name + '</option>').join('');
}
function openStudentModal(student){
  editing.student = student ? student.id : null;
  const title = student
    ? '<i class="fas fa-pen"></i> Talabani tahrirlash'
    : '<i class="fas fa-plus-circle"></i> Yangi talaba qo\'shish';
  document.getElementById('studentModalTitle').innerHTML = title;
  const f = document.getElementById('studentForm');
  f.reset();
  fillCourseSelectMultiple(student ? student.courseIds : []);
  if(student){
    f.name.value = student.name; f.email.value = student.email;
    f.phone.value = student.phone; f.password.value = student.password;
  }
  openModal('studentModal');
}
function saveStudent(e){
  e.preventDefault();
  const f = e.target;
  const courseIds = Array.from(document.getElementById('studentCoursesSelect').selectedOptions).map(o=>Number(o.value));
  if(editing.student){
    const s = state.students.find(s=>s.id===editing.student);
    Object.assign(s, { name:f.name.value, email:f.email.value, phone:f.phone.value, password:f.password.value, courseIds });
    showToast('Talaba ma\'lumotlari yangilandi', 'ok');
  } else {
    state.students.push({
      id: state.ids.student++, name:f.name.value, email:f.email.value,
      phone:f.phone.value, password:f.password.value, courseIds,
      joinedAt: new Date().toLocaleDateString('uz-UZ')
    });
    showToast('Yangi talaba qo\'shildi', 'ok');
  }
  editing.student = null;
  persist();
  closeModal('studentModal');
  renderAll();
}
function deleteStudent(id){
  const student = state.students.find(s=>s.id===id);
  askConfirm('"' + student.name + '" o\'chirilsinmi?', 'Talabaning barcha baho va davomat yozuvlari ham o\'chiriladi.', ()=>{
    state.students = state.students.filter(s=>s.id!==id);
    state.grades = state.grades.filter(g=>g.studentId!==id);
    state.attendance = state.attendance.filter(a=>a.studentId!==id);
    persist();
    renderAll();
    showToast('Talaba o\'chirildi', 'bad');
  });
  document.getElementById('confirmActionBtn').textContent = 'O\'chirish';
}

/* ---- Instructor modal ---- */
function openInstructorModal(ins){
  editing.instructor = ins ? ins.id : null;
  const title = ins
    ? '<i class="fas fa-pen"></i> O\'qituvchini tahrirlash'
    : '<i class="fas fa-plus-circle"></i> Yangi o\'qituvchi qo\'shish';
  document.getElementById('instructorModalTitle').innerHTML = title;
  const f = document.getElementById('instructorForm');
  f.reset();
  if(ins){
    f.name.value = ins.name; f.subject.value = ins.subject;
    f.experience.value = ins.experience; f.bio.value = ins.bio;
  }
  openModal('instructorModal');
}
function saveInstructor(e){
  e.preventDefault();
  const f = e.target;
  if(editing.instructor){
    const ins = state.instructors.find(i=>i.id===editing.instructor);
    Object.assign(ins, { name:f.name.value, subject:f.subject.value, experience:f.experience.value, bio:f.bio.value });
    showToast('O\'qituvchi ma\'lumotlari yangilandi', 'ok');
  } else {
    const newInstructor = { id: state.ids.instructor++, name:f.name.value, subject:f.subject.value, experience:f.experience.value, bio:f.bio.value };
    state.instructors.push(newInstructor);
    showToast('Yangi o\'qituvchi qo\'shildi', 'ok');
    notifyTelegramNewTeacher(newInstructor);
  }
  editing.instructor = null;
  persist();
  closeModal('instructorModal');
  renderAll();
}
function deleteInstructor(id){
  const ins = state.instructors.find(i=>i.id===id);
  askConfirm('"' + ins.name + '" o\'chirilsinmi?', 'Bu amalni qaytarib bo\'lmaydi.', ()=>{
    state.instructors = state.instructors.filter(i=>i.id!==id);
    persist();
    renderAll();
    showToast('O\'qituvchi o\'chirildi', 'bad');
  });
  document.getElementById('confirmActionBtn').textContent = 'O\'chirish';
}

/* ---- Grade modal ---- */
function openGradeModal(){
  const sSel = document.getElementById('gradeStudentSelect');
  const cSel = document.getElementById('gradeCourseSelect');
  sSel.innerHTML = state.students.map(s=>'<option value="' + s.id + '">' + s.name + '</option>').join('') || '<option value="">Talaba yo\'q</option>';
  cSel.innerHTML = state.courses.map(c=>'<option value="' + c.id + '">' + c.name + '</option>').join('') || '<option value="">Kurs yo\'q</option>';
  document.getElementById('gradeForm').reset();
  openModal('gradeModal');
}
function saveGrade(e){
  e.preventDefault();
  const f = e.target;
  state.grades.push({
    id: state.ids.grade++, studentId:Number(f.studentId.value), courseId:Number(f.courseId.value),
    score:Number(f.score.value), date:new Date().toLocaleDateString('uz-UZ')
  });
  persist();
  closeModal('gradeModal');
  renderAll();
  showToast('Baho qo\'shildi', 'ok');
}
function deleteGrade(id){
  askConfirm('Bahoni o\'chirasizmi?', 'Bu amalni qaytarib bo\'lmaydi.', ()=>{
    state.grades = state.grades.filter(g=>g.id!==id);
    persist();
    renderAll();
    showToast('Baho o\'chirildi', 'bad');
  });
  document.getElementById('confirmActionBtn').textContent = 'O\'chirish';
}

/* ---- Attendance modal ---- */
function openAttendanceModal(){
  const sSel = document.getElementById('attendanceStudentSelect');
  sSel.innerHTML = state.students.map(s=>'<option value="' + s.id + '">' + s.name + '</option>').join('') || '<option value="">Talaba yo\'q</option>';
  const f = document.getElementById('attendanceForm');
  f.reset();
  f.date.value = new Date().toISOString().split('T')[0];
  openModal('attendanceModal');
}
function saveAttendance(e){
  e.preventDefault();
  const f = e.target;
  const dateObj = new Date(f.date.value);
  state.attendance.push({
    id: state.ids.attendance++, studentId:Number(f.studentId.value),
    date: dateObj.toLocaleDateString('uz-UZ'), status:f.status.value, note:f.note.value
  });
  persist();
  closeModal('attendanceModal');
  renderAll();
  showToast('Davomat belgilandi', 'ok');
}
function deleteAttendance(id){
  askConfirm('Davomat yozuvi o\'chirilsinmi?', 'Bu amalni qaytarib bo\'lmaydi.', ()=>{
    state.attendance = state.attendance.filter(a=>a.id!==id);
    persist();
    renderAll();
    showToast('Yozuv o\'chirildi', 'bad');
  });
  document.getElementById('confirmActionBtn').textContent = 'O\'chirish';
}

/* ---- Enroll modal ---- */
function openEnrollModal(courseId){
  const course = state.courses.find(c=>c.id===courseId);
  if(!course) return;
  document.getElementById('enrollCourseId').value = courseId;
  document.getElementById('enrollCourseName').value = course.name;
  document.getElementById('enrollStudentName').value = currentUser.name;
  document.getElementById('enrollForm').reset();
  document.getElementById('enrollCourseId').value = courseId;
  document.getElementById('enrollCourseName').value = course.name;
  document.getElementById('enrollStudentName').value = currentUser.name;
  openModal('enrollModal');
}
function saveEnrollment(e){
  e.preventDefault();
  const f = e.target;
  const courseId = Number(f.courseId.value);

  if(currentUser.courseIds && currentUser.courseIds.includes(courseId)){
    showToast('Siz allaqachon bu kursga yozilgansiz!', 'bad');
    closeModal('enrollModal');
    return;
  }

  const student = state.students.find(s=>s.id===currentUser.id);
  if(student){
    student.courseIds.push(courseId);
    currentUser.courseIds = [...student.courseIds];
  }

  state.enrollments.push({
    id: state.ids.enrollment++,
    studentId: currentUser.id,
    courseId: courseId,
    startDate: f.startDate.value,
    paymentType: f.paymentType.value,
    note: f.note.value,
    enrolledAt: new Date().toLocaleDateString('uz-UZ')
  });

  persist();
  closeModal('enrollModal');
  renderAll();
  showToast('Kursga muvaffaqiyatli yozildingiz!', 'ok');
  notifyTelegramNewEnrollment(student, state.courses.find(c=>c.id===courseId));
}

/* ---- News modal ---- */
function openNewsModal(news){
  editing.news = news ? news.id : null;
  const title = news
    ? '<i class="fas fa-pen"></i> Yangilikni tahrirlash'
    : '<i class="fas fa-plus-circle"></i> Yangilik qo\'shish';
  document.getElementById('newsModalTitle').innerHTML = title;
  const f = document.getElementById('newsForm');
  f.reset();
  document.getElementById('newsDate').value = new Date().toISOString().split('T')[0];
  if(news){
    f.title.value = news.title;
    f.category.value = news.category;
    f.content.value = news.content;
    document.getElementById('newsDate').value = news.date.split('.').reverse().join('-');
  }
  openModal('newsModal');
}
function saveNews(e){
  e.preventDefault();
  const f = e.target;
  const dateVal = f.date.value;
  const dateStr = dateVal ? new Date(dateVal).toLocaleDateString('uz-UZ') : new Date().toLocaleDateString('uz-UZ');

  if(editing.news){
    const n = state.news.find(n=>n.id===editing.news);
    Object.assign(n, { title:f.title.value, category:f.category.value, content:f.content.value, date:dateStr });
    showToast('Yangilik yangilandi', 'ok');
  } else {
    state.news.push({
      id: state.ids.news++, title:f.title.value, category:f.category.value,
      content:f.content.value, date:dateStr, createdAt: new Date().toLocaleDateString('uz-UZ')
    });
    showToast('Yangi yangilik qo\'shildi', 'ok');
  }
  editing.news = null;
  persist();
  closeModal('newsModal');
  renderAll();
}
function deleteNews(id){
  askConfirm('Yangilik o\'chirilsinmi?', 'Bu amalni qaytarib bo\'lmaydi.', ()=>{
    state.news = state.news.filter(n=>n.id!==id);
    persist();
    renderAll();
    showToast('Yangilik o\'chirildi', 'bad');
  });
  document.getElementById('confirmActionBtn').textContent = 'O\'chirish';
}

/* ---- Lesson modal ---- */
function openLessonModal(lesson){
  editing.lesson = lesson ? lesson.id : null;
  const title = lesson
    ? '<i class="fas fa-pen"></i> Darsni tahrirlash'
    : '<i class="fas fa-plus-circle"></i> Dars qo\'shish';
  document.getElementById('lessonModalTitle').innerHTML = title;
  const sel = document.getElementById('lessonCourseSelect');
  sel.innerHTML = state.courses.map(c=>'<option value="' + c.id + '">' + c.name + '</option>').join('');
  const f = document.getElementById('lessonForm');
  f.reset();
  if(lesson){
    f.courseId.value = lesson.courseId;
    f.day.value = lesson.day;
    f.time.value = lesson.time;
    f.room.value = lesson.room;
  }
  openModal('lessonModal');
}
function saveLesson(e){
  e.preventDefault();
  const f = e.target;
  if(editing.lesson){
    const l = state.lessons.find(l=>l.id===editing.lesson);
    Object.assign(l, { courseId:Number(f.courseId.value), day:f.day.value, time:f.time.value, room:f.room.value });
    showToast('Dars yangilandi', 'ok');
  } else {
    state.lessons.push({
      id: state.ids.lesson++, courseId:Number(f.courseId.value),
      day:f.day.value, time:f.time.value, room:f.room.value
    });
    showToast('Yangi dars qo\'shildi', 'ok');
  }
  editing.lesson = null;
  persist();
  closeModal('lessonModal');
  renderAll();
}
function deleteLesson(id){
  askConfirm('Dars o\'chirilsinmi?', 'Bu amalni qaytarib bo\'lmaydi.', ()=>{
    state.lessons = state.lessons.filter(l=>l.id!==id);
    persist();
    renderAll();
    showToast('Dars o\'chirildi', 'bad');
  });
  document.getElementById('confirmActionBtn').textContent = 'O\'chirish';
}

/* ================= RENDER HELPERS ================= */
function studentName(id){ const s = state.students.find(s=>s.id===id); return s ? s.name : 'Noma\'lum'; }
function courseName(id){ const c = state.courses.find(c=>c.id===id); return c ? c.name : 'Noma\'lum'; }
function courseStudentCount(courseId){ return state.students.filter(s=>s.courseIds.includes(courseId)).length; }
function fmtPrice(v){ return Number(v).toLocaleString('uz-UZ'); }
function gradeBadgeClass(score){ return score>=80?'grade-a':score>=60?'grade-b':'grade-c'; }
function attendanceBadgeClass(status){ return status==='Keldi'?'ok':status==='Kechikdi'?'warn':'bad'; }

/* ================= RENDER ================= */
function renderAll(){
  document.getElementById('totalCourses').textContent = state.courses.length;
  document.getElementById('totalStudents').textContent = state.students.length;
  document.getElementById('navCourseCount').textContent = state.courses.length;
  document.getElementById('navStudentCount').textContent = state.students.length;
  document.getElementById('navInstructorCount').textContent = state.instructors.length;
  document.getElementById('courseChange').textContent = state.courses.length ? state.courses.length + ' ta faol yo\'nalish' : 'Hali kurs yo\'q';
  document.getElementById('studentChange').textContent = state.students.length ? state.students.length + ' ta ro\'yxatdan o\'tgan' : 'Hali talaba yo\'q';

  if(state.grades.length){
    const avg = state.grades.reduce((sum,g)=>sum+g.score,0) / state.grades.length;
    document.getElementById('avgGrade').textContent = avg.toFixed(1);
    document.getElementById('gradeCount').textContent = state.grades.length + ' ta baho asosida';
    document.getElementById('gradeCount').className = 'stat-change ok';
  } else {
    document.getElementById('avgGrade').textContent = '—';
    document.getElementById('gradeCount').textContent = 'Hali baho yo\'q';
    document.getElementById('gradeCount').className = 'stat-change muted';
  }

  if(state.attendance.length){
    const present = state.attendance.filter(a=>a.status==='Keldi').length;
    const rate = (present/state.attendance.length*100).toFixed(1);
    document.getElementById('attendanceRate').textContent = rate + '%';
    document.getElementById('attendanceCount').textContent = state.attendance.length + ' ta yozuv asosida';
    document.getElementById('attendanceCount').className = 'stat-change ok';
  } else {
    document.getElementById('attendanceRate').textContent = '—';
    document.getElementById('attendanceCount').textContent = 'Ma\'lumot yo\'q';
    document.getElementById('attendanceCount').className = 'stat-change muted';
  }

  renderDashboardTable();
  renderCourses();
  renderStudents();
  renderInstructors();
  renderGrades();
  renderAttendance();
  renderMyCourses();
  renderNews();
  renderSchedule();
}

function renderDashboardTable() {
  const tbody = document.getElementById('dashboardTable');
  if (state.courses.length === 0) {
    tbody.innerHTML = emptyRow(5, 'Hozircha kurslar qo\'shilmagan');
    return;
  }
  tbody.innerHTML = state.courses.map(c => 
    '<tr>' +
      '<td class="highlight">' + c.name + '</td>' +
      '<td>' + courseStudentCount(c.id) + '</td>' +
      '<td>' + c.instructor + '</td>' +
      '<td>' + fmtPrice(c.price) + ' so\'m</td>' +
      '<td>' + c.createdAt + '</td>' +
    '</tr>'
  ).join('');
}

function emptyRow(colspan, text) {
  return '<tr><td colspan="' + colspan + '" style="text-align:center;padding:40px;">' +
    '<i class="fas fa-inbox" style="font-size:32px;opacity:.25;display:block;margin-bottom:10px;"></i>' + text + '</td></tr>';
}

function renderCourses(){
  const grid = document.getElementById('coursesGrid');
  const q = (document.getElementById('courseSearch')?.value || '').toLowerCase();
  const list = state.courses.filter(c => c.name.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q));
  const isAdmin = currentUser.role === 'Administrator';
  const isStudent = currentUser.role === 'Talaba';

  if(state.courses.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1;"><div class="empty-state"><i class="fas fa-inbox"></i><h3>Kurslar yo\'q</h3><p>Hozircha kurslar qo\'shilmagan</p></div></div>';
    return;
  }
  if(list.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1;"><div class="empty-state"><i class="fas fa-magnifying-glass"></i><h3>Hech narsa topilmadi</h3><p>Boshqa so\'z bilan qidirib ko\'ring</p></div></div>';
    return;
  }
  grid.innerHTML = list.map(course => {
    const isEnrolled = currentUser.courseIds && currentUser.courseIds.includes(course.id);
    let actions = '';
    if(isAdmin){
      actions = '<div class="card-actions"><button class="btn-sm btn-edit" onclick="openCourseModal(' + JSON.stringify(course).replace(/'/g,'&apos;') + ')"><i class="fas fa-pen"></i> Tahrirlash</button><button class="btn-sm btn-danger" onclick="deleteCourse(' + course.id + ')"><i class="fas fa-trash"></i> O\'chirish</button></div>';
    } else if(isStudent){
      if(isEnrolled){
        actions = '<div class="card-actions"><button class="btn-sm btn-view" disabled><i class="fas fa-check"></i> Yozilgan</button></div>';
      } else {
        actions = '<div class="card-actions"><button class="btn-sm btn-enroll" onclick="openEnrollModal(' + course.id + ')"><i class="fas fa-user-plus"></i> Yozilish</button></div>';
      }
    }
    return '<div class="card"><div class="card-header"><div class="card-title">' + course.name + '</div><div class="card-badge">AKTIV</div></div><div class="card-desc">' + course.description + '</div><div class="card-info"><div class="card-info-item"><i class="fas fa-user-tie"></i> ' + course.instructor + '</div><div class="card-info-item"><i class="fas fa-users"></i> ' + courseStudentCount(course.id) + ' talaba</div><div class="card-info-item"><i class="fas fa-tag"></i> ' + fmtPrice(course.price) + ' so\'m</div></div>' + actions + '</div>';
  }).join('');
}

function renderStudents(){
  const tbody = document.getElementById('studentsTable');
  const q = (document.getElementById('studentSearch')?.value || '').toLowerCase();
  const list = state.students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  const isAdmin = currentUser.role === 'Administrator';

  if(state.students.length === 0){ tbody.innerHTML = emptyRow(5, 'Hozircha talabalar qo\'shilmagan'); return; }
  if(list.length === 0){ tbody.innerHTML = emptyRow(5, 'Hech narsa topilmadi'); return; }

  tbody.innerHTML = list.map(s => 
    '<tr>' +
      '<td class="highlight">' + s.name + '</td>' +
      '<td>' + s.email + '</td>' +
      '<td>' + s.phone + '</td>' +
      '<td><span class="badge ok">' + s.courseIds.length + ' ta kurs</span></td>' +
      '<td>' + (isAdmin ? '<div class="row-actions"><button class="icon-btn edit" onclick="openStudentModal(' + JSON.stringify(s).replace(/'/g,'&apos;') + ')" title="Tahrirlash"><i class="fas fa-pen"></i></button><button class="icon-btn del" onclick="deleteStudent(' + s.id + ')" title="O\'chirish"><i class="fas fa-trash"></i></button></div>' : '—') + '</td>' +
    '</tr>'
  ).join('');
}

function renderInstructors(){
  const grid = document.getElementById('instructorsGrid');
  const isAdmin = currentUser.role === 'Administrator';
  if(state.instructors.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1;"><div class="empty-state"><i class="fas fa-chalkboard-user"></i><h3>O\'qituvchilar yo\'q</h3><p>Hozircha o\'qituvchilar qo\'shilmagan</p></div></div>';
    return;
  }
  grid.innerHTML = state.instructors.map(ins => {
    const actions = isAdmin ? '<div class="card-actions"><button class="btn-sm btn-edit" onclick="openInstructorModal(' + JSON.stringify(ins).replace(/'/g,'&apos;') + ')"><i class="fas fa-pen"></i> Tahrirlash</button><button class="btn-sm btn-danger" onclick="deleteInstructor(' + ins.id + ')"><i class="fas fa-trash"></i> O\'chirish</button></div>' : '';
    return '<div class="card"><div class="card-header"><div class="card-title">' + ins.name + '</div><div class="card-badge">' + ins.subject + '</div></div><div class="card-desc">' + ins.bio + '</div><div class="card-info"><div class="card-info-item"><i class="fas fa-briefcase"></i> ' + ins.experience + '</div></div>' + actions + '</div>';
  }).join('');
}

function renderGrades(){
  const tbody = document.getElementById('gradesTable');
  const isAdmin = currentUser.role === 'Administrator';
  let list = state.grades;
  if(!isAdmin) list = list.filter(g => g.studentId === currentUser.id);
  if(list.length === 0){ tbody.innerHTML = emptyRow(5, 'Ma\'lumot yo\'q'); return; }

  tbody.innerHTML = list.map(g => 
    '<tr>' +
      '<td class="highlight">' + studentName(g.studentId) + '</td>' +
      '<td>' + courseName(g.courseId) + '</td>' +
      '<td><span class="badge ' + gradeBadgeClass(g.score) + '">' + g.score + '</span></td>' +
      '<td>' + g.date + '</td>' +
      '<td>' + (isAdmin ? '<button class="icon-btn del" onclick="deleteGrade(' + g.id + ')" title="O\'chirish"><i class="fas fa-trash"></i></button>' : '—') + '</td>' +
    '</tr>'
  ).join('');
}

function renderAttendance(){
  const tbody = document.getElementById('attendanceTable');
  const isAdmin = currentUser.role === 'Administrator';
  let list = state.attendance;
  if(!isAdmin) list = list.filter(a => a.studentId === currentUser.id);
  if(list.length === 0){ tbody.innerHTML = emptyRow(4, 'Ma\'lumot yo\'q'); return; }

  tbody.innerHTML = list.map(a => 
    '<tr>' +
      '<td class="highlight">' + studentName(a.studentId) + '</td>' +
      '<td>' + a.date + '</td>' +
      '<td><span class="badge ' + attendanceBadgeClass(a.status) + '">' + a.status + '</span></td>' +
      '<td>' + (a.note || '—') + '</td>' +
      '<td>' + (isAdmin ? '<button class="icon-btn del" onclick="deleteAttendance(' + a.id + ')" title="O\'chirish"><i class="fas fa-trash"></i></button>' : '') + '</td>' +
    '</tr>'
  ).join('');
}

/* ---- My Courses (Student) ---- */
function renderMyCourses(){
  const grid = document.getElementById('myCoursesGrid');
  if(!currentUser || currentUser.role !== 'Talaba') return;

  const myCourseIds = currentUser.courseIds || [];
  const myCourses = state.courses.filter(c => myCourseIds.includes(c.id));

  if(myCourses.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1;"><div class="empty-state"><i class="fas fa-book-open"></i><h3>Kurslar yo\'q</h3><p>Siz hali hech qanday kursga yozilmagansiz. Kurslar bo\'limidan yozilishingiz mumkin.</p><button class="btn-primary" onclick="switchSection(\'courses\', document.querySelectorAll(\'.nav-item\')[1])" style="margin-top:12px;"><i class="fas fa-book-open"></i> Kurslarni ko\'rish</button></div></div>';
    return;
  }

  grid.innerHTML = myCourses.map(course => 
    '<div class="card">' +
      '<div class="card-header">' +
        '<div class="card-title">' + course.name + '</div>' +
        '<div class="card-badge" style="background:var(--ok);">YOZILGAN</div>' +
      '</div>' +
      '<div class="card-desc">' + course.description + '</div>' +
      '<div class="card-info">' +
        '<div class="card-info-item"><i class="fas fa-user-tie"></i> ' + course.instructor + '</div>' +
        '<div class="card-info-item"><i class="fas fa-tag"></i> ' + fmtPrice(course.price) + ' so\'m</div>' +
        '<div class="card-info-item"><i class="fas fa-calendar"></i> ' + course.createdAt + '</div>' +
      '</div>' +
      '<div class="card-actions">' +
        '<button class="btn-sm btn-view" onclick="switchSection(\'lessons\', document.querySelectorAll(\'.nav-item\')[8])"><i class="fas fa-calendar-alt"></i> Jadval</button>' +
        '<button class="btn-sm btn-edit" onclick="switchSection(\'grades\', document.querySelectorAll(\'.nav-item\')[4])"><i class="fas fa-star"></i> Baholar</button>' +
      '</div>' +
    '</div>'
  ).join('');
}

/* ---- News ---- */
function renderNews(){
  const grid = document.getElementById('newsGrid');
  const isAdmin = currentUser.role === 'Administrator';

  if(state.news.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1;"><div class="empty-state"><i class="fas fa-newspaper"></i><h3>Yangiliklar yo\'q</h3><p>Hozircha yangiliklar qo\'shilmagan</p></div></div>';
    return;
  }

  const sortedNews = [...state.news].sort((a,b) => {
    const da = a.date.split('.').reverse().join('-');
    const db = b.date.split('.').reverse().join('-');
    return db.localeCompare(da);
  });

  grid.innerHTML = sortedNews.map(news => {
    const actions = isAdmin ? '<div class="news-actions"><button class="icon-btn edit" onclick="openNewsModal(' + JSON.stringify(news).replace(/'/g,'&apos;') + ')" title="Tahrirlash"><i class="fas fa-pen"></i></button><button class="icon-btn del" onclick="deleteNews(' + news.id + ')" title="O\'chirish"><i class="fas fa-trash"></i></button></div>' : '';
    return '<div class="news-card"><div class="news-date"><i class="fas fa-calendar"></i> ' + news.date + '</div><span class="news-category cat-' + news.category.toLowerCase() + '">' + news.category + '</span><h3>' + news.title + '</h3><p>' + news.content + '</p>' + actions + '</div>';
  }).join('');
}

/* ---- Schedule ---- */
let currentScheduleFilter = 'all';
function filterSchedule(day){
  currentScheduleFilter = day;
  document.querySelectorAll('.schedule-filter').forEach(b => {
    b.classList.toggle('active', b.dataset.day === day);
  });
  renderSchedule();
}
function renderSchedule(){
  const grid = document.getElementById('scheduleGrid');
  const isAdmin = currentUser.role === 'Administrator';
  const isStudent = currentUser.role === 'Talaba';

  let lessons = state.lessons;

  if(isStudent && currentUser.courseIds){
    lessons = lessons.filter(l => currentUser.courseIds.includes(l.courseId));
  }

  if(currentScheduleFilter !== 'all'){
    lessons = lessons.filter(l => l.day === currentScheduleFilter);
  }

  const dayOrder = ['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  lessons = [...lessons].sort((a,b) => {
    const da = dayOrder.indexOf(a.day);
    const db = dayOrder.indexOf(b.day);
    if(da !== db) return da - db;
    return a.time.localeCompare(b.time);
  });

  if(lessons.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1;"><div class="empty-state"><i class="fas fa-calendar-xmark"></i><h3>Darslar yo\'q</h3><p>Tanlangan kun uchun darslar topilmadi</p></div></div>';
    return;
  }

  grid.innerHTML = lessons.map(l => {
    const course = state.courses.find(c => c.id === l.courseId);
    const actions = isAdmin ? '<div class="card-actions" style="margin-top:10px;"><button class="btn-sm btn-edit" onclick="openLessonModal(' + JSON.stringify(l).replace(/'/g,'&apos;') + ')"><i class="fas fa-pen"></i> Tahrirlash</button><button class="btn-sm btn-danger" onclick="deleteLesson(' + l.id + ')"><i class="fas fa-trash"></i> O\'chirish</button></div>' : '';
    return '<div class="schedule-card"><div class="schedule-time"><i class="fas fa-clock"></i> ' + l.day + ' — ' + l.time + '</div><div class="schedule-course">' + (course ? course.name : 'Noma\'lum kurs') + '</div><div class="schedule-room"><i class="fas fa-door-open"></i> ' + (l.room || 'Xona belgilanmagan') + '</div><div class="schedule-instructor"><i class="fas fa-user-tie"></i> ' + (course ? course.instructor : 'Noma\'lum') + '</div>' + actions + '</div>';
  }).join('');
}

/* ================= INIT ================= */
window.addEventListener('load', () => {
  loadState();
});

window.addEventListener('resize', () => {
  if(window.innerWidth >= 768 && sidebarOpen){
    toggleSidebar();
  }
});