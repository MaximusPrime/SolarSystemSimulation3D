
import * as THREE from 'three';
import gsap from 'gsap';

// ==========================================
// 🎬 STÜDYO KALİTESİNDE SİNEMATİK TUR v2.0
// 4 Fazlı Kamera Koreografisi Sistemi
// ==========================================

// Optimize edilmiş tur sırası: Güneş → İç Gezegenler → Dış Gezegenler
const tourOrder = [
    "GUNES", "Merkür", "Venüs", "Dünya", "Mars",
    "Jüpiter", "Satürn", "Uranüs", "Neptün", "Plüton"
];

let isTourActive = false;
let currentTourIndex = 0;
let currentTimeline = null;

// ==========================================
// 🎥 SİNEMATİK YAPILANDIRMA
// ==========================================
const CINEMATIC_CONFIG = {
    // Zamanlama (saniye)
    approachDuration: { min: 2.5, max: 5.0 },
    orbitDuration: 6.0,
    elevationDuration: 2.0,
    departureDuration: 1.5,

    // Kamera açıları
    orbitAngle: Math.PI, // 180 derece
    elevationHeight: 15,
    departureHeight: 35,

    // Easing presetleri (sinematik his)
    easing: {
        approach: "power2.inOut",
        orbit: "power2.inOut",
        elevation: "sine.inOut",
        departure: "power1.out"
    }
};

// ==========================================
// 🎯 HEDEF MESH ÇÖZÜMLEYİCİ
// ==========================================
function getTargetMesh(planetName, planets, sun) {
    if (planetName === "GUNES") return sun;
    if (planetName === "Ay") {
        const moonData = planets.find(p => p.mesh?.userData?.name === "Ay" || p.mesh?.userData?.name === "Moon");
        return moonData ? moonData.mesh : null;
    }
    const planetData = planets.find(p => p.name === planetName);
    return planetData ? planetData.mesh : null;
}

// ==========================================
// 📐 GÖRÜŞ AYARLARI HESAPLAYICI
// ==========================================
function calculateViewSettings(targetMesh, name) {
    const size = targetMesh.userData.artisticSize || 1;
    let distance, heightOffset;

    if (name === "GUNES") {
        distance = size * 3.5;
        heightOffset = size * 0.6;
    } else if (size < 1) {
        // Küçük gezegenler (Merkür, Mars, Plüton)
        distance = Math.max(size * 6, 5);
        heightOffset = 2.5;
    } else if (size > 3) {
        // Gaz devleri (Jüpiter, Satürn)
        distance = size * 2.8;
        heightOffset = size * 0.6;
    } else {
        // Orta boy gezegenler (Venüs, Dünya, Uranüs, Neptün)
        distance = size * 3.2;
        heightOffset = size * 0.8;
    }

    return { distance, heightOffset };
}

