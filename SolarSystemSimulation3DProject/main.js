import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ==========================================
// SHADER TANIMLARI
// ==========================================
const sunVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const sunFragmentShader = `
uniform sampler2D globeTexture;
uniform float time;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
    vec4 texColor = texture2D(globeTexture, vUv);
    float intensity = 1.05 - dot(vNormal, vec3(0.0, 0.0, 1.0));
    vec3 glow = vec3(1.0, 0.5, 0.0) * pow(intensity, 3.0);
    gl_FragColor = vec4(texColor.rgb * 1.2 + glow * (0.8 + 0.2*sin(time)), 1.0);
}
`;

const atmosphereVertexShader = `
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.05);
}
`;
const atmosphereFragmentShader = `
varying vec3 vNormal;
void main() {
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
    gl_FragColor = vec4(0.2, 0.5, 1.0, 1.0) * intensity;
}
`;

// ==========================================
// 1. EĞİTİM VERİTABANI (ANSİKLOPEDİ SEVİYESİ) 📚
// ==========================================
const translations = {
    tr: {
        headerTitle: '◆ KONTROL MERKEZİ',
        langBtnText: '🌐 Türkçe 🇹🇷',
        lockBtnUnlocked: 'Etkileşim: Açık 🔓',
        lockBtnLocked: 'Etkileşim: Kilitli 🔒',
        pauseBtnPause: 'Durdur ⏸️',
        pauseBtnResume: 'Devam Et ▶️',
        scaleBtnOff: 'Gerçekçi Ölçek: Kapalı 🔘',
        scaleBtnOn: 'Gerçekçi Ölçek: Açık 🔴',
        orbitBtnHide: 'Yörüngeler: Gizli 👁️‍🗨️',
        orbitBtnShow: 'Yörüngeler: Gösteriliyor 🔵',
        speedLabel: 'HIZ ÇARPANI',
        controlsTitle: '🎮 Kontroller',
        helpLeftClickAction: 'SOL TIK',
        helpLeftClickDesc: 'Gezegen bilgisini görüntüle',
        helpMiddleClickAction: 'ORTA TIK',
        helpMiddleClickDesc: 'Gezegene odaklan',
        compareBtn: '🌍 Dünya ile Kıyasla',
        tableType: 'Tür', tableDiameter: 'Çap', tableTemp: 'Sıcaklık',
        tableGravity: 'Yerçekimi', tableDay: 'Gün Uzunluğu', tableYear: 'Yıl Uzunluğu',
        tableAtmosphere: 'Atmosfer', tableLife: 'Yaşam'
    },
    en: {
        headerTitle: '◆ CONTROL CENTER',
        langBtnText: '🌐 English 🇬🇧',
        lockBtnUnlocked: 'Interaction: Open 🔓',
        lockBtnLocked: 'Interaction: Locked 🔒',
        pauseBtnPause: 'Pause ⏸️',
        pauseBtnResume: 'Resume ▶️',
        scaleBtnOff: 'Realistic Scale: Off 🔘',
        scaleBtnOn: 'Realistic Scale: On 🔴',
        orbitBtnHide: 'Orbits: Hidden 👁️‍🗨️',
        orbitBtnShow: 'Orbits: Visible 🔵',
        speedLabel: 'SPEED MULTIPLIER',
        controlsTitle: '🎮 Controls',
        helpLeftClickAction: 'LEFT CLICK',
        helpLeftClickDesc: 'View planet information',
        helpMiddleClickAction: 'MIDDLE CLICK',
        helpMiddleClickDesc: 'Focus on planet',
        compareBtn: '🌍 Compare with Earth',
        tableType: 'Type', tableDiameter: 'Diameter', tableTemp: 'Temperature',
        tableGravity: 'Gravity', tableDay: 'Day Length', tableYear: 'Year Length',
        tableAtmosphere: 'Atmosphere', tableLife: 'Life'
    }
};

