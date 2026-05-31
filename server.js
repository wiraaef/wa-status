const express = require("express"); // untuk buat server dan API
const puppeteer = require("puppeteer"); // untuk render HTML ke gambar (screenshot)
const path = require("path");
const fs = require("fs"); // untuk baca file (foto, icon)

const ogs = require("open-graph-scraper"); // untuk ambil metadata dari URL
// Fungsi untuk ambil metadata Open Graph dari URL (judul, deskripsi, gambar)
async function getOG(url) {
  try {
    const { result } = await ogs({
      url,
      fetchOptions: {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      },
    });

    return {
      title: result.ogTitle || "",
      description: result.ogDescription || "",
      image: result.ogImage?.[0]?.url || "",
    };
  } catch (err) {
    console.error(err);

    return null;
  }
}

const app = express(); // buat server
app.use(express.json()); // untuk parsing JSON di body request
app.use(express.static("public")); // server HTML

// global browser dan page untuk efisiensi (biar gak buka tutup terus)
let browser;
let page;

(async () => {
  browser = await puppeteer.launch({
    headless: true, // FIX #1: "new" sudah deprecated di Puppeteer v22+
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640 });

  console.log("Browser siap 🚀");
})();

// RANDOM BACKGROUND
const gradients = [
  "#25c3db",
  "#57c9ff",
  "#5696ff",
  "#7acba5",
  "#54c265",
  "#90a841",
  "#b6b327",
  "#f0b330",
  "#c1a03f",
  "#ff8a8c",
  "#a62c71",
  "#6e257e",
  "#8b6990",
  "#8294ca",
  "#c69fcc",
  "#4d6dd8",
  "#7e90a3",
  "#243640",
  "#ae8774",
  "#74676a",
];

// RANDOM TIME
const times = [
  "Baru saja",
  "1 menit yang lalu",
  "2 menit yang lalu",
  "3 menit yang lalu",
  "4 menit yang lalu",
  "5 menit yang lalu",
  "6 menit yang lalu",
  "7 menit yang lalu",
  "8 menit yang lalu",
  "9 menit yang lalu",
  "10 menit yang lalu",
  "15 menit yang lalu",
];

// ======================
// TEMPLATE HTML STATUS
// ======================
const htmlTemplate = (
  text,
  name,
  time,
  profile,
  bars,
  arrow,
  mata,
  views,
  facebook,
  instagram,
) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { margin:0; font-family:-apple-system,Segoe UI,Roboto; }

.status {
  width:360px;
  height:640px;
  position:relative;
  color:white;
  overflow:hidden;
}

/* progress */
.progress {
  position:absolute;
  top:8px;
  left:10px;
  right:10px;
  height:3px;
  border-radius:2px;
  display:flex;
  gap:3px;
}

.bar {
  flex:1;
  background: rgba(255,255,255,0.3);
  border-radius:2px;
  overflow:hidden;
}

.fill {
  height:100%;
  background:white;
  width:0%;
}

