const express = require("express"); // untuk buat server dan API
const puppeteer = require("puppeteer"); // untuk render HTML ke gambar (screenshot)
const path = require("path"); 
const fs = require("fs"); // untuk baca file (foto, icon)

const app = express(); // buat server
app.use(express.json()); // untuk parsing JSON di body request
app.use(express.static("public")); // server HTML

//global browser dan page untuk efisiensi (biar gak buka tutup terus)
let browser;
let page;

(async () => {
  browser = await puppeteer.launch({
    headless: "new",
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
const htmlTemplate = (text, name, time, profile, bars, arrow, mata, views) => `
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
  gap: 8px; /* jarak panah dan foto */
}

.arrow {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.menu-setting {
 position: absolute; /* penting! */
  top: 20px;          /* sesuaikan dengan tinggi header */
  right: 10px;        /* pojok kanan */
  font-size: 30px;
  color: white;
  cursor: pointer;
  z-index: 10;        /* agar selalu di atas */
}

.profile {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid white;
  object-fit: cover;
}

.name { font-size:14px; font-weight:bold; }
.time { font-size:11px; opacity:0.8; }

/* text bubble */
.text-wrapper {
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  width:80%;
  display:flex;
  justify-content:center;
}
  
.text-wrapper img {
  max-width: 100%;
  border-radius: 15px;
}

.text {
  color: black;
  font-size:20px;
  text-align:center;
  padding:2px 3px;
  border-radius:15px;
  background: rgba(255, 255, 255, 0.7); /* opacity 50% */
  backdrop-filter: blur(5px);
  max-width:100%;
  word-break: break-word;
}
/* 🔥 bottom icon */
.mata {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px; /* jarak icon dan angka */
}

.mata img {
  width: 20px;
  height: 20px;
}

.views {
  font-size: 14px;
  color: white;
}

</style>
</head>

<body>
<div class="status" id="status">
  <div class="progress"> ${bars}</div>

  <div class="header">
    <!-- panah kiri -->
  <img class="arrow" src="${arrow}" alt="back">

    <img class="profile" src="${profile}">
    <div>
      <div class="name">${name}</div>
      <div class="time">${time}</div>
    </div>

  </div>

  <!-- menu kanan -->
  <div class="menu-setting">⋮</div> 

  <div class="text-wrapper">
    ${text}
  </div>

  <!-- 🔥 ICON BAWAH -->
<div class="mata">
  <img src="${mata}" alt="mata">
  <span class="views">${views}</span>
</div>

</div>
</body>
</html>
`;

// ======================
// API GENERATE
// ======================

function formatText(text) {
  if (!text) return "Status kosong";

  if (text.length > 21) {
    return text.substring(0, 21) + "...";
  }

  return text;
}

const arrowPath = path.join(__dirname, "arrow.png"); // path arrow
const arrowImage = fs.readFileSync(arrowPath); // baca file
const arrowBase64 = `data:image/png;base64,${arrowImage.toString("base64")}`; // convert ke base64

app.post("/generate", async (req, res) => {
  try {
    const { type, text, template } = req.body;

    // jika request untuk preset template
    let content = "";

    if (type === "preset") {
      const filePath = path.join(__dirname, "templates", template);

      if (!fs.existsSync(filePath)) {
        return res.status(404).send("Template tidak ditemukan");
      }

      const image = fs.readFileSync(filePath);
      const base64 = `data:image/png;base64,${image.toString("base64")}`;

      content = `<img src="${base64}" style="max-width:100%; border-radius:15px;">`;
    } else {

      content = `<div class="text">${finalText}</div>`;
    }

    const name = "Status saya";

    //foto profile
    const image = fs.readFileSync(path.join(__dirname, "foto.jpg"));
    const profile = `data:image/jpeg;base64,${image.toString("base64")}`;

    //random waktu
    const time = times[Math.floor(Math.random() * times.length)];

    //random background
    const bg = gradients[Math.floor(Math.random() * gradients.length)];

    //random views
    const views = Math.floor(Math.random() * 10) + 1; // 1 - 500

    //icon mata (footer)
    const mataPath = path.join(__dirname, "mata.png"); // path mata
    const mataImage = fs.readFileSync(mataPath); // baca file
    const mataBase64 = `data:image/png;base64,${mataImage.toString("base64")}`; // convert ke base64

    //random progress bar header
    const progressWidth = Math.floor(Math.random() * 80) + 10; // 10% - 90%

    // jumlah status random (misalnya 2 - 6)
    const totalBars = Math.floor(Math.random() * 5) + 2;

    // pilih bar aktif
    const activeIndex = Math.floor(Math.random() * totalBars);

    // generate HTML bars
    let bars = "";

    for (let i = 0; i < totalBars; i++) {
      if (i < activeIndex) {
        // sudah lewat (full)
        bars += `<div class="bar"><div class="fill" style="width:100%"></div></div>`;
      } else if (i === activeIndex) {
        // sedang aktif
        bars += `<div class="bar"><div class="fill" style="width:${progressWidth}%"></div></div>`;
      } else {
        // belum
        bars += `<div class="bar"><div class="fill" style="width:0%"></div></div>`;
      }
    }
    //text formatting
    const finalText = formatText(text);
    const html = htmlTemplate(
      content,
      name,
      time,
      profile,
      bars,
      arrowBase64,
      mataBase64,
      views,
    );

    //render HTML ke gambar
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    await page.evaluate((bg) => {
      document.getElementById("status").style.background = bg;
    }, bg);

    await page.setViewport({ width: 360, height: 640 });

    const buffer = await page.screenshot({ type: "png" });

    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.toString());
  }
});

// ======================
app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});