const planetInfo = {
    "GUNES": {
        tr: { name: "Güneş", type: "Yıldız (G Tipi Anakol)", temp: "5.500°C (Yüzey) / 15M°C (Çekirdek)", diameter: "1.39 Milyon km (109 x Dünya)", day: "27 Dünya Günü (Ekvator)", year: "230 Milyon Yıl (Galaktik Tur)", gravity: "274 m/s²", atmosphere: "%74 Hidrojen, %24 Helyum", life: "İmkansız", funFact: "Güneş o kadar büyüktür ki, Güneş Sistemi'ndeki toplam kütlenin %99.86'sını tek başına oluşturur.", desc: "Sistemimizin enerji kaynağıdır. Çekirdeğindeki nükleer füzyon sayesinde her saniye 600 milyon ton hidrojeni helyuma dönüştürür." },
        en: { name: "Sun", type: "Star (G-type Main Sequence)", temp: "5,500°C (Surface) / 15M°C (Core)", diameter: "1.39 Million km (109 x Earth)", day: "27 Earth Days (Equator)", year: "230 Million Years (Galactic Orbit)", gravity: "274 m/s²", atmosphere: "74% Hydrogen, 24% Helium", life: "Impossible", funFact: "The Sun is so massive that it accounts for 99.86% of the total mass of the Solar System.", desc: "It is the energy source of our system. Nuclear fusion in its core converts 600 million tons of hydrogen into helium every second." }
    },
    "Merkür": {
        tr: { name: "Merkür", type: "Karasal Gezegen", temp: "430°C (Gündüz) / -180°C (Gece)", diameter: "4.880 km", day: "59 Dünya Günü", year: "88 Dünya Günü", gravity: "3.7 m/s²", atmosphere: "Yok (Çok ince Ekzosfer)", life: "Olası Değil", funFact: "Merkür'de bir yıl, bir günden daha kısadır.", desc: "Güneş'e en yakın ve sistemin en küçük gezegenidir. Atmosferi olmadığı için gece ve gündüz sıcaklık farkı inanılmaz boyuttadır." },
        en: { name: "Mercury", type: "Terrestrial Planet", temp: "430°C (Day) / -180°C (Night)", diameter: "4,880 km", day: "59 Earth Days", year: "88 Earth Days", gravity: "3.7 m/s²", atmosphere: "None (Extremely thin exosphere)", life: "Unlikely", funFact: "A year on Mercury is shorter than one solar day.", desc: "It is the closest planet to the Sun and the smallest in the system. Lacking an atmosphere, its temperature fluctuates wildly." }
    },
    "Venüs": {
        tr: { name: "Venüs", type: "Karasal Gezegen", temp: "464°C (Kurşunu eritebilir)", diameter: "12.104 km", day: "243 Dünya Günü (Ters Yön)", year: "225 Dünya Günü", gravity: "8.87 m/s²", atmosphere: "%96 Karbondioksit (Çok Yoğun)", life: "Zor", funFact: "Venüs diğer gezegenlerin aksine doğudan batıya (ters) döner.", desc: "Yoğun karbondioksit atmosferi, ısıyı hapseden korkunç bir sera etkisi yaratır. Güneş'e daha yakın olan Merkür'den bile daha sıcaktır." },
        en: { name: "Venus", type: "Terrestrial Planet", temp: "464°C (Can melt lead)", diameter: "12,104 km", day: "243 Earth Days (Retrograde)", year: "225 Earth Days", gravity: "8.87 m/s²", atmosphere: "96% Carbon Dioxide (Very Dense)", life: "Unlikely", funFact: "Venus rotates in the opposite direction to most planets - the Sun rises in the west.", desc: "Its thick CO2 atmosphere creates a runaway greenhouse effect, making it hotter than Mercury despite being farther from the Sun." }
    },
    "Dünya": {
        tr: { name: "Dünya", type: "Karasal Gezegen", temp: "15°C (Ortalama)", diameter: "12.742 km", day: "23 Saat 56 Dakika", year: "365.25 Gün", gravity: "9.80 m/s²", atmosphere: "%78 Azot, %21 Oksijen", life: "VAR (Bilinen tek yer)", funFact: "Dünya tam bir küre değil, kutuplardan basık bir Geoid şeklindedir.", desc: "Evrende yaşam barındırdığı bilinen tek gök cismidir. Yüzeyinin %70'i okyanuslarla kaplıdır." },
        en: { name: "Earth", type: "Terrestrial Planet", temp: "15°C (Average)", diameter: "12,742 km", day: "23h 56m", year: "365.25 Days", gravity: "9.80 m/s²", atmosphere: "78% Nitrogen, 21% Oxygen", life: "YES (Only known place)", funFact: "Earth is not a perfect sphere - it is an oblate spheroid, flattened at the poles.", desc: "The only known celestial body to harbor life. 70% of its surface is covered by oceans." }
    },
    "Mars": {
        tr: { name: "Mars", type: "Karasal Gezegen", temp: "-65°C (Ortalama)", diameter: "6.779 km", day: "24 Saat 37 Dakika", year: "687 Dünya Günü", gravity: "3.71 m/s²", atmosphere: "İnce Karbondioksit", life: "Geçmişte olabilir", funFact: "Olympus Mons (21km) Güneş sisteminin en yüksek dağıdır.", desc: "Yüzeyindeki demir oksit nedeniyle Kızıl Gezegen olarak bilinir." },
        en: { name: "Mars", type: "Terrestrial Planet", temp: "-65°C (Average)", diameter: "6,779 km", day: "24h 37m", year: "687 Earth Days", gravity: "3.71 m/s²", atmosphere: "Thin Carbon Dioxide", life: "Possibly in the past", funFact: "Olympus Mons (21km) is the tallest mountain in the Solar System.", desc: "Known as the Red Planet due to iron oxide on its surface." }
    },
    "Jüpiter": {
        tr: { name: "Jüpiter", type: "Gaz Devi", temp: "-110°C (Bulut Tepesi)", diameter: "139.820 km (11 x Dünya)", day: "9 Saat 56 Dakika", year: "11.86 Yıl", gravity: "24.79 m/s²", atmosphere: "Hidrojen, Helyum", life: "İmkansız", funFact: "Jüpiter diğer tüm gezegenlerin toplamından 2.5 kat daha ağırdır.", desc: "Gezegenlerin kralı. Büyük Kırmızı Leke 300 yıldır devam eden devasa bir fırtınadır." },
        en: { name: "Jupiter", type: "Gas Giant", temp: "-110°C (Cloud Top)", diameter: "139,820 km (11 x Earth)", day: "9h 56m", year: "11.86 Years", gravity: "24.79 m/s²", atmosphere: "Hydrogen, Helium", life: "Impossible", funFact: "Jupiter is 2.5 times more massive than all other planets combined.", desc: "King of planets. The Great Red Spot is a storm larger than Earth that has raged for over 300 years." }
    },
    "Satürn": {
        tr: { name: "Satürn", type: "Gaz Devi", temp: "-140°C", diameter: "116.460 km", day: "10 Saat 34 Dakika", year: "29.45 Yıl", gravity: "10.44 m/s²", atmosphere: "Hidrojen, Helyum", life: "İmkansız", funFact: "Satürn'ün yoğunluğu sudan düşüktür, yüzerdi.", desc: "Muazzam halka sistemiyle tanınır. Halkalar buz, toz ve kaya parçalarından oluşur." },
        en: { name: "Saturn", type: "Gas Giant", temp: "-140°C", diameter: "116,460 km", day: "10h 34m", year: "29.45 Years", gravity: "10.44 m/s²", atmosphere: "Hydrogen, Helium", life: "Impossible", funFact: "Saturn is less dense than water - it would float in a large enough ocean.", desc: "Famous for its magnificent ring system made of billions of ice, dust and rock particles." }
    },
    "Uranüs": {
        tr: { name: "Uranüs", type: "Buz Devi", temp: "-195°C", diameter: "50.724 km", day: "17 Saat 14 Dakika", year: "84 Yıl", gravity: "8.69 m/s²", atmosphere: "Hidrojen, Helyum, Metan", life: "İmkansız", funFact: "Uranüs yörüngesinde yuvarlanarak ilerler. Ekseni 98 derece yatıktır.", desc: "Sistemin en soğuk gezegenidir. Metan gazı nedeniyle soluk turkuaz renktedir." },
        en: { name: "Uranus", type: "Ice Giant", temp: "-195°C", diameter: "50,724 km", day: "17h 14m", year: "84 Years", gravity: "8.69 m/s²", atmosphere: "Hydrogen, Helium, Methane", life: "Impossible", funFact: "Uranus rolls on its side - its axis is tilted 98 degrees.", desc: "The coldest planet in the system. Methane gas gives it a pale turquoise color." }
    },
    "Neptün": {
        tr: { name: "Neptün", type: "Buz Devi", temp: "-200°C", diameter: "49.244 km", day: "16 Saat 6 Dakika", year: "165 Yıl", gravity: "11.15 m/s²", atmosphere: "Hidrojen, Helyum, Metan", life: "İmkansız", funFact: "Neptün'de rüzgar hızları saatte 2100 km'ye ulaşabilir.", desc: "Güneş'e en uzak ana gezegendir. 1846'da keşfedilmiştir." },
        en: { name: "Neptune", type: "Ice Giant", temp: "-200°C", diameter: "49,244 km", day: "16h 6m", year: "165 Years", gravity: "11.15 m/s²", atmosphere: "Hydrogen, Helium, Methane", life: "Impossible", funFact: "Wind speeds on Neptune can reach 2,100 km/h - faster than the speed of sound.", desc: "The farthest main planet from the Sun. Discovered in 1846." }
    },
    "Ceres": {
        tr: { name: "Ceres", type: "Cüce Gezegen", temp: "-105°C", diameter: "946 km", day: "9 Saat", year: "4.6 Yıl", gravity: "0.27 m/s²", atmosphere: "Yok", life: "Bilinmiyor", funFact: "Asteroit kuşağındaki toplam kütlenin üçte birini Ceres oluşturur.", desc: "Asteroit Kuşağı'ndaki en büyük cisimdir. Yüzeyinin altında donmuş su okyanusu olabilir." },
        en: { name: "Ceres", type: "Dwarf Planet", temp: "-105°C", diameter: "946 km", day: "9 Hours", year: "4.6 Years", gravity: "0.27 m/s²", atmosphere: "None", life: "Unknown", funFact: "Ceres makes up one third of the total mass of the asteroid belt.", desc: "The largest object in the asteroid belt. It may have a subsurface ocean of frozen water." }
    },
    "Plüton": {
        tr: { name: "Plüton", type: "Cüce Gezegen", temp: "-229°C", diameter: "2.376 km", day: "6.4 Gün", year: "248 Yıl", gravity: "0.62 m/s²", atmosphere: "İnce Azot, Metan", life: "İmkansız", funFact: "Plüton'un yüzey alanı Rusya'dan küçüktür.", desc: "2006'ya kadar 9. gezegendi. Kuiper Kuşağı'nın en bilinen üyesidir." },
        en: { name: "Pluto", type: "Dwarf Planet", temp: "-229°C", diameter: "2,376 km", day: "6.4 Days", year: "248 Years", gravity: "0.62 m/s²", atmosphere: "Thin Nitrogen, Methane", life: "Impossible", funFact: "Pluto's surface area is smaller than Russia.", desc: "Was the 9th planet until 2006. The most well-known member of the Kuiper Belt." }
    },
    "Eris": {
        tr: { name: "Eris", type: "Cüce Gezegen", temp: "-243°C", diameter: "2.326 km", day: "25.9 Saat", year: "557 Yıl", gravity: "0.82 m/s²", atmosphere: "Donmuş Metan", life: "İmkansız", funFact: "Eris o kadar uzaktır ki, Güneş sadece parlak bir yıldız gibi görünür.", desc: "Plüton ile aynı boyutta ama daha ağırdır. Keşfi Plüton'un cüce gezegen sınıfına düşürülmesine neden olmuştur." },
        en: { name: "Eris", type: "Dwarf Planet", temp: "-243°C", diameter: "2,326 km", day: "25.9 Hours", year: "557 Years", gravity: "0.82 m/s²", atmosphere: "Frozen Methane", life: "Impossible", funFact: "Eris is so far away that the Sun appears as just a bright star.", desc: "Same size as Pluto but more massive. Its discovery led to Pluto being reclassified as a dwarf planet." }
    },
    "Halley": {
        tr: { name: "Halley", type: "Kuyruklu Yıldız", temp: "Güneş'e yaklaştıkça artar", diameter: "11 km (Çekirdek)", day: "2.2 Gün", year: "76 Yıl", gravity: "Çok Düşük", atmosphere: "Gaz ve Toz", life: "İmkansız", funFact: "Mark Twain Halley'in geçtiği yıl doğmuş ve bir sonraki geçişinde hayatını kaybetmiştir.", desc: "Tarihin en ünlü kuyruklu yıldızıdır. 76 yıllık periyoduyla döner." },
        en: { name: "Halley", type: "Comet", temp: "Increases near Sun", diameter: "11 km (Core)", day: "2.2 Days", year: "76 Years", gravity: "Very Low", atmosphere: "Gas and Dust", life: "Impossible", funFact: "Mark Twain was born during Halley's passage and died during its next return.", desc: "The most famous comet in history. It returns on a 76-year orbit." }
    }
};

