
import * as THREE from 'three';
import { initScene } from './core/setup.js';
import { createPlanetSystem, createDwarfPlanet, createAsteroidBelt, createStarfieldOverlay, createSun } from './world/creators.js';
import { setupUI } from './ui/interaction.js';
import { updateLabel } from './utils/helpers.js';
import { planetInfo } from './data/database.js';

// ==========================================
// 2. AYARLAR (DURUM YÖNETİMİ)
// ==========================================
const state = {
    isPaused: false,
    timeScale: 1,
    absoluteTime: 0,
    focusedPlanet: null,
    comparisonMesh: null,
    isTrueScale: false,
    simulationStartTime: Date.now(),
    isLocked: false,
    showOrbits: false,
    showUI: true,
    panelOpacity: 85,
    language: 'en'
};

const planets = [];

// ==========================================
// 3. SAHNE KURULUMU
// ==========================================
const { scene, camera, renderer, controls, composer, sunLight } = initScene();

// ==========================================
// 4. NESNELERİ YARAT
// ==========================================
const stars = createStarfieldOverlay(scene);
const sun = createSun(scene);

createPlanetSystem(scene, planets, { name: "Merkür", size: 0.38, texture: "mercury.jpg", distance: 10, speed: 0.04, color: 0xaaaaaa });
createPlanetSystem(scene, planets, { name: "Venüs", size: 0.95, texture: "venus.jpg", distance: 16, speed: 0.025, color: 0xeecb8b });
createPlanetSystem(scene, planets, { name: "Dünya", size: 1.0, texture: "earth.jpg", distance: 24, speed: 0.018, color: 0x2233ff });
createPlanetSystem(scene, planets, { name: "Mars", size: 0.53, texture: "mars.jpg", distance: 32, speed: 0.012, color: 0xc1440e });

const asteroidMesh = createAsteroidBelt(scene);

createDwarfPlanet(scene, planets, { name: "Ceres", size: 0.8, texture: "ceres.jpg", color: 0xaaaaaa, distance: 40, speed: 0.01, tiltX: 0.1, tiltZ: 0 });
createPlanetSystem(scene, planets, { name: "Jüpiter", size: 4.0, texture: "jupiter.jpg", distance: 55, speed: 0.006, color: 0xc99039 });
createPlanetSystem(scene, planets, { name: "Satürn", size: 3.5, texture: "saturn.jpg", distance: 80, speed: 0.004, color: 0xe3e0c0, ring: { inner: 4.2, outer: 7.5, tex: "saturn_ring.png" } });
createPlanetSystem(scene, planets, { name: "Uranüs", size: 1.8, texture: "uranus.jpg", distance: 100, speed: 0.003, color: 0x4fd0e7 });
createPlanetSystem(scene, planets, { name: "Neptün", size: 1.7, texture: "neptune.jpg", distance: 120, speed: 0.002, color: 0x4b70dd });
createDwarfPlanet(scene, planets, { name: "Plüton", size: 0.9, texture: "pluto.jpg", color: 0xccaacc, distance: 145, speed: 0.0015, tiltX: 0.3, tiltZ: 0.1 });
createDwarfPlanet(scene, planets, { name: "Eris", size: 0.9, texture: "eris.jpg", color: 0xffffff, distance: 170, speed: 0.001, tiltX: -0.2, tiltZ: 0.2 });

// ==========================================
// 6. UI VE ETKİLEŞİM
// ==========================================
const showInfoFn = setupUI(scene, camera, controls, planets, sun, asteroidMesh, state);

