// PUBLICA AFFAIRES — INDEX (sin terciopelo)
// Cambia los nombres de las obras y archivos aquí:
const projects = [
  { title: 'El origen', image: 'assets/origen.jpg' },
  { title: 'Liet Launch', image: 'assets/liet.jpg' },
  { title: 'Sand and Solace', image: 'assets/sand.jpg' },
  { title: 'Dune', image: 'assets/dune.jpg' }
];

// 1. PORTADA — solamente revela la fotografía. No controla la cámara.
const hero = document.querySelector('.hero');
const photo = document.getElementById('heroPhoto');
const cursorWord = document.getElementById('cursorWord');
const heroLogo = document.getElementById('heroLogo');
let lightX = 50, lightY = 50, targetX = 50, targetY = 50;
let overHero = false;
let frame = 0;
function renderLight() {
  lightX += (targetX - lightX) * .19;
  lightY += (targetY - lightY) * .19;
  const radius = Math.min(250, Math.max(135, window.innerWidth * .12));
  const mask = `radial-gradient(circle ${radius}px at ${lightX}% ${lightY}%, black 0%, black 28%, rgba(0,0,0,.65) 62%, transparent 100%)`;
  photo.style.maskImage = mask;
  photo.style.webkitMaskImage = mask;
  cursorWord.style.left = lightX + '%';
  cursorWord.style.top = lightY + '%';
  frame = requestAnimationFrame(renderLight);
}
frame = requestAnimationFrame(renderLight);
hero.addEventListener('pointermove', (e) => {
  const r = hero.getBoundingClientRect();
  targetX = ((e.clientX - r.left) / r.width) * 100;
  targetY = ((e.clientY - r.top) / r.height) * 100;
  overHero = true;
});
hero.addEventListener('pointerleave', () => { overHero = false; cursorWord.style.opacity = '0'; });
setInterval(() => { if (overHero) cursorWord.style.opacity = cursorWord.style.opacity === '1' ? '0' : '1'; }, 2300);
const logoFilters = [
  'brightness(0) invert(1)',
  'brightness(0) saturate(100%) invert(73%) sepia(13%) saturate(588%) hue-rotate(175deg)',
  'brightness(0) saturate(100%) invert(74%) sepia(18%) saturate(304%) hue-rotate(336deg)'
];
let logoColor = 0;
setInterval(() => { heroLogo.style.filter = logoFilters[++logoColor % logoFilters.length]; }, 3200);