// ==========================================
// 2. AYARLAR
// ==========================================
let isPaused = false;
let timeScale = 1;
let absoluteTime = 0;
const planets = [];
let asteroidMesh;
let focusedPlanet = null;
let comparisonMesh = null;
let isTrueScale = false;
let language = 'tr';
let showUI = true;
let isLocked = false;
let showOrbits = false;

const pauseBtn = document.getElementById('pauseBtn');
const scaleBtn = document.getElementById('scaleBtn');
const orbitBtn = document.getElementById('orbitBtn');
const lockBtn = document.getElementById('lockBtn');
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const uiContainer = document.getElementById('ui-container');
const speedSlider = document.getElementById('speedSlider');
const speedValueEl = document.getElementById('speedValue');
const opacitySlider = document.getElementById('opacitySlider');
const opacityValueEl = document.getElementById('opacityValue');
const infoPanel = document.getElementById('info-panel');
const closeBtn = document.getElementById('close-btn');
const planetNameEl = document.getElementById('planet-name');
const planetDetailsEl = document.getElementById('planet-details');

// ==========================================
// 3. SAHNE VE KAMERA
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 100, 180);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.maxDistance = 5000;
controls.minDistance = 1.5;
controls.screenSpacePanning = true;

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('');
const loadTextureSafe = (path) => textureLoader.load(path);

