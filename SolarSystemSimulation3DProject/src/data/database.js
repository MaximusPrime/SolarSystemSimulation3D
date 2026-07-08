// ==========================================
// SHADER TANIMLARI
// ==========================================
export const sunVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const sunFragmentShader = `
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

export const atmosphereVertexShader = `
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.05);
}
`;

export const atmosphereFragmentShader = `
varying vec3 vNormal;
void main() {
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
    gl_FragColor = vec4(0.2, 0.5, 1.0, 1.0) * intensity;
}
`;

export const starVertexShader = `
uniform float time;
attribute float size;
varying float vOpacity;
void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    vOpacity = 0.92 + 0.08 * sin(time * 0.8 + position.x * 0.005);
}
`;

export const starFragmentShader = `
uniform vec3 color;
varying float vOpacity;
void main() {
    if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
    gl_FragColor = vec4(color, vOpacity);
}
`;

// ==========================================
// 1. DİL ÇEVİRİ DEPOSU (UI & METİNLER) 🌍
// ==========================================
export const translations = {
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
        opacityLabel: 'ŞEFFAFLIK',
        zoomLabel: 'YAKINLAŞTIRMA',
        controlsTitle: '🎮 Kontroller',
        warningLocked: '⚠️ ETKİLEŞİM KİLİTLİ: Döndürmek ve Odaklanmak için kilidi açın 🔒',
        warningUnlocked: '🎮 ETKİLEŞİM AÇIK: Aşağıdaki kontrolleri kullanabilirsiniz 🔓',
        helpLeftClickAction: 'SOL TIK',
        helpLeftClickDesc: 'Gezegen bilgisini görüntüle',
        helpMiddleClickAction: 'ORTA TIK',
        helpMiddleClickDesc: 'Gezegene odaklan',
        helpRightClickAction: 'SOL TIK SÜRÜKLE',
        helpRightClickDesc: 'Evreni döndür (Kilit açıkken)',
        compareBtn: '🌍 Dünya ile Kıyasla',
        tableType: 'Tür',
        tableDiameter: 'Çap',
        tableTemp: 'Sıcaklık',
        tableGravity: 'Yerçekimi',
        tableEscapeVelocity: 'Kaçış Hızı',
        tableDay: 'Gün Uzunluğu',
        tableYear: 'Yıl Uzunluğu',
        tableAtmosphere: 'Atmosfer',
        tableDiscoveryDate: 'Keşif',
        tableMoons: 'Uydu Sayısı',
        tableLife: 'Yaşam'
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
        opacityLabel: 'OPACITY',
        zoomLabel: 'ZOOM',
        controlsTitle: '🎮 Controls',
        warningLocked: '⚠️ INTERACTION LOCKED: Unlock to rotate and focus 🔒',
        warningUnlocked: '🎮 INTERACTION OPEN: You can use the controls below 🔓',
        helpLeftClickAction: 'LEFT CLICK',
        helpLeftClickDesc: 'View planet information',
        helpMiddleClickAction: 'MIDDLE CLICK',
        helpMiddleClickDesc: 'Focus on planet',
        helpRightClickAction: 'LEFT CLICK DRAG',
        helpRightClickDesc: 'Rotate universe (When unlocked)',
        compareBtn: '🌍 Compare with Earth',
        tableType: 'Type',
        tableDiameter: 'Diameter',
        tableTemp: 'Temperature',
        tableGravity: 'Gravity',
        tableEscapeVelocity: 'Escape Velocity',
        tableDay: 'Day Length',
        tableYear: 'Year Length',
        tableAtmosphere: 'Atmosphere',
        tableDiscoveryDate: 'Discovery',
        tableMoons: 'Moons',
        tableLife: 'Life'
    }
};

// ==========================================
// 2. EĞİTİM VERİTABANI (ANSİKLOPEDİ SEVİYESİ) 📚
// ==========================================
export const planetInfo = {
    "GUNES": {
        tr: {
            name: "Güneş",
            type: "Yıldız (G Tipi Anakol)",
            temp: "5.500°C (Yüzey) / 15M°C (Çekirdek)",
            diameter: "1.39 Milyon km (109 x Dünya)",
            day: "27 Dünya Günü (Ekvator)",
            year: "230 Milyon Yıl (Galaktik Tur)",
            gravity: "274 m/s²",
            atmosphere: "%74 Hidrojen, %24 Helyum",
            escapeVelocity: "617.7 km/s",
            discoveryDate: "Tarih öncesi",
            moons: 0,
            life: "İmkansız",
            funFact: "Güneş o kadar büyüktür ki, Güneş Sistemi'ndeki toplam kütlenin %99.86'sını tek başına oluşturur.",
            desc: "Sistemimizin enerji kaynağıdır. Çekirdeğindeki nükleer füzyon sayesinde her saniye 600 milyon ton hidrojeni helyuma dönüştürür."
        },
        en: {
            name: "Sun",
            type: "Star (G-type Main Sequence)",
            temp: "5,500°C (Surface) / 15M°C (Core)",
            diameter: "1.39 Million km (109 x Earth)",
            day: "27 Earth Days (Equator)",
            year: "230 Million Years (Galactic Orbit)",
            gravity: "274 m/s²",
            atmosphere: "74% Hydrogen, 24% Helium",
            escapeVelocity: "617.7 km/s",
            discoveryDate: "Prehistoric",
            moons: 0,
            life: "Impossible",
            funFact: "The Sun is so massive that it accounts for 99.86% of the total mass of the Solar System.",
            desc: "It is the energy source of our system. Nuclear fusion in its core converts 600 million tons of hydrogen into helium every second."
        }
    },
    "Merkür": {
        tr: {
            name: "Merkür",
            type: "Karasal Gezegen",
            temp: "430°C (Gündüz) / -180°C (Gece)",
            diameter: "4.880 km",
            day: "59 Dünya Günü",
            year: "88 Dünya Günü",
            gravity: "3.7 m/s²",
            atmosphere: "Yok (Çok ince Ekzosfer)",
            escapeVelocity: "4.3 km/s",
            discoveryDate: "Tarih öncesi",
            moons: 0,
            life: "Olası Değil",
            funFact: "Merkür'de bir yıl, bir günden daha kısadır.",
            desc: "Güneş'e en yakın ve sistemin en küçük gezegenidir. Atmosferi olmadığı için gece ve gündüz sıcaklık farkı inanılmaz boyuttadır."
        },
        en: {
            name: "Mercury",
            type: "Terrestrial Planet",
            temp: "430°C (Day) / -180°C (Night)",
            diameter: "4,880 km",
            day: "59 Earth Days",
            year: "88 Earth Days",
            gravity: "3.7 m/s²",
            atmosphere: "None (Extremely thin exosphere)",
            escapeVelocity: "4.3 km/s",
            discoveryDate: "Prehistoric",
            moons: 0,
            life: "Unlikely",
            funFact: "A year on Mercury is shorter than one solar day.",
            desc: "It is the closest planet to the Sun and the smallest in the system. Lacking an atmosphere, its temperature fluctuates wildly."
        }
    },
    "Venüs": {
        tr: {
            name: "Venüs",
            type: "Karasal Gezegen",
            temp: "464°C (Kurşunu eritebilir)",
            diameter: "12.104 km",
            day: "243 Dünya Günü (Ters Yön)",
            year: "225 Dünya Günü",
            gravity: "8.87 m/s²",
            atmosphere: "%96 Karbondioksit (Çok Yoğun)",
            escapeVelocity: "10.4 km/s",
            discoveryDate: "Tarih öncesi",
            moons: 0,
            life: "Zor (Üst atmosferde mikrop ihtimali)",
            funFact: "Venüs, diğer gezegenlerin aksine doğudan batıya (ters) döner.",
            desc: "Gökyüzündeki en parlak gezegen olduğu için 'Çoban Yıldızı' da denir. Korkunç sera etkisi yaratır."
        },
        en: {
            name: "Venus",
            type: "Terrestrial Planet",
            temp: "464°C (Melts lead)",
            diameter: "12,104 km",
            day: "243 Earth Days (Retrograde)",
            year: "225 Earth Days",
            gravity: "8.87 m/s²",
            atmosphere: "96% Carbon Dioxide (Dense)",
            escapeVelocity: "10.4 km/s",
            discoveryDate: "Prehistoric",
            moons: 0,
            life: "Difficult (Possible microbes in clouds)",
            funFact: "Unlike most planets, Venus rotates backwards from east to west.",
            desc: "Known as the 'Morning Star'. Its dense atmosphere creates a runaway greenhouse effect making it extremely hot."
        }
    },
    "Dünya": {
        tr: {
            name: "Dünya",
            type: "Karasal Gezegen",
            temp: "15°C (Ortalama)",
            diameter: "12.742 km",
            day: "23 Saat 56 Dakika",
            year: "365.25 Gün",
            gravity: "9.80 m/s² (1G)",
            atmosphere: "%78 Azot, %21 Oksijen",
            escapeVelocity: "11.2 km/s",
            discoveryDate: "—",
            moons: 1,
            life: "VAR (Bilinen tek yer)",
            funFact: "Dünya tam bir küre değil, kutuplardan basık bir 'Geoid' şeklindedir.",
            desc: "Evrende yaşam barındırdığı bilinen tek gök cismidir. Yüzeyinin %70'i okyanuslarla kaplıdır."
        },
        en: {
            name: "Earth",
            type: "Terrestrial Planet",
            temp: "15°C (Average)",
            diameter: "12,742 km",
            day: "23 Hours 56 Mins",
            year: "365.25 Days",
            gravity: "9.80 m/s² (1G)",
            atmosphere: "78% Nitrogen, 21% Oxygen",
            escapeVelocity: "11.2 km/s",
            discoveryDate: "—",
            moons: 1,
            life: "YES (Only known location)",
            funFact: "Earth is an oblate spheroid, slightly flattened at the poles.",
            desc: "The only known celestial body to host life. About 70% of its surface is covered by liquid water oceans."
        }
    },
    "Ay": {
        tr: {
            name: "Ay",
            type: "Doğal Uydu",
            temp: "-23°C (Ortalama)",
            diameter: "3.474 km",
            day: "27.3 Gün",
            year: "27.3 Gün (Dünya Çevresinde)",
            gravity: "1.62 m/s²",
            atmosphere: "Yok",
            escapeVelocity: "2.4 km/s",
            discoveryDate: "Tarih öncesi",
            moons: 0,
            life: "Yok",
            funFact: "Ay her yıl Dünya'dan yaklaşık 3.8 cm uzaklaşmaktadır.",
            desc: "Dünya'nın tek doğal uydusudur. Okyanuslardaki gelgit olaylarının ana sebebidir."
        },
        en: {
            name: "Moon",
            type: "Natural Satellite",
            temp: "-23°C (Average)",
            diameter: "3,474 km",
            day: "27.3 Days",
            year: "27.3 Days (Orbiting Earth)",
            gravity: "1.62 m/s²",
            atmosphere: "None",
            escapeVelocity: "2.4 km/s",
            discoveryDate: "Prehistoric",
            moons: 0,
            life: "None",
            funFact: "The Moon drifts away from Earth by roughly 3.8 cm every year.",
            desc: "Earth's only natural satellite. It is the primary cause of ocean tides on Earth."
        }
    },
    "Mars": {
        tr: {
            name: "Mars",
            type: "Karasal Gezegen",
            temp: "-65°C (Ortalama)",
            diameter: "6.779 km",
            day: "24 Saat 37 Dakika",
            year: "687 Dünya Günü",
            gravity: "3.71 m/s²",
            atmosphere: "İnce Karbondioksit",
            escapeVelocity: "5.0 km/s",
            discoveryDate: "Tarih öncesi",
            moons: 2,
            life: "Geçmişte olabilir / Araştırılıyor",
            funFact: "Güneş sisteminin en yüksek dağı olan Olympus Mons (21km) buradadır.",
            desc: "Yüzeyindeki demir oksit nedeniyle 'Kızıl Gezegen' olarak bilinir. Kolonizasyonun bir numaralı hedefidir."
        },
        en: {
            name: "Mars",
            type: "Terrestrial Planet",
            temp: "-65°C (Average)",
            diameter: "6,779 km",
            day: "24 Hours 37 Mins",
            year: "687 Earth Days",
            gravity: "3.71 m/s²",
            atmosphere: "Thin Carbon Dioxide",
            escapeVelocity: "5.0 km/s",
            discoveryDate: "Prehistoric",
            moons: 2,
            life: "Possible in past / Under study",
            funFact: "Hosts Olympus Mons (21 km), the tallest volcano in the Solar System.",
            desc: "Known as the 'Red Planet' due to iron oxide. It is the prime target for future human exploration."
        }
    },
    "Jüpiter": {
        tr: {
            name: "Jüpiter",
            type: "Gaz Devi",
            temp: "-110°C (Bulut Tepesi)",
            diameter: "139.820 km (11 x Dünya)",
            day: "9 Saat 56 Dakika",
            year: "11.86 Yıl",
            gravity: "24.79 m/s²",
            atmosphere: "Hidrojen, Helyum",
            escapeVelocity: "59.5 km/s",
            discoveryDate: "Tarih öncesi",
            moons: 95,
            life: "İmkansız (Uydusu Europa'da olabilir)",
            funFact: "Jüpiter diğer tüm gezegenlerin toplam kütlesinden 2.5 kat daha ağırdır.",
            desc: "Gezegenlerin kralı. 'Büyük Kırmızı Leke' Dünya'dan daha büyük devasa bir fırtınadır."
        },
        en: {
            name: "Jupiter",
            type: "Gas Giant",
            temp: "-110°C (Cloud top)",
            diameter: "139,820 km (11 x Earth)",
            day: "9 Hours 56 Mins",
            year: "11.86 Years",
            gravity: "24.79 m/s²",
            atmosphere: "Hydrogen, Helium",
            escapeVelocity: "59.5 km/s",
            discoveryDate: "Prehistoric",
            moons: 95,
            life: "Impossible (Possible on satellite Europa)",
            funFact: "Jupiter is more than 2.5 times as massive as all other planets combined.",
            desc: "The planetary giant. Its Great Red Spot is a giant storm larger than Earth."
        }
    },
    "Satürn": {
        tr: {
            name: "Satürn",
            type: "Gaz Devi",
            temp: "-140°C",
            diameter: "116.460 km",
            day: "10 Saat 34 Dakika",
            year: "29.45 Yıl",
            gravity: "10.44 m/s²",
            atmosphere: "Hidrojen, Helyum",
            escapeVelocity: "35.5 km/s",
            discoveryDate: "Tarih öncesi",
            moons: 146,
            life: "İmkansız (Uydusu Enceladus'ta olabilir)",
            funFact: "Satürn'ün yoğunluğu sudan düşüktür. Yeterince büyük okyanusta yüzerdi.",
            desc: "Muazzam halka sistemiyle tanınır. Halkalar milyarlarca buz, toz ve kaya parçasından oluşur."
        },
        en: {
            name: "Saturn",
            type: "Gas Giant",
            temp: "-140°C",
            diameter: "116,460 km",
            day: "10 Hours 34 Mins",
            year: "29.45 Years",
            gravity: "10.44 m/s²",
            atmosphere: "Hydrogen, Helium",
            escapeVelocity: "35.5 km/s",
            discoveryDate: "Prehistoric",
            moons: 146,
            life: "Impossible (Possible on satellite Enceladus)",
            funFact: "Saturn is less dense than water; it would float in a giant ocean.",
            desc: "Famous for its magnificent ring system composed of ice and rock particles."
        }
    },
    "Uranüs": {
        tr: {
            name: "Uranüs",
            type: "Buz Devi",
            temp: "-195°C",
            diameter: "50.724 km",
            day: "17 Saat 14 Dakika",
            year: "84 Yıl",
            gravity: "8.69 m/s²",
            atmosphere: "Hidrojen, Helyum, Metan",
            escapeVelocity: "21.3 km/s",
            discoveryDate: "1781 (William Herschel)",
            moons: 28,
            life: "İmkansız",
            funFact: "Uranüs, yörüngesinde 'yuvarlanarak' ilerler. Ekseni 98 derece yatıktır.",
            desc: "Sistemin en soğuk gezegenidir. Metan nedeniyle turkuaz renge sahiptir."
        },
        en: {
            name: "Uranus",
            type: "Ice Giant",
            temp: "-195°C",
            diameter: "50,724 km",
            day: "17 Hours 14 Mins",
            year: "84 Years",
            gravity: "8.69 m/s²",
            atmosphere: "Hydrogen, Helium, Methane",
            escapeVelocity: "21.3 km/s",
            discoveryDate: "1781 (William Herschel)",
            moons: 28,
            life: "Impossible",
            funFact: "Uranus rotates on its side with an extreme axial tilt of 98 degrees.",
            desc: "The coldest planet in the Solar System. Methane gives it a cyan hue."
        }
    },
    "Neptün": {
        tr: {
            name: "Neptün",
            type: "Buz Devi",
            temp: "-200°C",
            diameter: "49.244 km",
            day: "16 Saat 6 Dakika",
            year: "165 Yıl",
            gravity: "11.15 m/s²",
            atmosphere: "Hidrojen, Helyum, Metan",
            escapeVelocity: "23.5 km/s",
            discoveryDate: "1846 (Johann Galle)",
            moons: 16,
            life: "İmkansız",
            funFact: "Neptün'de rüzgar hızları saatte 2100 km'ye ulaşabilir.",
            desc: "Güneş'e en uzak ana gezegendir. Matematiksel hesaplamalarla yeri tahmin edilerek bulundu."
        },
        en: {
            name: "Neptune",
            type: "Ice Giant",
            temp: "-200°C",
            diameter: "49,244 km",
            day: "16 Hours 6 Mins",
            year: "165 Years",
            gravity: "11.15 m/s²",
            atmosphere: "Hydrogen, Helium, Methane",
            escapeVelocity: "23.5 km/s",
            discoveryDate: "1846 (Johann Galle)",
            moons: 16,
            life: "Impossible",
            funFact: "Supersonic winds on Neptune reach speeds of up to 2,100 km/h.",
            desc: "The outermost planet, discovered through mathematical prediction."
        }
    },
    "Ceres": {
        tr: {
            name: "Ceres",
            type: "Cüce Gezegen",
            temp: "-105°C",
            diameter: "946 km",
            day: "9 Saat",
            year: "4.6 Yıl",
            gravity: "0.27 m/s²",
            atmosphere: "Yok (Su buharı izleri)",
            escapeVelocity: "0.51 km/s",
            discoveryDate: "1801 (Giuseppe Piazzi)",
            moons: 0,
            life: "Bilinmiyor",
            funFact: "Asteroit kuşağındaki toplam kütlenin üçte birini tek başına oluşturur.",
            desc: "Asteroit Kuşağı'ndaki en büyük cisimdir. Küresel şekil alabilmiş tek asteroittir."
        },
        en: {
            name: "Ceres",
            type: "Dwarf Planet",
            temp: "-105°C",
            diameter: "946 km",
            day: "9 Hours",
            year: "4.6 Years",
            gravity: "0.27 m/s²",
            atmosphere: "None (Water vapor traces)",
            escapeVelocity: "0.51 km/s",
            discoveryDate: "1801 (Giuseppe Piazzi)",
            moons: 0,
            life: "Unknown",
            funFact: "Ceres accounts for one-third of the total mass of the asteroid belt.",
            desc: "The largest object in the asteroid belt and the only dwarf planet in the inner Solar System."
        }
    },
    "Plüton": {
        tr: {
            name: "Plüton",
            type: "Cüce Gezegen",
            temp: "-229°C",
            diameter: "2.376 km",
            day: "6.4 Gün",
            year: "248 Yıl",
            gravity: "0.62 m/s²",
            atmosphere: "İnce Azot, Metan",
            escapeVelocity: "1.2 km/s",
            discoveryDate: "1930 (Clyde Tombaugh)",
            moons: 5,
            life: "İmkansız",
            funFact: "Plüton'un yüzey alanı, Rusya'nın yüzölçümünden biraz daha küçüktür.",
            desc: "2006'ya kadar 9. gezegen olarak kabul ediliyordu. Kalp şeklinde nitrojen buzulu bulunur."
        },
        en: {
            name: "Pluto",
            type: "Dwarf Planet",
            temp: "-229°C",
            diameter: "2,376 km",
            day: "6.4 Days",
            year: "248 Years",
            gravity: "0.62 m/s²",
            atmosphere: "Thin Nitrogen, Methane",
            escapeVelocity: "1.2 km/s",
            discoveryDate: "1930 (Clyde Tombaugh)",
            moons: 5,
            life: "Impossible",
            funFact: "Pluto's surface area is smaller than Russia.",
            desc: "Reclassified as a dwarf planet in 2006. Features a heart-shaped nitrogen ice glacier."
        }
    },
    "Eris": {
        tr: {
            name: "Eris",
            type: "Cüce Gezegen",
            temp: "-243°C",
            diameter: "2.326 km",
            day: "25.9 Saat",
            year: "557 Yıl",
            gravity: "0.82 m/s²",
            atmosphere: "Donmuş Metan",
            escapeVelocity: "1.4 km/s",
            discoveryDate: "2005 (Mike Brown)",
            moons: 1,
            life: "İmkansız",
            funFact: "Eris o kadar uzaktır ki, oradan bakıldığında Güneş sadece parlak bir yıldız gibi görünür.",
            desc: "Keşfi, 'gezegen' tanımının değişmesine ve Plüton'un cüce gezegen sınıfına düşmesine neden olmuştur."
        },
        en: {
            name: "Eris",
            type: "Dwarf Planet",
            temp: "-243°C",
            diameter: "2,326 km",
            day: "25.9 Hours",
            year: "557 Years",
            gravity: "0.82 m/s²",
            atmosphere: "Frozen Methane",
            escapeVelocity: "1.4 km/s",
            discoveryDate: "2005 (Mike Brown)",
            moons: 1,
            life: "Impossible",
            funFact: "From Eris, the Sun appears merely as a single bright star.",
            desc: "Its discovery led to the updated astronomical definition of a planet."
        }
    },
    "Halley": {
        tr: {
            name: "Halley",
            type: "Kuyruklu Yıldız (Comet)",
            temp: "Güneş'e yaklaştıkça artar",
            diameter: "11 km (Çekirdek)",
            day: "2.2 Gün (Dönüş)",
            year: "76 Yıl (Yörünge)",
            gravity: "Çok Düşük",
            atmosphere: "Gaz ve Toz (Koma)",
            escapeVelocity: "~0.002 km/s",
            discoveryDate: "1705 (Edmond Halley tahmin)",
            moons: 0,
            life: "İmkansız",
            funFact: "Mark Twain, Halley'in geçtiği yıl doğmuş ve bir sonraki geçişinde hayatını kaybetmiştir.",
            desc: "Tarihin en ünlü kuyruklu yıldızıdır. İnsan ömründe çıplak gözle iki kez görülebilir."
        },
        en: {
            name: "Halley",
            type: "Comet",
            temp: "Increases near Sun",
            diameter: "11 km (Nucleus)",
            day: "2.2 Days (Rotation)",
            year: "76 Years (Orbit)",
            gravity: "Extremely Low",
            atmosphere: "Gas and Dust (Coma)",
            escapeVelocity: "~0.002 km/s",
            discoveryDate: "1705 (Predicted by Edmond Halley)",
            moons: 0,
            life: "Impossible",
            funFact: "Mark Twain was born in a year of Halley's Comet and died on its return.",
            desc: "The most famous periodic comet, visible to the naked eye every 75-76 years."
        }
    }
};