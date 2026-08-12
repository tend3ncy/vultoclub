/**
 * VULTO CLUB — Editor de Mockup 3D
 * Usa shirt_baked.glb (UV correto) com DecalGeometry pra aplicar texturas na malha
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

(function() {
  'use strict';

  const state = {
    model: 'shirt_baked',
    color: '#1a1a1a',
    size: 'M',
    text: { content: '', font: 'Inter', size: 'medium', color: '#ffffff' },
    customArt: { file: null, dataUrl: null },
    customer: { name: '', phone: '', instagram: '' }
  };

  const PRICING = {
    base: { 'shirt_baked': 119.90, 'oversized-tshirt': 129.90, 'polo-shirt': 139.90 },
    extraArt: 20.00
  };

  function calculatePrice() {
    let total = 119.90;
    document.getElementById('price-value').textContent = 'R$ ' + total.toFixed(2).replace('.',',');
    document.getElementById('price-detail').textContent = 'Camiseta Personalizada';
    document.getElementById('price-breakdown').innerHTML = '<div class="price-line total"><span>Total</span><span>R$ ' + total.toFixed(2).replace('.',',') + '</span></div>';
    document.getElementById('btn-price').textContent = 'R$ ' + total.toFixed(2).replace('.',',');
    return total;
  }

  // ============ THREE.JS ============
  let scene, camera, renderer, controls;
  let shirtMesh = null, shirtMaterial = null;
  let logoDecalMesh = null, artDecalMesh = null, textDecalMesh = null;
  const container = document.getElementById('editor-canvas');

  function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(25, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 2.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting — bright and even
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(2, 3, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-2, 1, -2);
    scene.add(fill);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 4;
    controls.target.set(0, 0, 0);

    // Mobile: lock rotation
    if (window.innerWidth <= 900) {
      controls.enableRotate = false;
      controls.enableZoom = false;
    }
    controls.update();

    animate();
    loadShirt();
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  function loadShirt() {
    document.getElementById('editor-loading').style.display = 'flex';

    new GLTFLoader().load('../models/shirt_baked.glb', function(gltf) {
      const model = gltf.scene;

      // Find the shirt mesh (T_Shirt_male)
      model.traverse(function(child) {
        if (child.isMesh) {
          shirtMesh = child;
          // Create a new material we can control
          shirtMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(state.color),
            roughness: 0.9,
            metalness: 0
          });
          child.material = shirtMaterial;
        }
      });

      scene.add(model);
      document.getElementById('editor-loading').style.display = 'none';

      // Apply initial logo
      applyLogoDecal();

    }, undefined, function() {
      document.getElementById('editor-loading').innerHTML = '<p style="color:#ff4444">Erro ao carregar modelo</p>';
    });
  }

  function applyColor(hex) {
    if (shirtMaterial) {
      shirtMaterial.color.set(hex);
    }
  }

  // ============ DECALS (projected onto shirt geometry) ============
  function removeDecal(mesh) {
    if (mesh) {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.dispose();
      }
    }
    return null;
  }

  function applyLogoDecal() {
    if (logoDecalMesh) { scene.remove(logoDecalMesh); logoDecalMesh.geometry.dispose(); logoDecalMesh.material.dispose(); logoDecalMesh = null; }
    if (!shirtMesh) return;

    const lx = parseInt(document.getElementById('logo-x').value) / 100;
    const ly = parseInt(document.getElementById('logo-y').value) / 100;
    const lSize = parseInt(document.getElementById('logo-size').value) / 100;

    new THREE.TextureLoader().load('../arquivos/logo.png', function(texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      const aspect = texture.image.width / texture.image.height;
      const baseSize = lSize * 0.3;
      const position = new THREE.Vector3(lx * 0.3, ly * 0.3 + 0.04, 0.15);
      const orientation = new THREE.Euler(0, 0, 0);
      const size = new THREE.Vector3(baseSize * aspect, baseSize, baseSize);

      const decalGeo = new DecalGeometry(shirtMesh, position, orientation, size);
      const decalMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4
      });

      logoDecalMesh = new THREE.Mesh(decalGeo, decalMat);
      scene.add(logoDecalMesh);
    });
  }

  function applyArtDecal() {
    if (artDecalMesh) { scene.remove(artDecalMesh); artDecalMesh.geometry.dispose(); artDecalMesh.material.dispose(); artDecalMesh = null; }
    if (!shirtMesh || !state.customArt.dataUrl) return;

    const ax = parseInt(document.getElementById('art-x').value) / 100;
    const ay = parseInt(document.getElementById('art-y').value) / 100;
    const aSize = parseInt(document.getElementById('art-size').value) / 100;

    new THREE.TextureLoader().load(state.customArt.dataUrl, function(texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      const position = new THREE.Vector3(ax * 0.3, ay * 0.3, 0.15);
      const orientation = new THREE.Euler(0, 0, 0);
      const size = new THREE.Vector3(aSize * 0.5, aSize * 0.5, aSize * 0.5);

      const decalGeo = new DecalGeometry(shirtMesh, position, orientation, size);
      const decalMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4
      });

      artDecalMesh = new THREE.Mesh(decalGeo, decalMat);
      scene.add(artDecalMesh);
    });
  }

  function applyTextDecal() {
    if (textDecalMesh) { scene.remove(textDecalMesh); textDecalMesh.geometry.dispose(); textDecalMesh.material.dispose(); textDecalMesh = null; }
    if (!shirtMesh || !state.text.content) return;

    const tx = parseInt(document.getElementById('text-x').value) / 100;
    const ty = parseInt(document.getElementById('text-y').value) / 100;

    // Render text to canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const sizes = { small: 80, medium: 120, large: 170 };
    const fs = sizes[state.text.size] || 120;
    ctx.clearRect(0, 0, 1024, 512);
    ctx.font = 'bold ' + fs + 'px "' + state.text.font + '", sans-serif';
    ctx.fillStyle = state.text.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.text.content, 512, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const position = new THREE.Vector3(tx * 0.3, ty * 0.3, 0.15);
    const orientation = new THREE.Euler(0, 0, 0);
    const size = new THREE.Vector3(0.3, 0.15, 0.3);

    const decalGeo = new DecalGeometry(shirtMesh, position, orientation, size);
    const decalMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4
    });

    textDecalMesh = new THREE.Mesh(decalGeo, decalMat);
    scene.add(textDecalMesh);
  }

  // Update all decals
  window.updateDecalPos = function() {
    applyLogoDecal();
    applyArtDecal();
    applyTextDecal();
  };

  // ============ CAMERA VIEWS ============
  function setCameraView(view) {
    const targets = { front: [0, 0, 2.5], back: [0, 0, -2.5], left: [-2.5, 0, 0] };
    const t = targets[view] || targets.front;
    const start = camera.position.clone();
    const end = new THREE.Vector3(t[0], t[1], t[2]);
    const t0 = performance.now();
    (function anim(now) {
      const p = Math.min((now - t0) / 400, 1);
      camera.position.lerpVectors(start, end, 1 - Math.pow(1 - p, 3));
      controls.update();
      if (p < 1) requestAnimationFrame(anim);
    })(t0);
  }
  function setViewBtn(id) {
    document.querySelectorAll('.canvas-controls button').forEach(function(b){b.classList.remove('active');});
    document.getElementById(id).classList.add('active');
  }

  // Side selectors
  window.setLogoSide = function(side, btn) {
    document.querySelectorAll('[data-vulto-pos]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (side === 'costas') { setCameraView('back'); setViewBtn('btn-view-back'); }
    else { setCameraView('front'); setViewBtn('btn-view-front'); }
    applyLogoDecal();
  };
  window.setArtSide = function(side, btn) {
    document.querySelectorAll('[data-art-side]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (side === 'costas') { setCameraView('back'); setViewBtn('btn-view-back'); }
    else { setCameraView('front'); setViewBtn('btn-view-front'); }
    applyArtDecal();
  };
  window.setTextSide = function(side, btn) {
    document.querySelectorAll('[data-text-side]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (side === 'costas') { setCameraView('back'); setViewBtn('btn-view-back'); }
    else { setCameraView('front'); setViewBtn('btn-view-front'); }
    applyTextDecal();
  };

  // Lock toggle
  window.toggleLock = function(element) {
    const btn = document.getElementById('lock-' + element);
    const locked = btn.textContent.includes('TRAVADO');
    if (locked) { btn.textContent = '🔓 TRAVAR POSIÇÃO'; btn.style.borderColor = ''; btn.style.color = ''; }
    else { btn.textContent = '🔒 TRAVADO'; btn.style.borderColor = '#22c55e'; btn.style.color = '#22c55e'; }
  };

  // ============ UI ============
  function initUI() {
    // Color
    document.querySelectorAll('[data-color]').forEach(function(s){
      s.addEventListener('click', function(){
        document.querySelectorAll('[data-color]').forEach(function(x){x.classList.remove('active');});
        this.classList.add('active'); state.color = this.dataset.color; applyColor(state.color);
      });
    });
    // Text color
    document.querySelectorAll('[data-text-color]').forEach(function(s){
      s.addEventListener('click', function(){
        this.parentElement.querySelectorAll('.color-swatch').forEach(function(x){x.classList.remove('active');});
        this.classList.add('active'); state.text.color = this.dataset.textColor; applyTextDecal();
      });
    });
    // Text input
    document.getElementById('custom-text').addEventListener('input', function(){ state.text.content = this.value; applyTextDecal(); });
    document.getElementById('text-font').addEventListener('change', function(){ state.text.font = this.value; applyTextDecal(); });
    document.getElementById('text-size').addEventListener('change', function(){ state.text.size = this.value; applyTextDecal(); });
    // Shirt size
    document.querySelectorAll('.size-select-btn').forEach(function(b){
      b.addEventListener('click', function(){
        document.querySelectorAll('.size-select-btn').forEach(function(x){x.classList.remove('active');});
        this.classList.add('active'); state.size = this.dataset.size;
      });
    });
    // Camera views
    document.getElementById('btn-view-front').addEventListener('click', function(){ setViewBtn('btn-view-front'); setCameraView('front'); });
    document.getElementById('btn-view-back').addEventListener('click', function(){ setViewBtn('btn-view-back'); setCameraView('back'); });
    document.getElementById('btn-view-left').addEventListener('click', function(){ setViewBtn('btn-view-left'); setCameraView('left'); });
    // Upload
    initUpload();
    // Order
    document.getElementById('btn-finalize').addEventListener('click', function(){ document.getElementById('order-modal').classList.add('open'); });
    document.getElementById('btn-screenshot').addEventListener('click', function(){
      const a=document.createElement('a');a.download='vulto-mockup-'+Date.now()+'.png';a.href=renderer.domElement.toDataURL('image/png');a.click();
    });
    document.getElementById('btn-send-order').addEventListener('click', submitOrder);
    document.getElementById('btn-cancel-order').addEventListener('click', function(){ document.getElementById('order-modal').classList.remove('open'); });
    window.addEventListener('resize', onResize);
  }

  // ============ UPLOAD ============
  function initUpload() {
    const area = document.getElementById('upload-area');
    const input = document.getElementById('upload-input');
    const prev = document.getElementById('uploaded-preview');
    const rm = document.getElementById('remove-upload');
    area.addEventListener('dragover', function(e){e.preventDefault();this.classList.add('dragover');});
    area.addEventListener('dragleave', function(){this.classList.remove('dragover');});
    area.addEventListener('drop', function(e){e.preventDefault();this.classList.remove('dragover');if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);});
    input.addEventListener('change', function(){if(this.files[0])handleFile(this.files[0]); this.value='';});
    rm.addEventListener('click', function(){
      state.customArt.file=null;state.customArt.dataUrl=null;
      prev.classList.remove('show');area.style.display='';
      document.getElementById('art-position-section').style.display='none';
      artDecalMesh = removeDecal(artDecalMesh);
    });
  }
  function handleFile(f) {
    if(f.size>10*1024*1024){alert('Máx 10MB');return;}
    if(!['image/png','image/jpeg','image/svg+xml'].includes(f.type)){alert('Use PNG, JPG ou SVG');return;}
    state.customArt.file=f;
    const r=new FileReader();
    r.onload=function(e){
      state.customArt.dataUrl=e.target.result;
      document.getElementById('preview-thumb').src=e.target.result;
      document.getElementById('preview-name').textContent=f.name;
      document.getElementById('preview-size').textContent=(f.size/1048576).toFixed(1)+' MB';
      document.getElementById('uploaded-preview').classList.add('show');
      document.getElementById('upload-area').style.display='none';
      document.getElementById('art-position-section').style.display='block';
      applyArtDecal();
    };
    r.readAsDataURL(f);
  }

  // ============ ORDER ============
  function submitOrder() {
    const name=document.getElementById('order-name').value.trim();
    const phone=document.getElementById('order-phone').value.trim();
    const ig=document.getElementById('order-instagram').value.trim();
    if(!name||!phone){alert('Preencha nome e WhatsApp.');return;}
    state.customer={name,phone,instagram:ig};
    const id='VLT-'+Date.now().toString(36).toUpperCase();
    const data={id,date:new Date().toISOString(),customer:state.customer,price:calculatePrice(),
      mockup:{color:state.color,size:state.size,customArt:{hasArt:!!state.customArt.dataUrl,fileName:state.customArt.file?state.customArt.file.name:null},text:{...state.text}},
      status:'novo',screenshot:renderer.domElement.toDataURL('image/png')};
    let orders=JSON.parse(localStorage.getItem('vulto_mockup_orders')||'[]');
    orders.push(data);localStorage.setItem('vulto_mockup_orders',JSON.stringify(orders));
    fetch('../api/mockup-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(function(){});
    document.getElementById('order-modal').classList.remove('open');
    document.getElementById('order-id-display').textContent='#'+id;
    document.getElementById('success-modal').classList.add('open');
  }

  function onResize(){
    const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;
    camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
  }

  // ============ INIT ============
  document.addEventListener('DOMContentLoaded', function(){
    initScene(); initUI(); calculatePrice();
  });
  const navToggle=document.getElementById('nav-toggle');
  if(navToggle)navToggle.addEventListener('click',function(){this.classList.toggle('active');});

})();