// ==========================================
// 4. EFEKTLER
// ==========================================
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.15; bloomPass.strength = 1.2; bloomPass.radius = 0.5;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// ==========================================
// 5. AYDINLATMA
// ==========================================
// ==========================================
// 5. AYDINLATMA & ARKAPLAN
// ==========================================
scene.add(new THREE.Mesh(new THREE.SphereGeometry(10000, 64, 64), new THREE.MeshBasicMaterial({ map: loadTextureSafe('./textures/stars.jpg'), side: THREE.BackSide, color: 0x888888 }))); // Arkaplanı biraz kıstık

// Starfield Overlay (Derinlik için)
function createStarfieldOverlay() {
    const geo = new THREE.BufferGeometry();
    const count = 3000;
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 2000;
    for (let i = 0; i < count; i++) sizes[i] = Math.random();

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const stars = new THREE.Points(geo, mat);
    stars.userData = { type: 'starfield' };
    scene.add(stars);
}
createStarfieldOverlay();

const sunLight = new THREE.PointLight(0xffddaa, 1.5, 0, 0); // Intensity 2.5 -> 1.5 (Göz almaması için kısıldı)
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.bias = -0.0001;
scene.add(sunLight);

scene.add(new THREE.AmbientLight(0x404040, 0.4));
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.2));

// ==========================================
// 6. YARDIMCI FONKSİYONLAR
// ==========================================
function createOrbit(radius) {
    const points = []; for (let i = 0; i <= 360; i++) points.push(new THREE.Vector3(Math.cos(i / 360 * Math.PI * 2) * radius, 0, Math.sin(i / 360 * Math.PI * 2) * radius));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const orbit = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.12 }));
    scene.add(orbit); return orbit;
}

function createDwarfOrbit(radius, tiltX = 0, tiltZ = 0) {
    const points = []; for (let i = 0; i <= 360; i++) points.push(new THREE.Vector3(Math.cos(i / 360 * Math.PI * 2) * radius, 0, Math.sin(i / 360 * Math.PI * 2) * radius));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const orbit = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.1, dashSize: 1, gapSize: 2 }));
    orbit.rotation.x = tiltX; orbit.rotation.z = tiltZ; scene.add(orbit); return orbit;
}

