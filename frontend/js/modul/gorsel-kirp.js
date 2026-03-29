/**
 * Görsel Kırpma (Crop) Modülü
 * cropperjs v1 kullanır — avatar ve kasa logosu için
 */
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

let _cropper = null;
let _callback = null;
let _dairesel = false;

export function gorselKirpKur() {
  // Modal oluştur ve body'e ekle
  const modal = document.createElement('div');
  modal.id = 'kirp-modal';
  modal.className = 'fixed inset-0 z-[200] hidden flex-col items-center justify-center p-4';
  modal.style.background = 'rgba(0,0,0,0.85)';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl overflow-hidden w-full max-w-xs shadow-2xl flex flex-col">
      <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p class="font-bold text-sm text-gray-900">Görseli Ayarla</p>
          <p class="text-xs text-gray-400">Sürükle • Sıkıştır/aç</p>
        </div>
        <div class="flex items-center gap-1">
          <button id="kirp-zoom-out" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button id="kirp-zoom-in" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button id="kirp-dondur" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
          </button>
        </div>
      </div>
      <div id="kirp-alani" class="relative bg-black overflow-hidden" style="height:280px;touch-action:none">
        <img id="kirp-gorsel" style="display:block;max-width:100%">
      </div>
      <div class="px-4 py-3 flex gap-3">
        <button id="kirp-iptal" class="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">Vazgeç</button>
        <button id="kirp-onayla" class="flex-1 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-dark transition">Uygula</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Zoom in/out
  document.getElementById('kirp-zoom-in').addEventListener('click', () => {
    _cropper?.zoom(0.1);
  });
  document.getElementById('kirp-zoom-out').addEventListener('click', () => {
    _cropper?.zoom(-0.1);
  });

  // Döndür
  document.getElementById('kirp-dondur').addEventListener('click', () => {
    _cropper?.rotate(90);
  });

  // İptal
  document.getElementById('kirp-iptal').addEventListener('click', _kapat);

  // Onayla → canvas'ı blob'a çevir → callback
  document.getElementById('kirp-onayla').addEventListener('click', () => {
    if (!_cropper) return;
    const btn = document.getElementById('kirp-onayla');
    btn.disabled = true;
    btn.textContent = '...';

    _cropper.getCroppedCanvas({
      width: 480,
      height: 480,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    }).toBlob((blob) => {
      const file = new File([blob], 'gorsel.jpg', { type: 'image/jpeg' });
      _kapat();
      if (_callback) _callback(file);
    }, 'image/jpeg', 0.88);
  });

  // Backdrop tıkla → kapat
  modal.addEventListener('click', (e) => {
    if (e.target === modal) _kapat();
  });
}

function _kapat() {
  if (_cropper) { _cropper.destroy(); _cropper = null; }
  const modal = document.getElementById('kirp-modal');
  if (modal) {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
  }
  const btn = document.getElementById('kirp-onayla');
  if (btn) { btn.disabled = false; btn.textContent = 'Uygula'; }
}

/**
 * Dosya seçildiğinde crop modalını aç.
 * @param {File} file - Seçilen resim dosyası
 * @param {boolean} dairesel - true → daire overlay (avatar için)
 * @param {function} callback - (kroppedFile: File) => void
 */
export function gorselKirpAc(file, dairesel, callback) {
  _callback = callback;
  _dairesel = dairesel;

  const reader = new FileReader();
  reader.onload = (e) => {
    const modal = document.getElementById('kirp-modal');
    const img = document.getElementById('kirp-gorsel');
    if (!modal || !img) return;

    img.src = e.target.result;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Eski cropper varsa yok et
    if (_cropper) { _cropper.destroy(); _cropper = null; }

    img.onload = () => {
      _cropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.85,
        restore: false,
        guides: false,
        center: false,
        highlight: false,
        cropBoxMovable: false,
        cropBoxResizable: false,
        toggleDragModeOnDblclick: false,
        ready() {
          if (dairesel) {
            // Daire overlay
            const viewBox = this.cropper.viewBox;
            const face = this.cropper.cropBox.querySelector('.cropper-face');
            if (viewBox) viewBox.style.borderRadius = '50%';
            if (face) face.style.borderRadius = '50%';
          }
        }
      });
    };
    // img.src zaten set edildi, onload'ı tetikle
    if (img.complete) img.onload();
  };
  reader.readAsDataURL(file);
}