// 2. VISTA AMPLIADA — disponible en modo 3D o de respaldo.
const modal = document.getElementById('projectModal');
const modalImage = document.getElementById('modalImage');
const modalCaption = document.getElementById('modalCaption');
function showProject(index) {
  const p = projects[index];
  if (!p) return;
  modalImage.src = p.image;
  modalImage.alt = p.title;
  modalCaption.textContent = p.title;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeProject() { modal.hidden = true; document.body.style.overflow = ''; }
document.getElementById('modalClose').addEventListener('click', closeProject);
modal.addEventListener('click', e => { if (e.target === modal) closeProject(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProject(); });
document.querySelectorAll('[data-project]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); showProject(Number(a.dataset.project));
}));
document.querySelectorAll('[data-inactive]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

// 3. GALERÍA — Three.js usa su propio mouse y su propio scroll.
// Si Three.js no se puede descargar, las 4 imágenes seguirán visibles en la galería de respaldo.
async function startGallery() {
  const container = document.getElementById('galleryView');
  const fallback = document.getElementById('galleryFallback');
  const section = document.getElementById('galeria');
  let THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
  } catch (err) {
    console.warn('Three.js no se pudo cargar. Se muestra la galería alternativa.', err);
    return;
  }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false }); }
  catch (err) { console.warn('WebGL no disponible', err); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);
  fallback.style.display = 'none';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1a1010');
  const camera = new THREE.PerspectiveCamera(60,container.clientWidth/container.clientHeight,.1,60);
  const wall = new THREE.MeshStandardMaterial({color:'#3a2422',roughness:1,side:THREE.DoubleSide});
  const floor = new THREE.MeshStandardMaterial({color:'#090f76',roughness:.88,side:THREE.DoubleSide});
  const makePlane=(w,h,material,x,y,z,ry=0,rx=0)=> {
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);
    mesh.position.set(x,y,z); mesh.rotation.y=ry; mesh.rotation.x=rx; scene.add(mesh); return mesh;
  };
  // Habitación real: profundidad 14, ancho 12, alto 6. Paredes café lisas y piso azul.
  makePlane(12,6,wall,0,3,-8);
  makePlane(14,6,wall,-6,3,-1,Math.PI/2);
  makePlane(14,6,wall,6,3,-1,-Math.PI/2);
  makePlane(12,14,floor,0,0,-1,0,-Math.PI/2);
  makePlane(12,14,wall,0,6,-1,0,Math.PI/2);
  scene.add(new THREE.AmbientLight(0xffffff,1.45));
  const spot = new THREE.SpotLight(0xffe3c9,100,24,Math.PI/5,.65,1);
  spot.position.set(0,5,4); scene.add(spot); scene.add(spot.target);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(0,0);
  let lookX=0, lookY=0, scrollProgress=0;
  const artMeshes=[];
  const loader=new THREE.TextureLoader();
  const placements=[
    {position:[-1.65,3,-7.88],rotation:0,height:2.65},
    {position:[1.65,3,-7.88],rotation:0,height:2.65},
    {position:[-5.89,3,-2.0],rotation:Math.PI/2,height:2.6},
    {position:[5.89,3,-2.0],rotation:-Math.PI/2,height:2.6}
  ];
  projects.forEach((p,i)=> {
    loader.load(p.image, texture => {
      texture.colorSpace=THREE.SRGBColorSpace;
      const aspect=texture.image.width / texture.image.height;
      const place=placements[i];
      const art=new THREE.Mesh(
        new THREE.PlaneGeometry(place.height*aspect, place.height),
        new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide})
      );
      art.position.set(...place.position);
      art.rotation.y=place.rotation;
      art.userData.project=i;
      scene.add(art); artMeshes.push(art);
    }, undefined, err => console.warn('No se encontró:', p.image, err));
  });
  const updateScroll = () => {
    const rect=section.getBoundingClientRect();
    scrollProgress=Math.max(0,Math.min(1,-rect.top/Math.max(1,section.offsetHeight-innerHeight)));
  };
  window.addEventListener('scroll',updateScroll,{passive:true});updateScroll();
  container.addEventListener('pointermove',e=> {
    const r=container.getBoundingClientRect();
    pointer.x=((e.clientX-r.left)/r.width)*2-1;
    pointer.y=-((e.clientY-r.top)/r.height)*2+1;
    lookX=pointer.x; lookY=pointer.y;
  });
  container.addEventListener('click',()=>{
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(artMeshes);
    if(hits.length) showProject(hits[0].object.userData.project);
  });
  const resize=()=>{
    if(!container.clientWidth||!container.clientHeight)return;
    camera.aspect=container.clientWidth/container.clientHeight;
    camera.updateProjectionMatrix();renderer.setSize(container.clientWidth,container.clientHeight);
  };
  window.addEventListener('resize',resize);
  let t=0;
  function animate(){
    requestAnimationFrame(animate);t+=.015;
    const desiredZ=5.5-scrollProgress*8.6;
    camera.position.z+=(desiredZ-camera.position.z)*.055;
    camera.position.y+=(2.7+lookY*.4-camera.position.y)*.055;
    camera.position.x+=(lookX*.65-camera.position.x)*.055;
    const focal=new THREE.Vector3(lookX*1.25,2.6+lookY*.65,-7);
    camera.lookAt(focal);
    spot.position.set(camera.position.x,camera.position.y+2,camera.position.z+.6);
    spot.target.position.set(lookX*3,2.7+lookY,-7);
    renderer.render(scene,camera);
  }
  camera.position.set(0,2.7,5.5);animate();
}
startGallery();