function createLabel(text) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d');
    ctx.font = 'Bold 60px "Segoe UI", sans-serif'; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.shadowColor = "black"; ctx.shadowBlur = 8;
    ctx.fillText(text.toUpperCase(), 256, 80);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
    s.scale.set(10, 2.5, 1); return s;
}

function updateLabelText(sprite, text) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d');
    ctx.font = 'Bold 60px "Segoe UI", sans-serif'; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.shadowColor = "black"; ctx.shadowBlur = 8;
    ctx.fillText(text.toUpperCase(), 256, 80);
    sprite.material.map.dispose();
    sprite.material.map = new THREE.CanvasTexture(c);
}

function createStarTexture() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const ctx = c.getContext('2d');
    ctx.fillStyle = 'white'; ctx.shadowBlur = 10; ctx.shadowColor = 'white';
    ctx.beginPath(); ctx.ellipse(32, 32, 25, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(32, 32, 2, 25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(32, 32, 6, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(c);
}

function createParticleTexture() {
    const c = document.createElement('canvas'); c.width = 32; c.height = 32; const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'white'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c);
}

// ==========================================
// 7. ASTEROİT & KUYRUKLU YILDIZ
// ==========================================
function createAsteroidBelt() {
    const count = 4000; const geo = new THREE.DodecahedronGeometry(0.2, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, flatShading: true });
    asteroidMesh = new THREE.InstancedMesh(geo, mat, count); const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2; const r = 36 + Math.random() * 10; const y = (Math.random() - 0.5) * 0.4; // Yükseklik azaltıldı (2 -> 0.4)
        dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        const s = 0.5 + Math.random() * 0.8; dummy.scale.set(s, s, s); dummy.updateMatrix();
        asteroidMesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(asteroidMesh);
}

// Kuyruklu yıldız kaldırıldı (User isteği)

// ==========================================
// 8. GEZEGEN OLUŞTURUCULAR
// ==========================================
function createPlanetSystem(config) {
    const { name, size, texture, distance, speed, ring, color } = config;
    const mat = new THREE.MeshStandardMaterial({
        map: loadTextureSafe(`./textures/${texture}`),
        color: 0xffffff,
        roughness: 0.4, metalness: 0.1,
        emissive: 0x222222, emissiveMap: loadTextureSafe(`./textures/${texture}`), emissiveIntensity: 0.3
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 64), mat);
    mesh.userData = { name: name, artisticSize: size, artisticDist: distance, trueSize: size * 0.3, trueDist: distance * 8 };

    if (ring) {
        const rGeo = new THREE.RingGeometry(ring.inner, ring.outer, 128);
        const pos = rGeo.attributes.position; const v3 = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) { v3.fromBufferAttribute(pos, i); rGeo.attributes.uv.setXY(i, v3.length() < (ring.inner + ring.outer) / 2 ? 0 : 1, 1); }
        const rMat = new THREE.MeshStandardMaterial({ map: loadTextureSafe(`./textures/${ring.tex}`), side: THREE.DoubleSide, transparent: true, opacity: 0.9, color: 0xffffff });
        const rMesh = new THREE.Mesh(rGeo, rMat); rMesh.rotation.x = -Math.PI / 2; mesh.add(rMesh);
        mesh.userData.ring = rMesh;
    }
    const label = createLabel(name); label.position.set(0, size + 2, 0); mesh.add(label); mesh.userData.label = label;

    if (name === "Dünya") {
        const clouds = new THREE.Mesh(new THREE.SphereGeometry(size + 0.02, 64, 64), new THREE.MeshStandardMaterial({ map: loadTextureSafe('./textures/clouds.jpg'), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
        mesh.add(clouds); mesh.userData.clouds = clouds;

        // ATMOSFER GLOW
        const atmoGeo = new THREE.SphereGeometry(size + 0.15, 64, 64);
        const atmoMat = new THREE.ShaderMaterial({
            vertexShader: atmosphereVertexShader, fragmentShader: atmosphereFragmentShader,
            blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true
        });
        const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
        mesh.add(atmosphere);

        const moon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshStandardMaterial({ map: loadTextureSafe('./textures/moon.jpg'), roughness: 0.6 }));
        moon.userData = { name: "Ay", isMoon: true, parentPlanet: mesh, moonAngle: 0, moonDist: 4 };
        scene.add(moon); planets.push({ mesh: moon, type: 'moon' });
    }
    const orbit = createOrbit(distance);
    planets.push({ mesh: mesh, distance: distance, speed: speed, name: name, type: 'planet', orbit: orbit });
    scene.add(mesh);
}

function createDwarfPlanet(config) {
    const { name, size, texture, color, distance, speed, tiltX, tiltZ } = config;
    let mat;
    if (texture) {
        mat = new THREE.MeshStandardMaterial({ map: loadTextureSafe(`./textures/${texture}`), roughness: 0.8, color: 0xffffff });
    } else {
        mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 });
    }
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 32), mat);
    mesh.userData = { name: name, artisticSize: size, artisticDist: distance, trueSize: size * 0.3, trueDist: distance * 8 };

    const label = createLabel(name); label.scale.set(6, 1.5, 1); label.position.set(0, size + 1, 0); mesh.add(label); mesh.userData.label = label;
    const orbit = createDwarfOrbit(distance, tiltX, tiltZ);
    planets.push({ mesh: mesh, distance: distance, speed: speed, name: name, type: 'dwarf', orbitRef: orbit });
    scene.add(mesh);
}