// ==========================================
// 6.5. DİNAMİK SİMÜLASYON AYARLARINI UYGULA
// ==========================================
function applySimulationSettings() {
    const lang = state.language || 'en';

    if (sun && sun.userData && sun.userData.label) {
        const sunData = planetInfo["GUNES"];
        const sunName = sunData && sunData[lang] ? sunData[lang].name : "SUN";
        updateLabel(sun.userData.label, sunName);
    }

    planets.forEach(p => {
        if (p.mesh && p.mesh.userData) {
            const artisticSize = p.mesh.userData.artisticSize || 1;
            const trueSize = p.mesh.userData.trueSize || artisticSize;
            
            // Gerçekçi veya artistik ölçeğe göre boyutları ayarla
            let targetScale = 1.0;
            if (p.type === 'moon') {
                targetScale = state.isTrueScale ? 0.15 : 0.4;
                p.mesh.userData.moonDist = state.isTrueScale ? 1.5 : 4.0;
            } else {
                targetScale = state.isTrueScale ? (trueSize / artisticSize) : 1.0;
            }
            p.mesh.scale.setScalar(targetScale);

            // Bulutları gezegene göre orantıla
            if (p.mesh.userData.clouds) {
                p.mesh.userData.clouds.scale.setScalar(1.02);
            }

            // Etiket metnini ve pozisyonunu boyutla veya dile göre güncelle
            if (p.mesh.userData.label) {
                const currentSize = state.isTrueScale ? trueSize : artisticSize;
                p.mesh.userData.label.position.y = currentSize + 0.8;

                const planetKey = p.mesh.userData.name;
                const pData = planetInfo[planetKey];
                const translatedName = pData && pData[lang] ? pData[lang].name : (planetKey || '');
                updateLabel(p.mesh.userData.label, translatedName);
            }

            // Yörünge mesafesini güncelle
            p.distance = state.isTrueScale ? (p.mesh.userData.trueDist || p.distance) : (p.mesh.userData.artisticDist || p.distance);
        }

        // Yörünge çizgi boyutunu ve görünürlüğünü güncelle
        const orbitMesh = p.orbit || p.orbitRef;
        if (orbitMesh) {
            orbitMesh.visible = state.showOrbits;
            const artisticDist = p.mesh.userData.artisticDist || 1;
            const trueDist = p.mesh.userData.trueDist || artisticDist;
            const orbitScale = state.isTrueScale ? (trueDist / artisticDist) : 1.0;
            orbitMesh.scale.setScalar(orbitScale);
        }
    });
}

// Arayüzden gelen değişiklikleri dinle
window.addEventListener('simulation-settings-changed', () => {
    applySimulationSettings();
});

// ==========================================
// 6.6. LIVELY WALLPAPER ENTEGRASYONU (API)
// ==========================================
window.livelyPropertyListener = function (name, val) {
    switch (name) {
        case "isLocked":
            state.isLocked = val;
            break;
        case "isPaused":
            state.isPaused = val;
            break;
        case "timeScale":
            state.timeScale = val;
            break;
        case "isTrueScale":
            state.isTrueScale = val;
            break;
        case "showOrbits":
            state.showOrbits = val;
            break;
        case "showUI":
            state.showUI = val;
            break;
        case "panelOpacity":
            state.panelOpacity = val;
            localStorage.setItem('panelOpacity', val.toString());
            break;
        case "language":
            state.language = val === 0 ? "en" : (val === 1 ? "tr" : val);
            break;
    }
    applySimulationSettings();
    window.dispatchEvent(new CustomEvent('simulation-settings-changed'));
};

// Başlangıç ayarlarını uygula
applySimulationSettings();

// ==========================================
// 7. ANİMASYON DÖNGÜSÜ
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    // Tarayıcı sekmesi gizlendiğinde veya duvar kağıdı arkada kaldığında render'ı askıya alarak CPU/GPU tasarrufu sağla
    if (document.hidden) return;

    if (!state.isPaused) {
        const speed = state.timeScale;
        state.absoluteTime += 0.01 * speed;

        // Shader Time Update
        if (sun.material.uniforms) sun.material.uniforms.time.value += 0.02;
        if (stars && stars.material.uniforms) stars.material.uniforms.time.value += 0.005;

        sun.rotation.y += 0.002 * speed;
        if (asteroidMesh) asteroidMesh.rotation.y += 0.002 * speed;

        planets.forEach(p => {
            if (p.type === 'planet') {
                const x = Math.cos(state.absoluteTime * p.speed * 10) * p.distance;
                const z = Math.sin(state.absoluteTime * p.speed * 10) * p.distance;
                p.mesh.position.set(x, 0, z);
                p.mesh.rotation.y += 0.02 * speed;
                if (p.mesh.userData.clouds) p.mesh.userData.clouds.rotation.y += 0.025 * speed;
            }
            if (p.type === 'dwarf') {
                const angle = state.absoluteTime * p.speed * 10;
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



    if (state.focusedPlanet && state.comparisonMesh) {
        const targetPos = new THREE.Vector3();
        state.focusedPlanet.getWorldPosition(targetPos);
        const currentScale = state.focusedPlanet.scale.x;
        const planetRadius = (state.focusedPlanet.userData.artisticSize || 1) * currentScale;
        const earthRadius = 1.0 * (state.isTrueScale ? 0.3 : 1.0);
        const offset = planetRadius + earthRadius + 2.0;
        state.comparisonMesh.position.copy(targetPos).x += offset;
        state.comparisonMesh.scale.setScalar(state.isTrueScale ? 0.3 : 1.0);
    }

    if (state.focusedPlanet) {
        const targetPos = new THREE.Vector3();
        state.focusedPlanet.getWorldPosition(targetPos);
        controls.target.copy(targetPos);
    }

    controls.update();
    composer.render();
}

animate();
