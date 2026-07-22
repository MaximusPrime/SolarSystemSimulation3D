import * as THREE from 'three';
import { planetInfo, translations } from '../data/database.js';

export function setupUI(scene, camera, controls, planets, sun, asteroidMesh, state) {
    const pauseBtn = document.getElementById('pauseBtn');
    const lockBtn = document.getElementById('lockBtn');
    const scaleBtn = document.getElementById('scaleBtn');
    const orbitBtn = document.getElementById('orbitBtn');
    const langBtn = document.getElementById('langBtn');

    const speedSlider = document.getElementById('speedSlider');
    const speedValueEl = document.getElementById('speedValue');
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValueEl = document.getElementById('opacityValue');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValueEl = document.getElementById('zoomValue');
    const infoPanel = document.getElementById('info-panel');
    const closeBtn = document.getElementById('close-btn');
    const planetNameEl = document.getElementById('planet-name');
    const planetDetailsEl = document.getElementById('planet-details');

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function toggleComparison() {
        if (!state.focusedPlanet) return;
        if (state.comparisonMesh) { scene.remove(state.comparisonMesh); state.comparisonMesh = null; return; }

        const geo = new THREE.SphereGeometry(1.0, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.3 });
        state.comparisonMesh = new THREE.Mesh(geo, mat);
        scene.add(state.comparisonMesh);
    }

    function showInfo(name) {
        if (name && planetInfo[name]) {
            const lang = state.language || 'en';
            const t = translations[lang] || translations.en;
            const data = planetInfo[name][lang] || planetInfo[name]['en'] || planetInfo[name]['tr'];
            
            planetNameEl.innerText = data.name || name;

            planetDetailsEl.innerHTML = `
                <table class="info-table">
                    <tr><td class="label">${t.tableType}</td><td class="value">${data.type}</td></tr>
                    <tr><td class="label">${t.tableDiameter}</td><td class="value">${data.diameter}</td></tr>
                    <tr><td class="label">${t.tableTemp}</td><td class="value">${data.temp}</td></tr>
                    <tr><td class="label">${t.tableGravity}</td><td class="value">${data.gravity || '—'}</td></tr>
                    <tr><td class="label">${t.tableEscapeVelocity}</td><td class="value">${data.escapeVelocity || '—'}</td></tr>
                    <tr><td class="label">${t.tableDay}</td><td class="value">${data.day}</td></tr>
                    <tr><td class="label">${t.tableYear}</td><td class="value">${data.year}</td></tr>
                    <tr><td class="label">${t.tableAtmosphere}</td><td class="value">${data.atmosphere || '—'}</td></tr>
                    <tr><td class="label">${t.tableDiscoveryDate}</td><td class="value">${data.discoveryDate || '—'}</td></tr>
                    <tr><td class="label">${t.tableMoons}</td><td class="value">${data.moons !== undefined ? data.moons : '—'}</td></tr>
                    <tr><td class="label">${t.tableLife}</td><td class="value" style="color:#ffaa00">${data.life}</td></tr>
                </table>
                
                <button id="compareBtn">${t.compareBtn}</button>
                
                <div class="info-description">
                    <p>${data.desc}</p>
                </div>
                
                <div class="info-funfact">
                    💡 <em>${data.funFact}</em>
                </div>
            `;
            infoPanel.classList.add('active');
            const compareBtn = document.getElementById('compareBtn');
            if (compareBtn) compareBtn.onclick = toggleComparison;
        }
    }

    if (pauseBtn) {
        pauseBtn.onclick = function (e) {
            e.stopPropagation();
            state.isPaused = !state.isPaused;
            window.dispatchEvent(new CustomEvent('simulation-settings-changed'));
        };
    }

    if (speedSlider) {
        speedSlider.oninput = function () {
            state.timeScale = parseFloat(this.value);
            if (speedValueEl) speedValueEl.innerText = state.timeScale + "x";
            window.dispatchEvent(new CustomEvent('simulation-settings-changed'));
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
            state.panelOpacity = parseInt(val);
            window.dispatchEvent(new CustomEvent('simulation-settings-changed'));
        };
    }

    if (closeBtn) {
        closeBtn.onclick = function () {
            infoPanel.classList.remove('active');
            if (state.comparisonMesh) { scene.remove(state.comparisonMesh); state.comparisonMesh = null; }
        };
    }

    const onPointerDown = (event) => {
        if (event.target.closest('#ui-container') || event.target.closest('#info-panel') || event.target.closest('#menu-toggle-btn') || event.target.closest('#close-btn')) {
            return;
        }

        if (event.button === 1) {
            event.preventDefault();
            event.stopPropagation();
        }

        const rect = controls.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        let clickedPlanetMesh = null;
        if (intersects.length > 0) {
            for (let i = 0; i < intersects.length; i++) {
                const obj = intersects[i].object;
                if (obj.type === 'Sprite' || obj.type === 'Line' || obj.type === 'LineLoop' || obj.type === 'Points') continue;
                if (obj.userData.name || (obj.parent && obj.parent.userData.name)) {
                    clickedPlanetMesh = obj;
                    break;
                }
            }
        }

        if (!clickedPlanetMesh) {
            if (event.button === 0) {
                state.focusedPlanet = null;
                infoPanel.classList.remove('active');
                if (state.comparisonMesh) { scene.remove(state.comparisonMesh); state.comparisonMesh = null; }
            }
            return;
        }

        if (state.isLocked) return;

        let name = clickedPlanetMesh.userData.name || clickedPlanetMesh.parent.userData.name;

        if (event.button === 0) {
            state.focusedPlanet = clickedPlanetMesh;
            showInfo(name);
        }

        if (event.button === 1) {
            state.focusedPlanet = clickedPlanetMesh;
            const targetPos = new THREE.Vector3();
            state.focusedPlanet.getWorldPosition(targetPos);

            const currentScale = state.focusedPlanet.scale.x;
            const realRadius = (state.focusedPlanet.userData.artisticSize || 1) * currentScale;

            const dist = realRadius * 5 + 2;
            const offset = new THREE.Vector3(dist, dist * 0.5, dist);

            camera.position.copy(targetPos).add(offset);
            controls.target.copy(targetPos);

            showInfo(name);
        }
    };

    if (controls.domElement) {
        controls.domElement.addEventListener('pointerdown', onPointerDown, { capture: true });
        controls.domElement.addEventListener('auxclick', (e) => {
            if (e.button === 1) onPointerDown(e);
        }, { capture: true });
    }

    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const uiContainer = document.getElementById('ui-container');

    if (menuToggleBtn && uiContainer) {
        menuToggleBtn.onclick = function (e) {
            e.stopPropagation();
            const isActive = uiContainer.classList.toggle('active');
            menuToggleBtn.classList.toggle('active');
            menuToggleBtn.innerHTML = isActive ? '✕' : '⚙';
        };
    }

    if (zoomSlider) {
        const min = controls.minDistance || 1.5;
        const max = 350;

        zoomSlider.oninput = function () {
            const pct = parseFloat(this.value) / 100;
            const newDistance = min + (max - min) * (1 - pct);
            
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            
            camera.position.copy(controls.target).sub(direction.setLength(newDistance));
            controls.update();
            
            if (zoomValueEl) zoomValueEl.innerText = this.value + "%";
        };

        controls.addEventListener('change', () => {
            const distance = camera.position.distanceTo(controls.target);
            const normalized = Math.max(0, Math.min(1, (distance - min) / (max - min)));
            const pct = Math.round((1 - normalized) * 100);
            zoomSlider.value = pct;
            if (zoomValueEl) zoomValueEl.innerText = pct + "%";
        });
    }

    const syncOrbitControlsState = () => {
        controls.enabled = !state.isLocked;
    };

    const clearDragLock = () => {
        if (controls.domElement) {
            const upEvent = new PointerEvent('pointerup', { bubbles: false, cancelable: true });
            controls.domElement.dispatchEvent(upEvent);
        }
    };

    if (controls.domElement) {
        controls.domElement.addEventListener('pointermove', (event) => {
            if (event.buttons === 0) {
                syncOrbitControlsState();
            } else if (event.buttons === 1 && !controls.enabled) {
                controls.enabled = false;
            }
        });

        const deactivateControls = () => {
            clearDragLock();
        };

        controls.domElement.addEventListener('pointerleave', deactivateControls);
        controls.domElement.addEventListener('pointerout', deactivateControls);

        controls.domElement.addEventListener('wheel', (event) => {
            if (state.isLocked) return;
            event.preventDefault();
            
            if (zoomSlider) {
                let currentValue = parseFloat(zoomSlider.value);
                const step = 5;
                if (event.deltaY < 0) {
                    currentValue = Math.min(100, currentValue + step);
                } else {
                    currentValue = Math.max(0, currentValue - step);
                }
                zoomSlider.value = currentValue;
                zoomSlider.oninput();
            }
        }, { passive: false });
    }

    window.addEventListener('blur', clearDragLock);
    window.addEventListener('focusout', clearDragLock);
    document.addEventListener('visibilitychange', clearDragLock);
    window.addEventListener('pointerup', clearDragLock);

    if (langBtn) {
        langBtn.onclick = function (e) {
            e.stopPropagation();
            state.language = state.language === 'en' ? 'tr' : 'en';
            window.dispatchEvent(new CustomEvent('simulation-settings-changed'));
        };
    }

    if (lockBtn) {
        lockBtn.onclick = function (e) {
            e.stopPropagation();
            state.isLocked = !state.isLocked;
            window.dispatchEvent(new CustomEvent('simulation-settings-changed'));
        };
    }

    if (scaleBtn) {
        scaleBtn.onclick = function (e) {
            e.stopPropagation();
            state.isTrueScale = !state.isTrueScale;
            window.dispatchEvent(new CustomEvent('simulation-settings-changed'));
        };
    }

    if (orbitBtn) {
        orbitBtn.onclick = function (e) {
            e.stopPropagation();
            state.showOrbits = !state.showOrbits;
            window.dispatchEvent(new CustomEvent('simulation-settings-changed'));
        };
    }

    function updateUIElements() {
        const lang = state.language || 'en';
        const t = translations[lang] || translations.en;

        const panelTitleEl = document.getElementById('panel-title');
        if (panelTitleEl) panelTitleEl.innerText = t.headerTitle;

        if (langBtn) langBtn.innerText = t.langBtnText;

        if (lockBtn) {
            if (state.isLocked) {
                controls.mouseButtons = {
                    LEFT: THREE.MOUSE.NONE,
                    MIDDLE: THREE.MOUSE.NONE,
                    RIGHT: THREE.MOUSE.NONE
                };
                controls.enableZoom = false;
                lockBtn.innerHTML = t.lockBtnLocked;
                lockBtn.classList.remove('unlocked');
                syncOrbitControlsState();
            } else {
                controls.mouseButtons = {
                    LEFT: THREE.MOUSE.ROTATE,
                    MIDDLE: THREE.MOUSE.NONE,
                    RIGHT: THREE.MOUSE.DOLLY
                };
                controls.enableZoom = true;
                lockBtn.innerHTML = t.lockBtnUnlocked;
                lockBtn.classList.add('unlocked');
                syncOrbitControlsState();
            }
        }

        if (pauseBtn) {
            pauseBtn.innerHTML = state.isPaused ? t.pauseBtnResume : t.pauseBtnPause;
            if (state.isPaused) pauseBtn.classList.add('active');
            else pauseBtn.classList.remove('active');
        }

        if (scaleBtn) {
            scaleBtn.innerHTML = state.isTrueScale ? t.scaleBtnOn : t.scaleBtnOff;
            if (state.isTrueScale) scaleBtn.classList.add('active');
            else scaleBtn.classList.remove('active');
        }

        if (orbitBtn) {
            orbitBtn.innerHTML = state.showOrbits ? t.orbitBtnShow : t.orbitBtnHide;
            if (state.showOrbits) orbitBtn.classList.add('active');
            else orbitBtn.classList.remove('active');
        }

        const lblSpeed = document.getElementById('lblSpeed');
        if (lblSpeed) lblSpeed.childNodes[0].nodeValue = t.speedLabel + " ";

        const lblOpacity = document.getElementById('lblOpacity');
        if (lblOpacity) lblOpacity.childNodes[0].nodeValue = t.opacityLabel + " ";

        const lblZoom = document.getElementById('lblZoom');
        if (lblZoom) lblZoom.childNodes[0].nodeValue = t.zoomLabel + " ";

        const lblControlsTitle = document.getElementById('lblControlsTitle');
        if (lblControlsTitle) lblControlsTitle.innerText = t.controlsTitle;

        const lblHelpLeftAction = document.getElementById('lblHelpLeftAction');
        if (lblHelpLeftAction) lblHelpLeftAction.innerText = t.helpLeftClickAction;

        const lblHelpLeftDesc = document.getElementById('lblHelpLeftDesc');
        if (lblHelpLeftDesc) lblHelpLeftDesc.innerText = t.helpLeftClickDesc;

        const lblHelpMiddleAction = document.getElementById('lblHelpMiddleAction');
        if (lblHelpMiddleAction) lblHelpMiddleAction.innerText = t.helpMiddleClickAction;

        const lblHelpMiddleDesc = document.getElementById('lblHelpMiddleDesc');
        if (lblHelpMiddleDesc) lblHelpMiddleDesc.innerText = t.helpMiddleClickDesc;

        const lblHelpRightAction = document.getElementById('lblHelpRightAction');
        if (lblHelpRightAction) lblHelpRightAction.innerText = t.helpRightClickAction;

        const lblHelpRightDesc = document.getElementById('lblHelpRightDesc');
        if (lblHelpRightDesc) lblHelpRightDesc.innerText = t.helpRightClickDesc;

        const warningEl = document.getElementById('help-status-warning');
        const helpItems = document.querySelectorAll('.help-item');
        if (warningEl) {
            if (state.isLocked) {
                warningEl.innerHTML = t.warningLocked;
                warningEl.classList.remove('unlocked');
                warningEl.style.background = "rgba(255, 68, 68, 0.1)";
                warningEl.style.color = "#ff6666";
                warningEl.style.borderColor = "rgba(255, 68, 68, 0.2)";
            } else {
                warningEl.innerHTML = t.warningUnlocked;
                warningEl.classList.add('unlocked');
                warningEl.style.background = "rgba(0, 200, 100, 0.1)";
                warningEl.style.color = "#00ff88";
                warningEl.style.borderColor = "rgba(0, 200, 100, 0.2)";
            }
        }

        helpItems.forEach(item => {
            if (state.isLocked) {
                item.classList.add('disabled');
            } else {
                item.classList.remove('disabled');
            }
        });

        if (state.focusedPlanet && infoPanel && infoPanel.classList.contains('active')) {
            let name = state.focusedPlanet.userData.name || (state.focusedPlanet.parent && state.focusedPlanet.parent.userData.name);
            if (name) showInfo(name);
        }

        const menuToggleBtn = document.getElementById('menu-toggle-btn');
        const uiContainer = document.getElementById('ui-container');
        if (menuToggleBtn && uiContainer) {
            if (state.showUI === false) {
                menuToggleBtn.style.setProperty('display', 'none', 'important');
                uiContainer.style.setProperty('display', 'none', 'important');
            } else {
                menuToggleBtn.style.removeProperty('display');
                uiContainer.style.removeProperty('display');
            }
        }
    }

    window.addEventListener('simulation-settings-changed', updateUIElements);
    setTimeout(updateUIElements, 50);

    return showInfo;
}