// ==========================================
// 9. NESNELERİ YARAT
// ==========================================
const sunMat = new THREE.ShaderMaterial({
    uniforms: {
        globeTexture: { value: loadTextureSafe('./textures/sun.jpg') },
        time: { value: 0 }
    },
    vertexShader: sunVertexShader,
    fragmentShader: sunFragmentShader
});
const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 64), sunMat);
sun.userData = { name: "GUNES", artisticSize: 5 }; scene.add(sun);
const sunLabel = createLabel("Güneş"); sunLabel.position.set(0, 7.5, 0); sun.add(sunLabel); sun.userData.label = sunLabel;

createPlanetSystem({ name: "Merkür", size: 0.38, texture: "mercury.jpg", distance: 10, speed: 0.04, color: 0xaaaaaa });
createPlanetSystem({ name: "Venüs", size: 0.95, texture: "venus.jpg", distance: 16, speed: 0.025, color: 0xeecb8b });
createPlanetSystem({ name: "Dünya", size: 1.0, texture: "earth.jpg", distance: 24, speed: 0.018, color: 0x2233ff });
createPlanetSystem({ name: "Mars", size: 0.53, texture: "mars.jpg", distance: 32, speed: 0.012, color: 0xc1440e });
createAsteroidBelt();
createDwarfPlanet({ name: "Ceres", size: 0.6, texture: "ceres.jpg", color: 0xaaaaaa, distance: 40, speed: 0.01, tiltX: 0.1, tiltZ: 0 }); // Boyut artırıldı 0.25 -> 0.6
createPlanetSystem({ name: "Jüpiter", size: 4.0, texture: "jupiter.jpg", distance: 55, speed: 0.006, color: 0xc99039 });
createPlanetSystem({ name: "Satürn", size: 3.5, texture: "saturn.jpg", distance: 80, speed: 0.004, color: 0xe3e0c0, ring: { inner: 4.2, outer: 7.5, tex: "saturn_ring.png" } });
createPlanetSystem({ name: "Uranüs", size: 1.8, texture: "uranus.jpg", distance: 100, speed: 0.003, color: 0x4fd0e7 });
createPlanetSystem({ name: "Neptün", size: 1.7, texture: "neptune.jpg", distance: 120, speed: 0.002, color: 0x4b70dd });
createDwarfPlanet({ name: "Plüton", size: 0.6, texture: "pluto.jpg", color: 0xccaacc, distance: 145, speed: 0.0015, tiltX: 0.3, tiltZ: 0.1 }); // Boyut artırıldı 0.3 -> 0.6
createDwarfPlanet({ name: "Eris", size: 0.6, texture: "eris.jpg", color: 0xffffff, distance: 170, speed: 0.001, tiltX: -0.2, tiltZ: 0.2 }); // Boyut artırıldı 0.3 -> 0.6

// ==========================================
// 10. ÖZELLİKLER (HOLOGRAM & ÖLÇEK)
// ==========================================
function toggleComparison() {
    if (!focusedPlanet) return;
    if (comparisonMesh) { scene.remove(comparisonMesh); comparisonMesh = null; return; }

    const geo = new THREE.SphereGeometry(1.0, 32, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.3 });
    comparisonMesh = new THREE.Mesh(geo, mat);
    scene.add(comparisonMesh);
}

function toggleTrueScale() {
    isTrueScale = !isTrueScale;
    scaleBtn.classList.toggle('active');

    planets.forEach(p => {
        const targetSize = isTrueScale ? p.mesh.userData.trueSize : p.mesh.userData.artisticSize;
        const targetDist = isTrueScale ? p.mesh.userData.trueDist : p.mesh.userData.artisticDist;
        p.mesh.scale.setScalar(targetSize / p.mesh.userData.artisticSize);
        p.distance = targetDist;
        if (p.orbit) p.orbit.scale.setScalar(isTrueScale ? 8 : 1);
        if (p.orbitRef) p.orbitRef.scale.setScalar(isTrueScale ? 8 : 1);
        if (isTrueScale) { if (p.mesh.userData.label) p.mesh.userData.label.visible = false; }
        else { if (p.mesh.userData.label) p.mesh.userData.label.visible = true; }
    });
    if (isTrueScale) { sun.scale.setScalar(0.5); asteroidMesh.visible = false; }
    else { sun.scale.setScalar(1); asteroidMesh.visible = true; }

    if (comparisonMesh) { scene.remove(comparisonMesh); comparisonMesh = null; }
}

