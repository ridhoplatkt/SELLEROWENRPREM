// ============================================
// LYZEEBOYY V14 - SCRIPT.JS
// Penjelasan file ini ngapain aja:
// 1. Particle background biar dark luxury hidup
// 2. Hamburger menu buka tutup
// 3. Fix keyboard HP biar input gak mendelep
// 4. Flow form email -> link spam -> success
// 5. API AM Premium (send & verif) terintegrasi
// ============================================

// --- 1. PARTICLE CANVAS (biar background ada bintik gerak) ---
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
function rs(){ canvas.width = innerWidth; canvas.height = innerHeight; }
rs();
addEventListener('resize', rs);

// bikin 26 partikel random
let pts = [...Array(26)].map(()=>({
  x: Math.random()*innerWidth,
  y: Math.random()*innerHeight,
  r: Math.random()*1.4 + 0.3, // ukuran
  vx: (Math.random()-.5)*0.18, // kecepatan x
  vy: (Math.random()-.5)*0.18  // kecepatan y
}));
(function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  pts.forEach(p=>{
    p.x += p.vx; p.y += p.vy;
    if(p.x<0||p.x>canvas.width) p.vx*=-1; // mantul
    if(p.y<0||p.y>canvas.height) p.vy*=-1;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,6.28);
    ctx.fillStyle='#ff0f3522';
    ctx.fill();
  });
  requestAnimationFrame(loop);
})();

// --- 2. HAMBURGER MENU ---
function toggleMenu(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
  document.getElementById('ham').classList.toggle('active');
}

// --- 3. FIX KEYBOARD HP BIAR GAK MENDELEP ---
const spacer = document.getElementById('spacer');
function handleKB(){
  const vv = window.visualViewport;
  if(!vv) return;
  const kh = window.innerHeight - vv.height;
  if(kh > 80){
    spacer.style.height = kh + 24 + 'px';
    setTimeout(()=>{
      document.activeElement?.scrollIntoView({behavior:'smooth', block:'center'});
    }, 80);
  } else {
    spacer.style.height = '180px';
  }
}
if(window.visualViewport){
  visualViewport.addEventListener('resize', handleKB);
  visualViewport.addEventListener('scroll', handleKB);
}
document.querySelectorAll('input').forEach(inp=>{
  inp.addEventListener('focus', ()=>{
    setTimeout(()=>{ inp.scrollIntoView({behavior:'smooth', block:'center'}); }, 300);
  });
});

// ============================================
// 4. API AM PREMIUM - INTEGRASI
// ============================================
const API_BASE = 'https://restapidhan.vercel.app/api/am';
const API_KEY  = 'freeapikeydhan26';

let currentEmail = null;    // email yang sedang diproses
let currentCode  = null;    // code order dari server

// Fungsi untuk menampilkan pesan di hint (step 1 & 2)
function setHint(id, msg, isSuccess = false) {
  const el = document.getElementById(id);
  if(!el) return;
  el.innerHTML = msg;
  if(isSuccess) {
    el.style.borderColor = '#ffcf4a';
    el.style.background = '#ffcf4a12';
  } else {
    el.style.borderColor = '#ff0f3566';
    el.style.background = '#ff0f3512';
  }
}

// ===== FUNGSI SEND =====
async function sendEmailToAPI(email) {
  try {
    const url = `${API_BASE}?action=send&apikey=${API_KEY}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.status) {
      return { success: true, message: data.message };
    } else {
      return { success: false, error: data.error || data.message || 'Gagal mengirim' };
    }
  } catch(err) {
    return { success: false, error: 'Network error: ' + err.message };
  }
}

// ===== FUNGSI VERIF + ACTIVATE =====
async function verifyAndActivate(email, url) {
  try {
    const fullUrl = `${API_BASE}?action=verif&apikey=${API_KEY}&email=${encodeURIComponent(email)}&url=${encodeURIComponent(url)}`;
    const res = await fetch(fullUrl);
    const data = await res.json();
    if(data.status) {
      return { success: true, codeorder: data.codeorder || '-' };
    } else {
      return { success: false, error: data.error || data.message || 'Verifikasi gagal' };
    }
  } catch(err) {
    return { success: false, error: 'Network error: ' + err.message };
  }
}

// ============================================
// 5. FLOW FORM AKTIVASI (dengan API)
// ============================================

// OVERRIDE fungsi go dari HTML
window.go = async function(n) {
  if(n === 2) {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    if(!email || !email.includes('@')) {
      alert('Masukkan email yang valid.');
      return;
    }

    // Disable tombol sementara
    const btn = document.querySelector('#s1 .btn');
    btn.disabled = true;
    btn.textContent = 'MENGIRIM...';

    // Panggil API
    const result = await sendEmailToAPI(email);

    // Enable tombol kembali
    btn.disabled = false;
    btn.textContent = 'KIRIM MAGIC LINK';

    if(result.success) {
      currentEmail = email;
      // Tampilkan pesan sukses di hint step1 (tapi kita akan pindah step)
      // Tapi kita tampilkan di eShow di step2 nanti
      document.getElementById('eShow').innerHTML = '✅ Magic link terkirim ke <b>' + email + '</b>';
      document.getElementById('d2').classList.add('active');
      // Pindah ke step 2
      document.getElementById('s1').style.display = 'none';
      document.getElementById('s2').style.display = 'block';
      window.scrollTo({top: document.getElementById('dash').offsetTop - 80, behavior:'smooth'});
    } else {
      alert('❌ ' + result.error);
    }
  } else {
    // fallback kalau nggak sengaja
    document.getElementById('s1').style.display = 'none';
    document.getElementById('s2').style.display = 'block';
  }
};

// OVERRIDE fungsi goFinal dari HTML
window.goFinal = async function() {
  const urlInput = document.getElementById('url');
  const url = urlInput.value.trim();
  if(!url || !url.startsWith('http')) {
    alert('Masukkan URL yang valid (harus diawali http/https)');
    return;
  }
  if(!currentEmail) {
    alert('Email belum dikirim. Kembali ke step 1.');
    return;
  }

  const btn = document.getElementById('btnVerif');
  btn.disabled = true;
  btn.textContent = 'MEMVERIFIKASI...';

  const result = await verifyAndActivate(currentEmail, url);

  btn.disabled = false;
  btn.textContent = 'VERIFIKASI & AKTIVASI';

  if(result.success) {
    currentCode = result.codeorder;
    document.getElementById('d3').classList.add('active');
    document.getElementById('s2').style.display = 'none';
    document.getElementById('s4').style.display = 'block';
    document.getElementById('finalEmail').innerText = currentEmail;
    // Tambahkan code order ke hint di step4
    const hintFinal = document.querySelector('#s4 .hint');
    if(hintFinal) {
      hintFinal.innerHTML = 'Akun <b style="color:#fff">' + currentEmail + '</b> berhasil diaktifkan<br>Code Order: <b style="color:#ffcf4a">' + currentCode + '</b><br>by LYZEEBOYY - dark edition';
    }
    window.scrollTo({top: document.getElementById('dash').offsetTop - 80, behavior:'smooth'});
  } else {
    alert('❌ ' + result.error);
  }
};

// buka aplikasi AM (tetap)
window.openAM = function(){
  location.href = 'alightmotion://';
  setTimeout(()=>{
    location.href = 'https://play.google.com/store/apps/details?id=com.alightcreative.motion';
  }, 700);
};