// ==========================================
// 🎬 ANA ANİMASYON SEKVENSİ
// ==========================================
function animateTourSequence(camera, controls, planets, sun, showInfoFn, updateHudTargetFn) {
    if (!isTourActive || currentTourIndex >= tourOrder.length) {
        finishTour(camera, controls, updateHudTargetFn);
        return;
    }

    const planetName = tourOrder[currentTourIndex];
    const targetMesh = getTargetMesh(planetName, planets, sun);

    if (!targetMesh) {
        console.warn(`[Sinematik Tur] Hedef bulunamadı: ${planetName}`);
        currentTourIndex++;
        animateTourSequence(camera, controls, planets, sun, showInfoFn, updateHudTargetFn);
        return;
    }

    // === KURULUM ===
    const { distance, heightOffset } = calculateViewSettings(targetMesh, planetName);
    const startPos = camera.position.clone();

    // Hedef dünya pozisyonunu al
    const targetWorldPos = new THREE.Vector3();
    targetMesh.getWorldPosition(targetWorldPos);

    // Yaklaşım yönüne göre giriş açısını hesapla
    const offset = new THREE.Vector3().subVectors(startPos, targetWorldPos);
    let entryAngle = Math.atan2(offset.z, offset.x);

    // Yörünge başlangıç pozisyonu
    const orbitStartPos = new THREE.Vector3(
        targetWorldPos.x + Math.cos(entryAngle) * distance,
        targetWorldPos.y + heightOffset,
        targetWorldPos.z + Math.sin(entryAngle) * distance
    );

    // === TİMELİNE OLUŞTURMA ===
    if (currentTimeline) currentTimeline.kill();
    currentTimeline = gsap.timeline({
        onComplete: () => {
            currentTourIndex++;
            animateTourSequence(camera, controls, planets, sun, showInfoFn, updateHudTargetFn);
        }
    });

    // ==========================================
    // FAZ 1: YAKLAŞMA (Yumuşak spiral iniş)
    // ==========================================
    const travelDist = startPos.distanceTo(orbitStartPos);
    const approachDuration = Math.min(
        Math.max(travelDist / 50, CINEMATIC_CONFIG.approachDuration.min),
        CINEMATIC_CONFIG.approachDuration.max
    );

    // Türkçe gezegen adını göster
    const displayName = planetName === "GUNES" ? "GÜNEŞ" : planetName.toUpperCase();

    currentTimeline.to(camera.position, {
        duration: approachDuration,
        x: orbitStartPos.x,
        y: orbitStartPos.y,
        z: orbitStartPos.z,
        ease: CINEMATIC_CONFIG.easing.approach,
        onStart: () => {
            if (updateHudTargetFn) updateHudTargetFn(`✈ ${displayName}'E YAKLAŞILIYOR...`);
        },
        onUpdate: () => {
            // Seyahat sırasında hedefe yumuşakça bak
            const curTarget = new THREE.Vector3();
            targetMesh.getWorldPosition(curTarget);
            controls.target.lerp(curTarget, 0.08);
        }
    });

    // ==========================================
    // FAZ 2: YÖRÜNGE (180° sinematik tarama)
    // ==========================================
    const orbitState = { angle: entryAngle };

    // showInfo için doğru gezegen adını kullan
    const infoName = planetName === "GUNES" ? "Güneş" : planetName;

    currentTimeline.to(orbitState, {
        duration: CINEMATIC_CONFIG.orbitDuration,
        angle: entryAngle + CINEMATIC_CONFIG.orbitAngle,
        ease: CINEMATIC_CONFIG.easing.orbit,
        onStart: () => {
            // Bilgi kartını animasyonla göster
            if (showInfoFn) showInfoFn(infoName);
            if (updateHudTargetFn) updateHudTargetFn(`★ ${displayName} ★`);
        },
        onUpdate: () => {
            if (!isTourActive) return;
            const curTarget = new THREE.Vector3();
            targetMesh.getWorldPosition(curTarget);

            // Yumuşak dairesel yörünge
            const cx = curTarget.x + Math.cos(orbitState.angle) * distance;
            const cz = curTarget.z + Math.sin(orbitState.angle) * distance;

            camera.position.set(cx, orbitStartPos.y, cz);
            controls.target.copy(curTarget);
        }
    });

    // ==========================================
    // FAZ 3: YÜKSELİŞ (Nazik tırmanış + uzaklaşma)
    // ==========================================
    currentTimeline.to(camera.position, {
        duration: CINEMATIC_CONFIG.elevationDuration,
        y: `+=${CINEMATIC_CONFIG.elevationHeight}`,
        ease: CINEMATIC_CONFIG.easing.elevation,
        onUpdate: () => {
            if (!isTourActive) return;
            const curTarget = new THREE.Vector3();
            targetMesh.getWorldPosition(curTarget);
            controls.target.copy(curTarget);
        }
    });

    // ==========================================
    // FAZ 4: AYRILIŞ (Yüksel ve sonrakine hazırlan)
    // ==========================================
    currentTimeline.to(camera.position, {
        duration: CINEMATIC_CONFIG.departureDuration,
        y: `+=${CINEMATIC_CONFIG.departureHeight - CINEMATIC_CONFIG.elevationHeight}`,
        ease: CINEMATIC_CONFIG.easing.departure,
        onStart: () => {
            // Ayrılmadan önce bilgi panelini gizle
            const infoPanel = document.getElementById('info-panel');
            if (infoPanel) {
                infoPanel.classList.remove('active');
            }
        },
        onUpdate: () => {
            if (!isTourActive) return;
            const curTarget = new THREE.Vector3();
            targetMesh.getWorldPosition(curTarget);
            controls.target.lerp(curTarget, 0.1);
        }
    });
}

// ==========================================
// 🏁 TUR BİTİŞİ
// ==========================================
function finishTour(camera, controls, updateHudTargetFn) {
    isTourActive = false;
    if (updateHudTargetFn) updateHudTargetFn("◈ SERBEST UÇUŞ ◈");

    // Bilgi panelini gizle
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) infoPanel.classList.remove('active');

    // Genel görünüm pozisyonuna dön
    const endPos = { x: 0, y: 150, z: 250 };

    gsap.to(camera.position, {
        duration: 4,
        x: endPos.x,
        y: endPos.y,
        z: endPos.z,
        ease: "power2.inOut"
    });

    gsap.to(controls.target, {
        duration: 4,
        x: 0,
        y: 0,
        z: 0,
        ease: "power2.inOut"
    });
}

// ==========================================
// 🚀 PUBLIC API
// ==========================================

export function startCinematicTour(camera, controls, planets, sun, showInfoFn, updateHudTargetFn) {
    if (isTourActive) {
        stopTour();
        return false;
    }

    isTourActive = true;
    currentTourIndex = 0;

    if (updateHudTargetFn) updateHudTargetFn("★ KOZMİK YOLCULUK BAŞLIYOR ★");

    // Başlamadan önce açık bilgi panelini gizle
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) infoPanel.classList.remove('active');

    setTimeout(() => {
        if (isTourActive) animateTourSequence(camera, controls, planets, sun, showInfoFn, updateHudTargetFn);
    }, 800);

    return true;
}

export function stopTour() {
    isTourActive = false;
    if (currentTimeline) {
        currentTimeline.kill();
        currentTimeline = null;
    }
    gsap.killTweensOf({});

    // Durdurulunca bilgi panelini gizle
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) infoPanel.classList.remove('active');
}

export function isTourRunning() {
    return isTourActive;
}