// ==========================================
// 11. ETKİLEŞİM (YENİ ODAKLANMA SİSTEMİ)
// ==========================================
if (pauseBtn) {
    pauseBtn.onclick = function (e) {
        e.stopPropagation();
        isPaused = !isPaused;
        updateUI();
    };
}
if (scaleBtn) {
    scaleBtn.onclick = function (e) {
        e.stopPropagation();
        toggleTrueScale();
        updateUI();
    };
}
if (orbitBtn) {
    orbitBtn.onclick = function (e) {
        e.stopPropagation();
        showOrbits = !showOrbits;
        updateUI();
    };
}
if (lockBtn) {
    lockBtn.onclick = function (e) {
        e.stopPropagation();
        isLocked = !isLocked;
        updateUI();
    };
}
if (menuToggleBtn && uiContainer) {
    menuToggleBtn.onclick = function (e) {
        e.stopPropagation();
        const isActive = uiContainer.classList.toggle('active');
        menuToggleBtn.classList.toggle('active');
        menuToggleBtn.innerHTML = isActive ? '✕' : '⚙';
    };
}
if (speedSlider) {
    speedSlider.oninput = function () {
        timeScale = parseFloat(this.value);
        if (speedValueEl) speedValueEl.innerText = timeScale + "x";
    };
}
if (opacitySlider) {
    const savedOpacity = localStorage.getItem('panelOpacity');
    if (savedOpacity) {
        opacitySlider.value = savedOpacity;
        if (opacityValueEl) opacityValueEl.innerText = savedOpacity + "%";
        document.documentElement.style.setProperty('--panel-opacity', (parseFloat(savedOpacity) / 100).toString());
    } else {
        document.documentElement.style.setProperty('--panel-opacity', '0.85');
    }
    opacitySlider.oninput = function () {
        const val = this.value;
        if (opacityValueEl) opacityValueEl.innerText = val + "%";
        document.documentElement.style.setProperty('--panel-opacity', (parseFloat(val) / 100).toString());
        localStorage.setItem('panelOpacity', val);
    };
}
if (closeBtn) {
    closeBtn.onclick = function () {
        infoPanel.classList.remove('active');
        if (comparisonMesh) { scene.remove(comparisonMesh); comparisonMesh = null; }
    };
}

function updateUI() {
    const lang = language || 'tr';
    const t = translations[lang] || translations.tr;

    if (pauseBtn) pauseBtn.innerHTML = isPaused ? t.pauseBtnResume : t.pauseBtnPause;
    if (scaleBtn) scaleBtn.innerHTML = isTrueScale ? t.scaleBtnOn : t.scaleBtnOff;
    if (orbitBtn) orbitBtn.innerHTML = showOrbits ? t.orbitBtnShow : t.orbitBtnHide;
    if (lockBtn) lockBtn.innerHTML = isLocked ? t.lockBtnLocked : t.lockBtnUnlocked;
    if (langBtn) langBtn.innerText = t.langBtnText;
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function showInfo(name) {
    if (name && planetInfo[name]) {
        const lang = language || 'tr';
        const t = translations[lang] || translations.tr;
        const data = planetInfo[name][lang] || planetInfo[name]['tr'] || planetInfo[name]['en'];
        planetNameEl.innerText = data.name || name;
        planetDetailsEl.innerHTML = `
            <table class="info-table">
                <tr><td class="label">${t.tableType}</td><td class="value">${data.type}</td></tr>
                <tr><td class="label">${t.tableDiameter}</td><td class="value">${data.diameter}</td></tr>
                <tr><td class="label">${t.tableTemp}</td><td class="value">${data.temp}</td></tr>
                <tr><td class="label">${t.tableGravity}</td><td class="value">${data.gravity || '—'}</td></tr>
                <tr><td class="label">${t.tableDay}</td><td class="value">${data.day}</td></tr>
                <tr><td class="label">${t.tableYear}</td><td class="value">${data.year}</td></tr>
                <tr><td class="label">${t.tableAtmosphere}</td><td class="value">${data.atmosphere || '—'}</td></tr>
                <tr><td class="label">${t.tableLife}</td><td class="value" style="color:#ffaa00">${data.life}</td></tr>
            </table>
            <button id="compareBtn" style="margin-top:10px; width:100%; background:linear-gradient(90deg, #1CB5E0, #000851); border:none; padding:8px; color:white; border-radius:5px; cursor:pointer;">${t.compareBtn}</button>
            <hr style="border-color:#555; margin:10px 0;">
            <p style="color:#ddd; font-size:13px;">${data.desc}</p>
            <div style="margin-top:10px; background:rgba(255,255,255,0.1); padding:8px; border-radius:5px; font-size:12px; font-style:italic; color:#aaddff;">💡 ${data.funFact}</div>
        `;
        infoPanel.classList.add('active');
        document.getElementById('compareBtn').onclick = toggleComparison;
    }
}

window.addEventListener('pointerdown', (event) => {
    if (event.target.closest('#info-panel') || event.target.closest('#ui-container')) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length === 0) {
        if (event.button === 0) { focusedPlanet = null; infoPanel.classList.remove('active'); if (comparisonMesh) { scene.remove(comparisonMesh); comparisonMesh = null; } }
        return;
    }

    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.type === 'Sprite' || obj.type === 'Line' || obj.type === 'LineLoop' || obj.type === 'Points') continue;

        if (obj.userData.name || (obj.parent && obj.parent.userData.name)) {
            let name = obj.userData.name || obj.parent.userData.name;
            if (event.button === 0) showInfo(name);
            if (event.button === 1) { // ORTA TUŞ
                focusedPlanet = obj;
                const targetPos = new THREE.Vector3();
                focusedPlanet.getWorldPosition(targetPos);

                // KAMERAYI IŞINLA (YAKLAŞ)
                // Şu anki scale'i al (TrueScale veya Normal)
                const currentScale = focusedPlanet.scale.x;
                const realRadius = (focusedPlanet.userData.artisticSize || 1) * currentScale;

                // Gezegenden 5 yarıçap kadar uzakta, hafif yukarıda dur
                const dist = realRadius * 5 + 2;
                const offset = new THREE.Vector3(dist, dist * 0.5, dist);

                camera.position.copy(targetPos).add(offset);
                controls.target.copy(targetPos); // Merkezi gezegene al

                showInfo(name);
            }
            break;
        }
    }
});