/* header */
.header {
  position: absolute;
  top: 20px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.arrow {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.menu-setting {
  position: absolute;
  top: 20px;
  right: 10px;
  font-size: 26px;
  color: white;
  cursor: pointer;
  z-index: 10;
}

.profile {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.name { 
  font-size:14px; 
  font-weight:bold; 
}
.time { 
  font-size:11px; 
  opacity:0.8; 
}

/* card untuk preview link (YouTube dan berita) */
.card {
  width: 80%;
  background: #ececec;
  border-radius: 8px;
  overflow: hidden;
  color: black;
}

.card-thumb {
  width: 100%;
  height: 130px;
  object-fit: cover;
  display: block;
}

.card-content {
  padding: 8px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 5px;
  color: #111;
  font-align: justify;
}

.card-desc {
  font-size: 11px;
  color: #555;
  line-height: 1.4;
  margin-bottom: 14px;
  text-align: justify;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-domain {
  font-size: 10px;
  color: #666;
}

.card-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}


/* versi Instagram yang lebih besar dan beda layout (gambar di samping, bukan di atas) */
.card-ig {
  width: 100%;
  max-width: 320px;
  background: #ececec;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: stretch;
  color: black;
}

.card-ig-thumb {
  width: 75px;
  height: 78px;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
}

.card-ig-content {
  padding: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.card-ig-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: #111;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.card-ig-domain {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
}


/* wrapper tengah */
.center-content {
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  width:80%;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:15px;
}

.text {
  color: black;
  font-size:20px;
  text-align:center;
  padding:2px 2px;
  border-radius:15px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(5px);
  max-width:100%;
  word-break: break-word;
}


/* bottom icon */
.mata {
  position: absolute;
  bottom: 20px;
  left: 15px; /* pindah ke kiri bawah */
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,0,0,0.75); /* oval hitam */
  padding: 10px 14px;
  border-radius: 999px; /* bikin oval */
  backdrop-filter: blur(5px);
}

.mata img {
  width: 15px;
  height: 17px;
  padding-right: 5px;
}

.views {
  font-size: 13px;
  color: white;
  font-weight: 500;
}
  
/* social icons kanan bawah */
.socials {
  position: absolute;
  bottom: 20px;
  right: 15px;
  display: flex;
  gap: 10px;
}

.social-icon {
  width: 40px;
  height: 40px;
  background: rgba(0,0,0,0.75);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.social-icon img {
  width: 25px;
  height: 25px;
  object-fit: contain;
}


</style>
</head>

<body>
<div class="status" id="status">
  <div class="progress">${bars}</div>

  <div class="header">
    <img class="arrow" src="${arrow}" alt="back">
    <img class="profile" src="${profile}">
    <div>
      <div class="name">${name}</div>
      <div class="time">${time}</div>
    </div>
  </div>

  <div class="menu-setting">⋮</div>

  <div class="center-content">
    ${text}
  </div>

  <div class="mata">
    <img src="${mata}" alt="mata">
    <span class="views">${views}</span>
  </div>
  <div class="socials">
  <div class="social-icon">
    <img src="${facebook}" alt="facebook">
  </div>

  <div class="social-icon">
    <img src="${instagram}" alt="instagram">
  </div>
</div>
</div>
</body>
</html>
`;

// ======================
// HELPER FUNCTIONS
// ======================

function formatText(text) {
  if (!text) return "Status kosong";
  if (text.length > 21) {
    return text.substring(0, 21) + "...";
  }
  return text;
}

// Fungsi untuk ambil 8 kata pertama dari teks (untuk preview di template)
function getShortUrl(url, mode) {
  if (!url) return "";

  let clean = url
    .replace("https://", "")
    .replace("http://", "")
    .replace("www.", "");

  // batas berbeda tiap mode
  let limit = 21;

  if (mode === "youtube") {
    limit = 23;
  }   
  else if (mode === "berita") {
    limit = 21;
  }   
  else if (mode === "ig") {
    limit = 25;
  }

  return clean.substring(0, limit) + (clean.length > limit ? "..." : "");
}

// Fungsi sanitasi nama file untuk mencegah path traversal
function sanitizeFilename(filename) {
  // Hanya izinkan huruf, angka, titik, strip, underscore — tanpa slash atau titik ganda
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "");
}

// Fungsi untuk deteksi mode (YouTube, Instagram, atau berita biasa) berdasarkan URL
function detectMode(url) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  }

  if (url.includes("instagram.com")) {
    return "ig";
  }

  return "berita";
}

// Baca asset statis sekali saja saat startup (lebih efisien)
const arrowPath = path.join(__dirname, "arrow.png");
const arrowBase64 = `data:image/png;base64,${fs.readFileSync(arrowPath).toString("base64")}`;

// Icon mata untuk jumlah views
const mataPath = path.join(__dirname, "mata.png");
const mataBase64 = `data:image/png;base64,${fs.readFileSync(mataPath).toString("base64")}`;

// Icon YouTube untuk template YouTube
const youtubePath = path.join(__dirname, "youtube.png");
const youtubeBase64 = `data:image/png;base64,${fs.readFileSync(youtubePath).toString("base64")}`;

// Icon berita untuk template berita
const newsPath = path.join(__dirname, "news.png");
const newsBase64 = `data:image/png;base64,${fs.readFileSync(newsPath).toString("base64")}`;

// ======================
// API GENERATE
// ======================
app.post("/generate", async (req, res) => {
  console.log(req.body);
  //Guard jika browser/page belum siap saat startup
  if (!page) {
    return res.status(503).send("Browser belum siap, coba lagi sebentar.");
  }

  try {
    // Tambah 'mode' dan 'url' dari request body
    const { type, template, url } = req.body;
    let content = "";

    if (type === "preset") {
      // Sanitasi nama file template sebelum dipakai
      const safeTemplate = sanitizeFilename(template || "");
      if (!safeTemplate) {
        return res.status(400).send("Nama template tidak valid.");
      }

      // Cek apakah file template ada di folder templates
      const filePath = path.join(__dirname, "templates", safeTemplate);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send("Template tidak ditemukan.");
      }

      // Baca file gambar dan konversi ke base64
      const image = fs.readFileSync(filePath);
      const base64 = `data:image/png;base64,${image.toString("base64")}`;
      content = `<img src="${base64}" style="max-width:100%; border-radius:15px;">`;
    } else {
      if (!url) {
        return res.status(400).send("URL wajib diisi");
      }
      
      // Deteksi mode berdasarkan URL (YouTube, Instagram, atau berita biasa)
      const mode = detectMode(url);
      let card = "";

      //
      const meta = await getOG(url);
      if (!meta) {
        return res.status(400).send("Gagal mengambil metadata URL");
      }

      // Ambil teks pendek untuk ditampilkan di bawah kartu (jika ada)
      const finalText = getShortUrl(url, mode);

      if (mode === "youtube" || mode === "berita" || mode === "ig") {
        if (!url) {
          return res.status(400).send("URL wajib diisi");
        }

        if (meta) {
          // TEMPLATE YOUTUBE
          if (mode === "youtube") {
            card = `
            <div class="card">
              <img class="card-thumb" src="${meta.image}">
              <div class="card-content">
                <div class="card-title">${meta.title}</div>
                <div class="card-desc">
                  ${(meta.description || "").substring(0, 38)}
                  ${(meta.description || "").length > 38 ? "..." : ""}
                </div>
                <div class="card-footer">
                  <div class="card-domain"> youtube.com </div>
                  <img class="card-icon" src="${youtubeBase64}">
                </div>
              </div>
            </div>
            `;
          }

          // TEMPLATE BERITA
          else if (mode === "berita") {
            card = `
            <div class="card"> 
              <img class="card-thumb" src="${meta.image}">
                <div class="card-content">
                  <div class="card-title">${meta.title}</div>
                  <div class="card-desc">
                    ${(meta.description || "").substring(0, 40)}
                    ${(meta.description || "").length > 40 ? "..." : ""}
                  </div>
                  <div class="card-footer">
                    <div class="card-domain">rri.co.id</div>
                    <img class="card-icon" src="${newsBase64}">
                  </div>
                </div>
            </div>
            `;
          }

          // TEMPLATE INSTAGRAM
          else if (mode === "ig") {
            card = `
            <div class="card-ig">
              <img class="card-ig-thumb" src="${meta.image}">
              <div class="card-ig-content">
                <div class="card-ig-title">${meta.title}</div>
                <div class="card-ig-domain">instagram.com</div>
              </div>
            </div>
            `;
          }
        }
      }

      content = `
      ${card}

      <div class="text">
        ${finalText}
      </div>
      `;
    }

    // Nama profil
    const name = "Status saya";

    // Foto profil
    const fotoPath = path.join(__dirname, "foto.jpg");
    const fotoImage = fs.readFileSync(fotoPath);
    const profile = `data:image/jpeg;base64,${fotoImage.toString("base64")}`;

    // Random waktu
    const time = times[Math.floor(Math.random() * times.length)];

    // Random background
    const bg = gradients[Math.floor(Math.random() * gradients.length)];

    // Random views 1–50 (komentar lama bilang 1-20 tapi kode aslinya 1-10)
    const views = Math.floor(Math.random() * 20) + 1; // 1 - 20

    // Icon sosial media - Facebook
    const facebookPath = path.join(__dirname, "facebook.png");
    const facebookBase64 = `data:image/png;base64,${fs.readFileSync(facebookPath).toString("base64")}`;

    // Icon sosial media - Instagram
    const instagramPath = path.join(__dirname, "instagram.png");
    const instagramBase64 = `data:image/png;base64,${fs.readFileSync(instagramPath).toString("base64")}`;

    // Random progress bar
    const progressWidth = Math.floor(Math.random() * 80) + 10; // 10% - 90%
    const totalBars = Math.floor(Math.random() * 5) + 2; // 2 - 6
    const activeIndex = Math.floor(Math.random() * totalBars);

    // Generate HTML untuk progress bar
    let bars = "";
    for (let i = 0; i < totalBars; i++) {
      if (i < activeIndex) {
        bars += `<div class="bar"><div class="fill" style="width:100%"></div></div>`;
      } else if (i === activeIndex) {
        bars += `<div class="bar"><div class="fill" style="width:${progressWidth}%"></div></div>`;
      } else {
        bars += `<div class="bar"><div class="fill" style="width:0%"></div></div>`;
      }
    }

    // Generate HTML dengan data dinamis
    const html = htmlTemplate(
      content,
      name,
      time,
      profile,
      bars,
      arrowBase64,
      mataBase64,
      views,
      facebookBase64,
      instagramBase64,
    );

    // Render HTML ke gambar
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    
    // Tunggu elemen center-content muncul (indikator bahwa HTML sudah termuat)
    await page.waitForSelector(".center-content");

    // Tambahan delay kecil untuk memastikan semua gaya dan gambar sudah ter-render dengan sempurna sebelum screenshot
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set background sesuai warna acak yang dipilih
    await page.evaluate((bg) => {
      document.getElementById("status").style.background = bg;
    }, bg);

    // Set viewport sesuai ukuran status WhatsApp
    await page.setViewport({ width: 360, height: 640 });

    // Ambil screenshot sebagai buffer
    const buffer = await page.screenshot({ type: "png" });

    // Kirim gambar sebagai response
    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("Error saat generate:", err);
    res.status(500).send("Gagal generate gambar: " + err.message);
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});