// ==========================================
// 12. ANİMASYON DÖNGÜSÜ
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    if (!isPaused) {
        const speed = timeScale;
        absoluteTime += 0.01 * speed;

        // Shader Time Update
        if (sun.material.uniforms) sun.material.uniforms.time.value += 0.02;

        sun.rotation.y += 0.002 * speed;
        if (asteroidMesh) asteroidMesh.rotation.y += 0.002 * speed;

        // Comet animasyon kodu kaldırıldı

        planets.forEach(p => {
            if (p.type === 'planet') {
                const x = Math.cos(absoluteTime * p.speed * 10) * p.distance;
                const z = Math.sin(absoluteTime * p.speed * 10) * p.distance;
                p.mesh.position.set(x, 0, z);
                p.mesh.rotation.y += 0.02 * speed;
                if (p.mesh.userData.clouds) p.mesh.userData.clouds.rotation.y += 0.025 * speed;
            }
            if (p.type === 'dwarf') {
                const angle = absoluteTime * p.speed * 10;
                const rx = p.orbitRef.rotation.x; const rz = p.orbitRef.rotation.z;
                let x = Math.cos(angle) * p.distance; let z = Math.sin(angle) * p.distance;
                let y1 = -z * Math.sin(rx); let z1 = z * Math.cos(rx);
                let x2 = x * Math.cos(rz) - (-z * Math.sin(rx)) * Math.sin(rz);
                let y2 = x * Math.sin(rz) + (-z * Math.sin(rx)) * Math.cos(rz);
                p.mesh.position.set(x2, y2, z1); p.mesh.rotation.y += 0.02 * speed;
            }
            if (p.type === 'moon') {
                const parent = p.mesh.userData.parentPlanet;
                const dist = p.mesh.userData.moonDist;
                p.mesh.userData.moonAngle += 0.05 * speed;
                p.mesh.position.set(parent.position.x + Math.cos(p.mesh.userData.moonAngle) * dist, 0, parent.position.z + Math.sin(p.mesh.userData.moonAngle) * dist);
                p.mesh.rotation.y += 0.01 * speed;
            }
        });
    }

    if (focusedPlanet && comparisonMesh) {
        const targetPos = new THREE.Vector3();
        focusedPlanet.getWorldPosition(targetPos);
        const currentScale = focusedPlanet.scale.x;
        const planetRadius = (focusedPlanet.userData.artisticSize || 1) * currentScale;
        const earthRadius = 1.0 * (isTrueScale ? 0.3 : 1.0);
        const offset = planetRadius + earthRadius + 2.0;
        comparisonMesh.position.copy(targetPos).x += offset;
        comparisonMesh.scale.setScalar(isTrueScale ? 0.3 : 1.0);
    }

    if (focusedPlanet) {
        const targetPos = new THREE.Vector3();
        focusedPlanet.getWorldPosition(targetPos);
        controls.target.copy(targetPos);
    }

    controls.update();
    composer.render();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// LIVELY WALLPAPER ENTEGRASYONU
// ==========================================
window.livelyPropertyListener = function (name, val) {
    switch (name) {
        case "isLocked": isLocked = val; break;
        case "isPaused": isPaused = val; break;
        case "timeScale": timeScale = val; break;
        case "isTrueScale": isTrueScale = val; break;
        case "showOrbits": showOrbits = val; break;
        case "showUI": showUI = val; break;
        case "panelOpacity": document.documentElement.style.setProperty('--panel-opacity', (val / 100).toString()); break;
        case "language": language = val === 0 ? "en" : (val === 1 ? "tr" : val); updateLabels(); break;
    }
};

// ==========================================
// DİL DEĞİŞİKLİĞİ & ETİKET GÜNCELLEME
// ==========================================
const langBtn = document.getElementById('langBtn');
if (langBtn) {
    langBtn.onclick = function (e) {
        e.stopPropagation();
        language = language === 'en' ? 'tr' : 'en';
        updateLabels();
    };
}

function updateLabels() {
    const lang = language || 'tr';
    const t = translations[lang] || translations.tr;

    // Güneş etiketini güncelle
    if (sun && sun.userData.label) {
        const sunName = planetInfo["GUNES"] ? planetInfo["GUNES"][lang].name : "Güneş";
        updateLabelText(sun.userData.label, sunName);
    }

    // Gezegen etiketlerini güncelle
    planets.forEach(p => {
        if (p.mesh && p.mesh.userData.label) {
            const key = p.mesh.userData.name;
            if (planetInfo[key]) {
                updateLabelText(p.mesh.userData.label, planetInfo[key][lang].name);
            }
        }
    });

    // UI metinlerini güncelle
    updateUI();

    // Odaklanılan gezegen bilgisini güncelle
    if (focusedPlanet && infoPanel && infoPanel.classList.contains('active')) {
        let name = focusedPlanet.userData.name || (focusedPlanet.parent && focusedPlanet.parent.userData.name);
        if (name) showInfo(name);
    }
}

animate();