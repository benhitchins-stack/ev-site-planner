/* @ds-bundle: {"format":3,"namespace":"EVInfrastructureToolsDesignSystem_7296fd","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"StatTile","sourcePath":"components/data/StatTile.jsx"},{"name":"StatusBadge","sourcePath":"components/data/StatusBadge.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"MapLegend","sourcePath":"components/map/MapLegend.jsx"},{"name":"MapMarker","sourcePath":"components/map/MapMarker.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"assets/image-slot.js":"9309434cb09c","components/core/Badge.jsx":"fda0cded2b8b","components/core/Button.jsx":"008c4ba9e95b","components/core/Card.jsx":"bb8a5caaf180","components/core/IconButton.jsx":"f3def323d83b","components/data/StatTile.jsx":"3a5f24e34c7f","components/data/StatusBadge.jsx":"fa17fe5879a6","components/forms/Checkbox.jsx":"df2dd6823b21","components/forms/Input.jsx":"a2361434c92d","components/forms/Select.jsx":"404b1b1546e2","components/forms/Switch.jsx":"3bbdc9c98991","components/map/MapLegend.jsx":"8b7c6d73dd03","components/map/MapMarker.jsx":"ef8f6ac91066","components/navigation/Sidebar.jsx":"4ed95dcd4d16","components/navigation/Tabs.jsx":"8f79bec49b4a","ui_kits/dashboard/Dashboard.jsx":"c28278833426","ui_kits/markup-tool/MarkupTool.jsx":"44c09dfe1c60","ui_kits/mobile/MobileApp.jsx":"87829f27986b","ui_kits/mobile/ios-frame.jsx":"be3343be4b51","ui_kits/site-map/SiteMap.jsx":"802c8ecf16e1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.EVInfrastructureToolsDesignSystem_7296fd = window.EVInfrastructureToolsDesignSystem_7296fd || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/image-slot.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet = ':host{display:inline-block;position:relative;vertical-align:top;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' + '  cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .spill{display:block}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' + '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' + '  transition:border-color .12s}' + ':host([data-over]) .ring{border-color:#c96442}' + ':host([data-filled]) .ring{display:none}' +
  // Controls sit BELOW the mask (top:100%), absolutely positioned so the
  // author-declared slot height is unaffected. The gap is padding, not a
  // top offset, so the hover target stays contiguous with the frame.
  '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }
    constructor() {
      super();
      const root = this.attachShadow({
        mode: 'open'
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="ring" part="ring"></div>' + '</div>' + '<div class="spill">' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' + '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="clear" title="Remove image">Remove</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') {
          this._exitReframe(true);
          this._input.click();
        }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null);else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }
    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') && (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return {
        iw,
        ih,
        fw,
        fh,
        base: Math.max(fw / iw, fh / ih)
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w;
      this._spill.style.height = h;
      this._spill.style.left = l;
      this._spill.style.top = t;
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/image-slot.js", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-sans); font-weight: var(--fw-semibold);
  font-size: var(--text-xs); line-height: 1;
  padding: 4px 9px; border-radius: var(--radius-full);
  border: var(--border-width) solid transparent; white-space: nowrap;
}
.sm-badge--md { font-size: var(--text-sm); padding: 5px 11px; }
.sm-badge__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; }
.sm-badge__icon { display: inline-flex; }
.sm-badge__icon svg { width: 13px; height: 13px; display: block; }

/* soft (default) */
.sm-badge--soft.sm-badge--neutral { background: var(--ink-100); color: var(--ink-700); }
.sm-badge--soft.sm-badge--accent    { background: var(--accent-50); color: var(--accent-800); }
.sm-badge--soft.sm-badge--success { background: var(--color-success-bg); color: var(--color-success); }
.sm-badge--soft.sm-badge--warning { background: var(--color-warning-bg); color: var(--color-warning); }
.sm-badge--soft.sm-badge--danger  { background: var(--color-danger-bg); color: var(--color-danger); }
.sm-badge--soft.sm-badge--info    { background: var(--color-info-bg); color: var(--color-info); }
.sm-badge--soft.sm-badge--signal  { background: var(--signal-soft); color: var(--orange-700); }

/* solid */
.sm-badge--solid.sm-badge--neutral { background: var(--ink-900); color: var(--ink-50); }
.sm-badge--solid.sm-badge--accent    { background: var(--accent); color: var(--accent-contrast); }
.sm-badge--solid.sm-badge--success { background: var(--color-success); color: #fff; }
.sm-badge--solid.sm-badge--warning { background: var(--amber-500); color: var(--ink-900); }
.sm-badge--solid.sm-badge--danger  { background: var(--color-danger); color: #fff; }
.sm-badge--solid.sm-badge--info    { background: var(--color-info); color: #fff; }
.sm-badge--solid.sm-badge--signal  { background: var(--signal); color: #fff; }

/* outline */
.sm-badge--outline { background: transparent; }
.sm-badge--outline.sm-badge--neutral { border-color: var(--color-border-strong); color: var(--ink-700); }
.sm-badge--outline.sm-badge--accent    { border-color: var(--accent-600); color: var(--accent-800); }
.sm-badge--outline.sm-badge--success { border-color: var(--green-500); color: var(--color-success); }
.sm-badge--outline.sm-badge--warning { border-color: var(--amber-500); color: var(--color-warning); }
.sm-badge--outline.sm-badge--danger  { border-color: var(--red-500); color: var(--color-danger); }
.sm-badge--outline.sm-badge--info    { border-color: var(--blue-500); color: var(--color-info); }
.sm-badge--outline.sm-badge--signal  { border-color: var(--orange-400); color: var(--orange-700); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/**
 * Compact status / category label.
 */
function Badge({
  tone = "neutral",
  appearance = "soft",
  size = "sm",
  dot = false,
  icon,
  className = "",
  children,
  ...rest
}) {
  inject("sm-badge-styles", CSS);
  const classes = ["sm-badge", `sm-badge--${appearance}`, `sm-badge--${tone}`, `sm-badge--${size}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: classes
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    className: "sm-badge__dot"
  }) : null, icon ? /*#__PURE__*/React.createElement("span", {
    className: "sm-badge__icon"
  }, icon) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-btn {
  --_h: var(--control-height-md);
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: var(--_h); padding: 0 var(--control-pad-x);
  font-family: var(--font-sans); font-weight: var(--fw-semibold); font-size: var(--text-sm);
  line-height: 1; border-radius: var(--radius-md);
  border: var(--border-width) solid transparent;
  cursor: pointer; white-space: nowrap; text-decoration: none; user-select: none;
  transition: background var(--duration-fast) var(--ease-standard),
              transform var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard),
              border-color var(--duration-fast) var(--ease-standard);
}
.sm-btn:active { transform: translateY(1px); }
.sm-btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.sm-btn[disabled], .sm-btn[aria-disabled="true"] { opacity: .45; cursor: not-allowed; pointer-events: none; }
.sm-btn--sm { --_h: var(--control-height-sm); font-size: var(--text-xs); padding: 0 12px; gap: 6px; }
.sm-btn--lg { --_h: var(--control-height-lg); font-size: var(--text-base); padding: 0 22px; }
.sm-btn--block { width: 100%; }
.sm-btn__icon { display: inline-flex; flex: none; }
.sm-btn__icon svg { width: 1.05em; height: 1.05em; display: block; }

.sm-btn--primary { background: var(--accent); color: var(--accent-contrast); }
.sm-btn--primary:hover { background: var(--accent-hover); box-shadow: var(--shadow-accent-lg); }
.sm-btn--primary:active { background: var(--accent-press); box-shadow: none; }

.sm-btn--secondary { background: var(--ink-900); color: var(--text-on-ink); }
.sm-btn--secondary:hover { background: var(--ink-800); }

.sm-btn--outline { background: transparent; color: var(--text-primary); border-color: var(--color-border-strong); }
.sm-btn--outline:hover { background: var(--ink-50); border-color: var(--ink-400); }

.sm-btn--ghost { background: transparent; color: var(--text-primary); }
.sm-btn--ghost:hover { background: var(--ink-100); }

.sm-btn--signal { background: var(--signal); color: var(--signal-contrast); }
.sm-btn--signal:hover { background: var(--signal-hover); }

.sm-btn--danger { background: var(--color-danger); color: #fff; }
.sm-btn--danger:hover { background: var(--red-700); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/**
 * Sitemark primary action button.
 */
function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth = false,
  as = "button",
  className = "",
  children,
  ...rest
}) {
  inject("sm-btn-styles", CSS);
  const Tag = as;
  const classes = ["sm-btn", `sm-btn--${variant}`, size !== "md" ? `sm-btn--${size}` : "", fullWidth ? "sm-btn--block" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: classes
  }, rest), leftIcon ? /*#__PURE__*/React.createElement("span", {
    className: "sm-btn__icon"
  }, leftIcon) : null, children ? /*#__PURE__*/React.createElement("span", null, children) : null, rightIcon ? /*#__PURE__*/React.createElement("span", {
    className: "sm-btn__icon"
  }, rightIcon) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-card {
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex; flex-direction: column;
}
.sm-card--flat { box-shadow: none; }
.sm-card--ink { background: var(--color-surface-ink); border-color: var(--color-border-ink); color: var(--text-on-ink); }
.sm-card--interactive { cursor: pointer; transition: box-shadow var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard), border-color var(--duration-base) var(--ease-standard); }
.sm-card--interactive:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); border-color: var(--color-border-strong); }
.sm-card--interactive:focus-visible { outline: none; box-shadow: var(--focus-ring); }

.sm-card__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: var(--space-5) var(--space-5) 0;
}
.sm-card__titles { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.sm-card__eyebrow {
  font-family: var(--label-font); font-weight: var(--label-weight);
  font-size: var(--label-size); letter-spacing: var(--label-spacing);
  text-transform: uppercase; color: var(--text-muted);
}
.sm-card__title { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: var(--text-lg); letter-spacing: var(--tracking-tight); color: inherit; }
.sm-card__actions { display: flex; align-items: center; gap: 6px; flex: none; }
.sm-card__body { padding: var(--space-5); }
.sm-card__body--tight { padding: var(--space-4); }
.sm-card__body--none { padding: 0; }
.sm-card__foot {
  padding: var(--space-4) var(--space-5);
  border-top: var(--border-width) solid var(--color-divider);
  display: flex; align-items: center; gap: 10px;
  background: var(--color-surface-2);
}
.sm-card--ink .sm-card__foot { background: var(--color-surface-ink-2); border-color: var(--color-border-ink); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/**
 * Surface container with optional header (eyebrow / title / actions) and footer.
 */
function Card({
  eyebrow,
  title,
  actions,
  footer,
  appearance = "default",
  interactive = false,
  padding = "default",
  className = "",
  children,
  ...rest
}) {
  inject("sm-card-styles", CSS);
  const classes = ["sm-card", appearance === "flat" ? "sm-card--flat" : "", appearance === "ink" ? "sm-card--ink" : "", interactive ? "sm-card--interactive" : "", className].filter(Boolean).join(" ");
  const hasHead = eyebrow || title || actions;
  const bodyClass = "sm-card__body" + (padding === "tight" ? " sm-card__body--tight" : padding === "none" ? " sm-card__body--none" : "");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: classes,
    tabIndex: interactive ? 0 : undefined
  }, rest), hasHead ? /*#__PURE__*/React.createElement("div", {
    className: "sm-card__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sm-card__titles"
  }, eyebrow ? /*#__PURE__*/React.createElement("span", {
    className: "sm-card__eyebrow"
  }, eyebrow) : null, title ? /*#__PURE__*/React.createElement("span", {
    className: "sm-card__title"
  }, title) : null), actions ? /*#__PURE__*/React.createElement("div", {
    className: "sm-card__actions"
  }, actions) : null) : null, children != null ? /*#__PURE__*/React.createElement("div", {
    className: bodyClass
  }, children) : null, footer ? /*#__PURE__*/React.createElement("div", {
    className: "sm-card__foot"
  }, footer) : null);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-iconbtn {
  --_s: 40px;
  display: inline-flex; align-items: center; justify-content: center;
  width: var(--_s); height: var(--_s); padding: 0;
  border-radius: var(--radius-md); border: var(--border-width) solid transparent;
  background: transparent; color: var(--text-secondary); cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard),
              color var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard),
              border-color var(--duration-fast) var(--ease-standard);
}
.sm-iconbtn svg { width: 20px; height: 20px; display: block; }
.sm-iconbtn:hover { background: var(--ink-100); color: var(--text-primary); }
.sm-iconbtn:active { transform: translateY(1px); }
.sm-iconbtn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.sm-iconbtn[disabled], .sm-iconbtn[aria-disabled="true"] { opacity: .4; cursor: not-allowed; pointer-events: none; }
.sm-iconbtn--sm { --_s: 32px; }
.sm-iconbtn--sm svg { width: 17px; height: 17px; }
.sm-iconbtn--lg { --_s: 48px; }
.sm-iconbtn--lg svg { width: 22px; height: 22px; }

.sm-iconbtn--solid { background: var(--accent); color: var(--accent-contrast); }
.sm-iconbtn--solid:hover { background: var(--accent-hover); color: var(--accent-contrast); }
.sm-iconbtn--outline { border-color: var(--color-border-strong); color: var(--text-primary); }
.sm-iconbtn--outline:hover { background: var(--ink-50); border-color: var(--ink-400); }

/* on dark chrome (toolbars, sidebars) */
.sm-iconbtn--onink { color: var(--ink-400); }
.sm-iconbtn--onink:hover { background: var(--ink-800); color: var(--ink-50); }
.sm-iconbtn--onink.sm-iconbtn--active { background: var(--ink-800); color: var(--accent); }

.sm-iconbtn--active { background: var(--accent-soft); color: var(--accent-strong); }
.sm-iconbtn--active:hover { background: var(--accent-soft); color: var(--accent-strong); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/**
 * Square icon-only button. `label` is required for accessibility.
 */
function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  active = false,
  onInk = false,
  className = "",
  ...rest
}) {
  inject("sm-iconbtn-styles", CSS);
  const classes = ["sm-iconbtn", variant !== "ghost" ? `sm-iconbtn--${variant}` : "", size !== "md" ? `sm-iconbtn--${size}` : "", onInk ? "sm-iconbtn--onink" : "", active ? "sm-iconbtn--active" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: classes,
    "aria-label": label,
    "aria-pressed": active || undefined
  }, rest), icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/StatTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-stat {
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg); padding: var(--space-5);
  display: flex; flex-direction: column; gap: 10px; min-width: 0;
}
.sm-stat--ink { background: var(--color-surface-ink); border-color: var(--color-border-ink); }
.sm-stat__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.sm-stat__label { font-family: var(--label-font); font-size: var(--label-size); letter-spacing: var(--label-spacing); text-transform: uppercase; color: var(--text-muted); }
.sm-stat--ink .sm-stat__label { color: var(--ink-400); }
.sm-stat__icon { width: 30px; height: 30px; border-radius: var(--radius-sm); display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-strong); flex: none; }
.sm-stat__icon svg { width: 17px; height: 17px; }
.sm-stat--ink .sm-stat__icon { background: var(--ink-800); color: var(--accent); }
.sm-stat__value { font-family: var(--font-mono); font-weight: var(--fw-semibold); font-size: var(--text-3xl); letter-spacing: var(--tracking-tight); color: var(--text-primary); line-height: 1; display: flex; align-items: baseline; gap: 5px; }
.sm-stat--ink .sm-stat__value { color: #fff; }
.sm-stat__unit { font-size: var(--text-base); color: var(--text-muted); font-weight: var(--fw-medium); }
.sm-stat__foot { display: flex; align-items: center; gap: 8px; }
.sm-stat__delta { display: inline-flex; align-items: center; gap: 3px; font-family: var(--font-mono); font-size: var(--text-xs); font-weight: var(--fw-semibold); padding: 2px 6px; border-radius: var(--radius-full); }
.sm-stat__delta svg { width: 12px; height: 12px; }
.sm-stat__delta--up { color: var(--color-success); background: var(--color-success-bg); }
.sm-stat__delta--down { color: var(--color-danger); background: var(--color-danger-bg); }
.sm-stat__delta--flat { color: var(--text-muted); background: var(--ink-100); }
.sm-stat__sub { font-size: var(--text-xs); color: var(--text-muted); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
const Arrow = ({
  dir
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "3",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, dir === "up" ? /*#__PURE__*/React.createElement("polyline", {
  points: "6 15 12 9 18 15"
}) : dir === "down" ? /*#__PURE__*/React.createElement("polyline", {
  points: "6 9 12 15 18 9"
}) : /*#__PURE__*/React.createElement("line", {
  x1: "5",
  y1: "12",
  x2: "19",
  y2: "12"
}));

/**
 * KPI / metric tile — label, large mono value, optional delta + subtext.
 */
function StatTile({
  label,
  value,
  unit,
  icon,
  delta,
  trend = "up",
  sub,
  appearance = "default",
  className = "",
  ...rest
}) {
  inject("sm-stat-styles", CSS);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["sm-stat", appearance === "ink" ? "sm-stat--ink" : "", className].filter(Boolean).join(" ")
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "sm-stat__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sm-stat__label"
  }, label), icon ? /*#__PURE__*/React.createElement("span", {
    className: "sm-stat__icon"
  }, icon) : null), /*#__PURE__*/React.createElement("div", {
    className: "sm-stat__value"
  }, value, unit ? /*#__PURE__*/React.createElement("span", {
    className: "sm-stat__unit"
  }, unit) : null), delta != null || sub ? /*#__PURE__*/React.createElement("div", {
    className: "sm-stat__foot"
  }, delta != null ? /*#__PURE__*/React.createElement("span", {
    className: `sm-stat__delta sm-stat__delta--${trend}`
  }, /*#__PURE__*/React.createElement(Arrow, {
    dir: trend
  }), delta) : null, sub ? /*#__PURE__*/React.createElement("span", {
    className: "sm-stat__sub"
  }, sub) : null) : null);
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/data/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const STATUS = {
  charging: {
    label: "Charging",
    fg: "var(--status-charging)",
    bg: "var(--status-charging-bg)",
    dot: "var(--green-500)"
  },
  idle: {
    label: "Idle",
    fg: "var(--status-idle)",
    bg: "var(--status-idle-bg)",
    dot: "var(--amber-500)"
  },
  fault: {
    label: "Fault",
    fg: "var(--status-fault)",
    bg: "var(--status-fault-bg)",
    dot: "var(--red-500)"
  },
  installed: {
    label: "Installed",
    fg: "var(--status-installed)",
    bg: "var(--status-installed-bg)",
    dot: "var(--ink-900)"
  },
  offline: {
    label: "Offline",
    fg: "var(--ink-600)",
    bg: "var(--ink-100)",
    dot: "var(--ink-400)"
  },
  planned: {
    label: "Planned",
    fg: "var(--color-info)",
    bg: "var(--color-info-bg)",
    dot: "var(--blue-500)"
  }
};
const CSS = `
.sm-status {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-sans); font-weight: var(--fw-semibold); font-size: var(--text-xs);
  line-height: 1; padding: 4px 9px 4px 8px; border-radius: var(--radius-full); white-space: nowrap;
}
.sm-status--md { font-size: var(--text-sm); padding: 5px 11px 5px 9px; }
.sm-status__dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.sm-status--pulse .sm-status__dot { animation: sm-status-pulse 1.6s var(--ease-standard) infinite; }
@keyframes sm-status-pulse { 0%,100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; } 50% { box-shadow: 0 0 0 4px transparent; opacity: .55; } }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/**
 * Equipment status pill — fixed set tuned to the EV domain.
 */
function StatusBadge({
  status = "installed",
  size = "sm",
  pulse = false,
  label,
  className = "",
  ...rest
}) {
  inject("sm-status-styles", CSS);
  const s = STATUS[status] || STATUS.installed;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["sm-status", `sm-status--${size}`, pulse ? "sm-status--pulse" : "", className].filter(Boolean).join(" "),
    style: {
      color: s.fg,
      background: s.bg
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "sm-status__dot",
    style: {
      background: s.dot,
      color: s.dot
    }
  }), label || s.label);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-check { display: inline-flex; align-items: flex-start; gap: 10px; cursor: pointer; font-family: var(--font-sans); }
.sm-check--disabled { opacity: .5; cursor: not-allowed; }
.sm-check input { position: absolute; opacity: 0; width: 0; height: 0; }
.sm-check__box {
  width: 20px; height: 20px; flex: none; margin-top: 1px;
  border: var(--border-width-2) solid var(--color-border-strong);
  border-radius: var(--radius-sm); background: var(--color-surface);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--accent-contrast);
  transition: background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
.sm-check__box svg { width: 14px; height: 14px; opacity: 0; transform: scale(.6); transition: opacity var(--duration-fast), transform var(--duration-fast); }
.sm-check:hover .sm-check__box { border-color: var(--ink-500); }
.sm-check input:checked + .sm-check__box { background: var(--accent); border-color: var(--accent); }
.sm-check input:checked + .sm-check__box svg { opacity: 1; transform: scale(1); }
.sm-check input:focus-visible + .sm-check__box { box-shadow: var(--focus-ring); }
.sm-check__text { display: flex; flex-direction: column; gap: 2px; }
.sm-check__label { font-size: var(--text-sm); font-weight: var(--fw-medium); color: var(--text-primary); line-height: 1.35; }
.sm-check__desc { font-size: var(--text-xs); color: var(--text-muted); }

/* radio variant */
.sm-check--radio .sm-check__box { border-radius: var(--radius-full); }
.sm-check--radio .sm-check__dot { width: 9px; height: 9px; border-radius: 50%; background: var(--accent-contrast); opacity: 0; transform: scale(.4); transition: opacity var(--duration-fast), transform var(--duration-fast); }
.sm-check--radio input:checked + .sm-check__box { background: var(--accent); border-color: var(--accent); }
.sm-check--radio input:checked + .sm-check__box .sm-check__dot { opacity: 1; transform: scale(1); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
const Tick = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "3.4",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("polyline", {
  points: "20 6 9 17 4 12"
}));

/**
 * Checkbox (or radio when type="radio") with label + optional description.
 */
function Checkbox({
  label,
  description,
  type = "checkbox",
  disabled = false,
  className = "",
  ...rest
}) {
  inject("sm-check-styles", CSS);
  const isRadio = type === "radio";
  const classes = ["sm-check", isRadio ? "sm-check--radio" : "", disabled ? "sm-check--disabled" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("label", {
    className: classes
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sm-check__box"
  }, isRadio ? /*#__PURE__*/React.createElement("span", {
    className: "sm-check__dot"
  }) : /*#__PURE__*/React.createElement(Tick, null)), label || description ? /*#__PURE__*/React.createElement("span", {
    className: "sm-check__text"
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "sm-check__label"
  }, label) : null, description ? /*#__PURE__*/React.createElement("span", {
    className: "sm-check__desc"
  }, description) : null) : null);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-field { display: flex; flex-direction: column; gap: 6px; }
.sm-field__label { font-family: var(--font-sans); font-weight: var(--fw-semibold); font-size: var(--text-sm); color: var(--text-primary); }
.sm-field__label .sm-req { color: var(--color-danger); margin-left: 2px; }
.sm-field__hint { font-size: var(--text-xs); color: var(--text-muted); }
.sm-field__error { font-size: var(--text-xs); color: var(--color-danger); display: flex; align-items: center; gap: 4px; }

.sm-input {
  --_h: var(--control-height-md);
  display: flex; align-items: center; gap: 8px;
  height: var(--_h); padding: 0 12px;
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border-strong);
  border-radius: var(--radius-md);
  transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard);
}
.sm-input:hover { border-color: var(--ink-400); }
.sm-input:focus-within { border-color: var(--ink-900); box-shadow: var(--focus-ring); }
.sm-input--sm { --_h: var(--control-height-sm); }
.sm-input--lg { --_h: var(--control-height-lg); }
.sm-input--error { border-color: var(--color-danger); }
.sm-input--error:focus-within { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--color-danger); }
.sm-input--disabled { background: var(--ink-100); border-color: var(--color-border); pointer-events: none; opacity: .7; }
.sm-input__icon { display: inline-flex; color: var(--text-muted); flex: none; }
.sm-input__icon svg { width: 17px; height: 17px; display: block; }
.sm-input__addon { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-muted); flex: none; }
.sm-input input {
  flex: 1; min-width: 0; border: none; outline: none; background: transparent;
  font-family: var(--font-sans); font-size: var(--text-sm); color: var(--text-primary);
}
.sm-input input::placeholder { color: var(--text-disabled); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/**
 * Text input with optional label, hint, error, icon and addon.
 */
function Input({
  label,
  hint,
  error,
  required = false,
  size = "md",
  leftIcon,
  addon,
  disabled = false,
  className = "",
  id,
  ...rest
}) {
  inject("sm-input-styles", CSS);
  const inputId = id || (label ? "sm-in-" + Math.random().toString(36).slice(2, 8) : undefined);
  const boxClasses = ["sm-input", size !== "md" ? `sm-input--${size}` : "", error ? "sm-input--error" : "", disabled ? "sm-input--disabled" : ""].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", {
    className: ["sm-field", className].filter(Boolean).join(" ")
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "sm-field__label",
    htmlFor: inputId
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    className: "sm-req"
  }, "*") : null) : null, /*#__PURE__*/React.createElement("div", {
    className: boxClasses
  }, leftIcon ? /*#__PURE__*/React.createElement("span", {
    className: "sm-input__icon"
  }, leftIcon) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    disabled: disabled,
    "aria-invalid": !!error
  }, rest)), addon ? /*#__PURE__*/React.createElement("span", {
    className: "sm-input__addon"
  }, addon) : null), error ? /*#__PURE__*/React.createElement("span", {
    className: "sm-field__error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "sm-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-select-field { display: flex; flex-direction: column; gap: 6px; }
.sm-select-field__label { font-family: var(--font-sans); font-weight: var(--fw-semibold); font-size: var(--text-sm); color: var(--text-primary); }
.sm-select-field__hint { font-size: var(--text-xs); color: var(--text-muted); }
.sm-select {
  --_h: var(--control-height-md);
  position: relative; display: flex; align-items: center;
}
.sm-select select {
  appearance: none; -webkit-appearance: none;
  width: 100%; height: var(--_h); padding: 0 38px 0 12px;
  font-family: var(--font-sans); font-size: var(--text-sm); color: var(--text-primary);
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border-strong);
  border-radius: var(--radius-md); cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard);
}
.sm-select select:hover { border-color: var(--ink-400); }
.sm-select select:focus-visible { outline: none; border-color: var(--ink-900); box-shadow: var(--focus-ring); }
.sm-select select:disabled { background: var(--ink-100); opacity: .7; cursor: not-allowed; }
.sm-select--sm select { --_h: var(--control-height-sm); height: 32px; }
.sm-select--lg select { height: var(--control-height-lg); }
.sm-select__chev { position: absolute; right: 12px; pointer-events: none; color: var(--text-muted); display: inline-flex; }
.sm-select__chev svg { width: 17px; height: 17px; display: block; }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
const Chevron = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("polyline", {
  points: "6 9 12 15 18 9"
}));

/**
 * Styled native select with a custom chevron.
 */
function Select({
  label,
  hint,
  size = "md",
  options,
  placeholder,
  className = "",
  id,
  children,
  ...rest
}) {
  inject("sm-select-styles", CSS);
  const selId = id || (label ? "sm-sel-" + Math.random().toString(36).slice(2, 8) : undefined);
  return /*#__PURE__*/React.createElement("div", {
    className: ["sm-select-field", className].filter(Boolean).join(" ")
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "sm-select-field__label",
    htmlFor: selId
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: ["sm-select", size !== "md" ? `sm-select--${size}` : ""].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selId
  }, rest), placeholder ? /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder) : null, options ? options.map(o => {
    const opt = typeof o === "string" ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement("option", {
      key: opt.value,
      value: opt.value
    }, opt.label);
  }) : children), /*#__PURE__*/React.createElement("span", {
    className: "sm-select__chev"
  }, /*#__PURE__*/React.createElement(Chevron, null))), hint ? /*#__PURE__*/React.createElement("span", {
    className: "sm-select-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; font-family: var(--font-sans); }
.sm-switch--disabled { opacity: .5; cursor: not-allowed; }
.sm-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.sm-switch__track {
  --_w: 40px; --_h: 24px;
  width: var(--_w); height: var(--_h); flex: none;
  border-radius: var(--radius-full); background: var(--ink-300);
  position: relative; transition: background var(--duration-base) var(--ease-standard);
}
.sm-switch__thumb {
  position: absolute; top: 2px; left: 2px;
  width: calc(var(--_h) - 4px); height: calc(var(--_h) - 4px);
  border-radius: 50%; background: #fff; box-shadow: var(--shadow-sm);
  transition: transform var(--duration-base) var(--ease-out);
}
.sm-switch input:checked + .sm-switch__track { background: var(--accent); }
.sm-switch input:checked + .sm-switch__track .sm-switch__thumb { transform: translateX(calc(var(--_w) - var(--_h))); }
.sm-switch input:focus-visible + .sm-switch__track { box-shadow: var(--focus-ring); }
.sm-switch--sm .sm-switch__track { --_w: 32px; --_h: 18px; }
.sm-switch__label { font-size: var(--text-sm); font-weight: var(--fw-medium); color: var(--text-primary); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/**
 * On/off toggle switch.
 */
function Switch({
  label,
  size = "md",
  disabled = false,
  labelPosition = "right",
  className = "",
  ...rest
}) {
  inject("sm-switch-styles", CSS);
  const classes = ["sm-switch", size !== "md" ? `sm-switch--${size}` : "", disabled ? "sm-switch--disabled" : "", className].filter(Boolean).join(" ");
  const lbl = label ? /*#__PURE__*/React.createElement("span", {
    className: "sm-switch__label"
  }, label) : null;
  return /*#__PURE__*/React.createElement("label", {
    className: classes
  }, label && labelPosition === "left" ? lbl : null, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sm-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sm-switch__thumb"
  })), label && labelPosition === "right" ? lbl : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/map/MapLegend.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-legend {
  background: var(--color-surface); border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md); box-shadow: var(--shadow-md);
  padding: 12px 14px; min-width: 180px;
}
.sm-legend__title { font-family: var(--label-font); font-size: var(--label-size); letter-spacing: var(--label-spacing); text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }
.sm-legend__list { display: flex; flex-direction: column; gap: 9px; }
.sm-legend__row { display: flex; align-items: center; gap: 9px; }
.sm-legend__sw { width: 13px; height: 13px; border-radius: 50%; flex: none; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--color-border); }
.sm-legend__label { font-family: var(--font-sans); font-size: var(--text-sm); color: var(--text-primary); flex: 1; }
.sm-legend__count { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
const KIND_COLOR = {
  charger: "var(--accent-500)",
  fast: "var(--orange-500)",
  unit: "var(--ink-900)",
  fault: "var(--red-500)",
  planned: "var(--blue-500)",
  meter: "var(--ink-700)"
};

/**
 * Map legend card listing marker kinds with swatch, label, and optional count.
 */
function MapLegend({
  title = "Legend",
  items = [],
  className = "",
  ...rest
}) {
  inject("sm-legend-styles", CSS);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["sm-legend", className].filter(Boolean).join(" ")
  }, rest), title ? /*#__PURE__*/React.createElement("div", {
    className: "sm-legend__title"
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    className: "sm-legend__list"
  }, items.map((it, i) => /*#__PURE__*/React.createElement("div", {
    className: "sm-legend__row",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "sm-legend__sw",
    style: {
      background: it.color || KIND_COLOR[it.kind] || "var(--ink-500)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "sm-legend__label"
  }, it.label), it.count != null ? /*#__PURE__*/React.createElement("span", {
    className: "sm-legend__count"
  }, it.count) : null))));
}
Object.assign(__ds_scope, { MapLegend });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/map/MapLegend.jsx", error: String((e && e.message) || e) }); }

// components/map/MapMarker.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const KINDS = {
  charger: {
    color: "var(--accent-500)",
    ink: "var(--accent-contrast)",
    icon: "plug-zap"
  },
  fast: {
    color: "var(--orange-500)",
    ink: "#fff",
    icon: "zap"
  },
  unit: {
    color: "var(--ink-900)",
    ink: "var(--accent-300)",
    icon: "box"
  },
  fault: {
    color: "var(--red-500)",
    ink: "#fff",
    icon: "alert-triangle"
  },
  planned: {
    color: "var(--blue-500)",
    ink: "#fff",
    icon: "circle-dashed"
  },
  meter: {
    color: "var(--ink-700)",
    ink: "var(--accent-300)",
    icon: "gauge"
  }
};
const CSS = `
.sm-marker { position: relative; display: inline-flex; flex-direction: column; align-items: center; --_sz: 36px; }
.sm-marker--sm { --_sz: 28px; }
.sm-marker--lg { --_sz: 46px; }
.sm-marker__pin {
  width: var(--_sz); height: var(--_sz); border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg); display: grid; place-items: center;
  box-shadow: var(--shadow-pin); border: 2px solid #fff;
}
.sm-marker__pin > * { transform: rotate(45deg); }
.sm-marker__pin svg { width: calc(var(--_sz) * 0.46); height: calc(var(--_sz) * 0.46); display: block; }
.sm-marker__count { font-family: var(--font-mono); font-weight: var(--fw-semibold); font-size: calc(var(--_sz) * 0.34); }
.sm-marker--active .sm-marker__pin { box-shadow: var(--shadow-pin), 0 0 0 4px rgba(201,242,58,.45); }
.sm-marker__label {
  margin-top: 5px; font-family: var(--font-mono); font-size: 10px; font-weight: var(--fw-medium);
  background: #fff; color: var(--ink-900); padding: 2px 6px; border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm); white-space: nowrap; border: 1px solid var(--color-border);
}
.sm-marker--dot { --_sz: 14px; }
.sm-marker--dot .sm-marker__pin { border-radius: 50%; transform: none; border-width: 2px; }
.sm-marker--dot .sm-marker__pin > * { transform: none; }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/**
 * Teardrop map marker for the site planner / map tool.
 */
function MapMarker({
  kind = "charger",
  size = "md",
  count,
  label,
  active = false,
  dot = false,
  className = "",
  ...rest
}) {
  inject("sm-marker-styles", CSS);
  const k = KINDS[kind] || KINDS.charger;
  const iconName = k.icon;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["sm-marker", `sm-marker--${size}`, active ? "sm-marker--active" : "", dot ? "sm-marker--dot" : "", className].filter(Boolean).join(" ")
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "sm-marker__pin",
    style: {
      background: k.color,
      color: k.ink
    }
  }, count != null ? /*#__PURE__*/React.createElement("span", {
    className: "sm-marker__count"
  }, count) : /*#__PURE__*/React.createElement("i", {
    "data-lucide": iconName
  })), label ? /*#__PURE__*/React.createElement("span", {
    className: "sm-marker__label"
  }, label) : null);
}
Object.assign(__ds_scope, { MapMarker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/map/MapMarker.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-sidebar {
  width: var(--sidebar-width); flex: none;
  background: var(--color-surface-2); color: var(--text-primary);
  display: flex; flex-direction: column;
  border-right: var(--border-width) solid var(--color-border);
  height: 100%;
}
.sm-sidebar--collapsed { width: var(--sidebar-width-collapsed); }
.sm-sidebar__brand { display: flex; align-items: center; gap: 10px; height: var(--topbar-height); padding: 0 16px; flex: none; border-bottom: var(--border-width) solid var(--color-border); }
.sm-sidebar__brand img { width: 30px; height: 30px; flex: none; }
.sm-sidebar__brand-name { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: var(--text-lg); letter-spacing: var(--tracking-tight); color: var(--text-primary); }
.sm-sidebar--collapsed .sm-sidebar__brand-name { display: none; }

.sm-sidebar__nav { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 2px; }
.sm-sidebar__section { font-family: var(--label-font); font-size: var(--label-size); letter-spacing: var(--label-spacing); text-transform: uppercase; color: var(--text-muted); font-weight: var(--fw-bold); padding: 14px 10px 6px; }
.sm-sidebar--collapsed .sm-sidebar__section { text-align: center; padding: 14px 0 6px; }

.sm-navitem {
  display: flex; align-items: center; gap: 11px;
  padding: 9px 11px; border-radius: var(--radius-md);
  color: var(--text-secondary); font-family: var(--font-sans); font-weight: var(--fw-medium); font-size: var(--text-sm);
  cursor: pointer; border: 1px solid transparent; background: transparent; width: 100%; text-align: left;
  position: relative; transition: background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.sm-navitem:hover { background: var(--color-surface); color: var(--text-primary); box-shadow: var(--shadow-xs); }
.sm-navitem__icon { display: inline-flex; flex: none; }
.sm-navitem__icon svg { width: 19px; height: 19px; display: block; }
.sm-navitem__label { flex: 1; white-space: nowrap; overflow: hidden; }
.sm-navitem__badge {
  font-family: var(--font-data); font-size: 10px; font-weight: var(--fw-semibold);
  background: var(--ink-200); color: var(--ink-600); padding: 2px 6px; border-radius: var(--radius-full);
}
.sm-navitem--active { background: var(--accent-soft); color: var(--accent-900); border-color: var(--accent-200); }
.sm-navitem--active::before {
  content: ""; position: absolute; left: -10px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 20px; background: var(--accent); border-radius: 0 3px 3px 0;
}
.sm-navitem--active .sm-navitem__icon { color: var(--accent-700); }
.sm-navitem--active .sm-navitem__badge { background: var(--accent-200); color: var(--accent-900); }
.sm-sidebar--collapsed .sm-navitem { justify-content: center; padding: 11px 0; }
.sm-sidebar--collapsed .sm-navitem__label, .sm-sidebar--collapsed .sm-navitem__badge { display: none; }

.sm-sidebar__foot { flex: none; padding: 12px; border-top: var(--border-width) solid var(--color-border); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/**
 * Dark application sidebar with brand, grouped nav items, and a footer slot.
 */
function Sidebar({
  items = [],
  activeId,
  onSelect,
  brandName = "EV Site Planner",
  logoSrc,
  collapsed = false,
  footer,
  className = "",
  ...rest
}) {
  inject("sm-sidebar-styles", CSS);
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: ["sm-sidebar", collapsed ? "sm-sidebar--collapsed" : "", className].filter(Boolean).join(" ")
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "sm-sidebar__brand"
  }, logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: ""
  }) : null, /*#__PURE__*/React.createElement("span", {
    className: "sm-sidebar__brand-name"
  }, brandName)), /*#__PURE__*/React.createElement("div", {
    className: "sm-sidebar__nav"
  }, items.map((it, i) => it.section ? /*#__PURE__*/React.createElement("div", {
    key: "s" + i,
    className: "sm-sidebar__section"
  }, it.section) : /*#__PURE__*/React.createElement("button", {
    key: it.id,
    className: ["sm-navitem", it.id === activeId ? "sm-navitem--active" : ""].filter(Boolean).join(" "),
    onClick: () => onSelect && onSelect(it.id),
    title: it.label
  }, it.icon ? /*#__PURE__*/React.createElement("span", {
    className: "sm-navitem__icon"
  }, it.icon) : null, /*#__PURE__*/React.createElement("span", {
    className: "sm-navitem__label"
  }, it.label), it.badge != null ? /*#__PURE__*/React.createElement("span", {
    className: "sm-navitem__badge"
  }, it.badge) : null))), footer ? /*#__PURE__*/React.createElement("div", {
    className: "sm-sidebar__foot"
  }, footer) : null);
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sm-tabs { display: flex; align-items: center; gap: 4px; }
.sm-tabs--line { gap: 0; border-bottom: var(--border-width) solid var(--color-border); }
.sm-tab {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: var(--font-sans); font-weight: var(--fw-semibold); font-size: var(--text-sm);
  color: var(--text-secondary); background: transparent; border: none; cursor: pointer;
  padding: 10px 14px; border-radius: var(--radius-md);
  transition: color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard);
}
.sm-tab__icon { display: inline-flex; }
.sm-tab__icon svg { width: 16px; height: 16px; display: block; }
.sm-tab__count { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); background: var(--ink-100); padding: 1px 6px; border-radius: var(--radius-full); }

/* line variant */
.sm-tabs--line .sm-tab { border-radius: 0; padding: 11px 4px; margin: 0 14px -1px 0; border-bottom: var(--border-width-2) solid transparent; }
.sm-tabs--line .sm-tab:hover { color: var(--text-primary); }
.sm-tabs--line .sm-tab--active { color: var(--text-primary); border-bottom-color: var(--accent); }
.sm-tabs--line .sm-tab--active .sm-tab__count { background: var(--accent-soft); color: var(--accent-strong); }

/* pill variant */
.sm-tabs--pill { background: var(--color-surface-sunken); padding: 4px; border-radius: var(--radius-md); display: inline-flex; }
.sm-tabs--pill .sm-tab:hover { color: var(--text-primary); }
.sm-tabs--pill .sm-tab--active { background: var(--color-surface); color: var(--text-primary); box-shadow: var(--shadow-xs); }

.sm-tab:focus-visible { outline: none; box-shadow: var(--focus-ring); }
`;
function inject(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/**
 * Horizontal tabs. "line" (underline) or "pill" (segmented) variants.
 */
function Tabs({
  tabs = [],
  activeId,
  onChange,
  variant = "line",
  className = "",
  ...rest
}) {
  inject("sm-tabs-styles", CSS);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["sm-tabs", `sm-tabs--${variant}`, className].filter(Boolean).join(" "),
    role: "tablist"
  }, rest), tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    role: "tab",
    "aria-selected": t.id === activeId,
    className: ["sm-tab", t.id === activeId ? "sm-tab--active" : ""].filter(Boolean).join(" "),
    onClick: () => onChange && onChange(t.id)
  }, t.icon ? /*#__PURE__*/React.createElement("span", {
    className: "sm-tab__icon"
  }, t.icon) : null, /*#__PURE__*/React.createElement("span", null, t.label), t.count != null ? /*#__PURE__*/React.createElement("span", {
    className: "sm-tab__count"
  }, t.count) : null)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Dashboard.jsx
try { (() => {
/* global React */
// Sitemark — Dashboard / Project Management UI kit
const DS = window.EVInfrastructureToolsDesignSystem_7296fd;
const {
  Sidebar,
  StatTile,
  Card,
  Tabs,
  Badge,
  StatusBadge,
  Button,
  IconButton,
  Input
} = DS;
const {
  useState
} = React;
const I = (n, p) => React.createElement("i", {
  "data-lucide": n,
  ...(p || {})
});
const NAV = [{
  section: "Workspace"
}, {
  id: "dash",
  label: "Dashboard",
  icon: I("layout-dashboard")
}, {
  id: "projects",
  label: "Projects",
  icon: I("folder-kanban"),
  badge: 8
}, {
  id: "map",
  label: "Site map",
  icon: I("map")
}, {
  id: "schedule",
  label: "Schedule",
  icon: I("calendar-days")
}, {
  section: "Library"
}, {
  id: "templates",
  label: "Templates",
  icon: I("layout-template")
}, {
  id: "equipment",
  label: "Equipment",
  icon: I("box")
}, {
  id: "team",
  label: "Team",
  icon: I("users")
}];
const PROJECTS = [{
  name: "Tesco Express — Leyton",
  client: "Tesco PLC",
  units: 14,
  status: "charging",
  stage: "Survey complete",
  value: "£22,104",
  pct: 100,
  due: "Live"
}, {
  name: "Riverside Retail Park",
  client: "British Land",
  units: 32,
  status: "idle",
  stage: "Awaiting DNO",
  value: "£68,500",
  pct: 60,
  due: "20 Jun"
}, {
  name: "Hillcrest Depot Fleet",
  client: "DPD UK",
  units: 48,
  status: "planned",
  stage: "Design",
  value: "£141,200",
  pct: 25,
  due: "04 Jul"
}, {
  name: "Marlow GP Surgery",
  client: "NHS Trust",
  units: 6,
  status: "fault",
  stage: "Snag — RCD trip",
  value: "£11,940",
  pct: 90,
  due: "Overdue"
}, {
  name: "Quayside Hotel",
  client: "Premier Inn",
  units: 18,
  status: "installed",
  stage: "Commissioned",
  value: "£39,300",
  pct: 100,
  due: "Closed"
}];
function ProgressBar({
  pct,
  status
}) {
  const color = status === "fault" ? "var(--red-500)" : status === "planned" ? "var(--blue-500)" : "var(--accent-500)";
  return /*#__PURE__*/React.createElement("span", {
    className: "pm-prog"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pm-prog__fill",
    style: {
      width: pct + "%",
      background: color
    }
  }));
}
function Dashboard() {
  const [active, setActive] = useState("dash");
  const [tab, setTab] = useState("active");
  return /*#__PURE__*/React.createElement("div", {
    className: "pm"
  }, /*#__PURE__*/React.createElement(Sidebar, {
    items: NAV,
    activeId: active,
    onSelect: setActive,
    logoSrc: "../../assets/logo-mark.svg",
    footer: /*#__PURE__*/React.createElement("div", {
      className: "pm-user"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pm-user__av"
    }, "JD"), /*#__PURE__*/React.createElement("span", {
      className: "pm-user__name"
    }, "Jordan Dean", /*#__PURE__*/React.createElement("small", null, "Lead engineer")))
  }), /*#__PURE__*/React.createElement("main", {
    className: "pm-main"
  }, /*#__PURE__*/React.createElement("header", {
    className: "pm-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "sm-eyebrow"
  }, "Wednesday \xB7 15 Jun"), /*#__PURE__*/React.createElement("h1", null, "Good morning, Jordan")), /*#__PURE__*/React.createElement("div", {
    className: "pm-head__actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pm-search"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "search"
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search projects, sites, units\u2026"
  })), /*#__PURE__*/React.createElement(IconButton, {
    icon: I("bell"),
    label: "Notifications",
    variant: "outline"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    leftIcon: I("plus")
  }, "New project"))), /*#__PURE__*/React.createElement("div", {
    className: "pm-scroll"
  }, /*#__PURE__*/React.createElement("section", {
    className: "pm-stats"
  }, /*#__PURE__*/React.createElement(StatTile, {
    label: "Active sites",
    value: "142",
    icon: I("map-pin"),
    delta: "12%",
    trend: "up",
    sub: "vs last mo"
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Surveys this wk",
    value: "38",
    icon: I("clipboard-check"),
    delta: "6%",
    trend: "up"
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Units installed",
    value: "1,204",
    icon: I("plug-zap"),
    delta: "18%",
    trend: "up"
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Open pipeline",
    value: "\xA31.2M",
    icon: I("trending-up"),
    appearance: "ink"
  })), /*#__PURE__*/React.createElement("section", {
    className: "pm-projects"
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "none"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pm-projects__head"
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      id: "active",
      label: "Active",
      count: 8
    }, {
      id: "design",
      label: "In design",
      count: 5
    }, {
      id: "snag",
      label: "Snagging",
      count: 2
    }, {
      id: "closed",
      label: "Closed"
    }],
    activeId: tab,
    onChange: setTab
  }), /*#__PURE__*/React.createElement("div", {
    className: "pm-projects__tools"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    leftIcon: I("sliders-horizontal")
  }, "Filter"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    leftIcon: I("arrow-up-down")
  }, "Sort"))), /*#__PURE__*/React.createElement("div", {
    className: "pm-table"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pm-table__head"
  }, /*#__PURE__*/React.createElement("span", null, "Project"), /*#__PURE__*/React.createElement("span", null, "Units"), /*#__PURE__*/React.createElement("span", null, "Stage"), /*#__PURE__*/React.createElement("span", null, "Progress"), /*#__PURE__*/React.createElement("span", null, "Value"), /*#__PURE__*/React.createElement("span", null, "Due")), PROJECTS.map((p, i) => /*#__PURE__*/React.createElement("div", {
    className: "pm-table__row",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "pm-cell-project"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pm-proj-name"
  }, p.name), /*#__PURE__*/React.createElement("span", {
    className: "pm-proj-client"
  }, p.client)), /*#__PURE__*/React.createElement("span", {
    className: "pm-cell-units"
  }, p.units), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(StatusBadge, {
    status: p.status,
    label: p.stage
  })), /*#__PURE__*/React.createElement("span", {
    className: "pm-cell-prog"
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    pct: p.pct,
    status: p.status
  }), /*#__PURE__*/React.createElement("em", null, p.pct, "%")), /*#__PURE__*/React.createElement("span", {
    className: "pm-cell-value"
  }, p.value), /*#__PURE__*/React.createElement("span", {
    className: "pm-cell-due" + (p.due === "Overdue" ? " is-late" : "")
  }, p.due)))))), /*#__PURE__*/React.createElement("section", {
    className: "pm-bottom"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Upcoming schedule",
    eyebrow: "Next 3 days",
    actions: /*#__PURE__*/React.createElement(IconButton, {
      icon: I("arrow-right"),
      label: "View all",
      size: "sm"
    })
  }, /*#__PURE__*/React.createElement("div", {
    className: "pm-schedule"
  }, [{
    t: "08:30",
    who: "Ravi P.",
    task: "Riverside — DNO witness test",
    c: "var(--accent-500)"
  }, {
    t: "11:00",
    who: "Jordan D.",
    task: "Hillcrest — design review",
    c: "var(--blue-500)"
  }, {
    t: "14:15",
    who: "Sam K.",
    task: "Marlow — RCD re-test",
    c: "var(--orange-500)"
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    className: "pm-sched-row",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "pm-sched-time"
  }, s.t), /*#__PURE__*/React.createElement("span", {
    className: "pm-sched-bar",
    style: {
      background: s.c
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "pm-sched-main"
  }, /*#__PURE__*/React.createElement("b", null, s.task), /*#__PURE__*/React.createElement("small", null, s.who)))))), /*#__PURE__*/React.createElement(Card, {
    title: "Equipment usage",
    eyebrow: "This quarter"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pm-bars"
  }, [{
    l: "22kW AC",
    v: 78
  }, {
    l: "7kW AC",
    v: 54
  }, {
    l: "50kW DC",
    v: 36
  }, {
    l: "150kW DC",
    v: 18
  }].map((b, i) => /*#__PURE__*/React.createElement("div", {
    className: "pm-bar-row",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "pm-bar-label"
  }, b.l), /*#__PURE__*/React.createElement("span", {
    className: "pm-bar-track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pm-bar-fill",
    style: {
      width: b.v + "%"
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "pm-bar-val"
  }, b.v)))))))));
}
window.Dashboard = Dashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/markup-tool/MarkupTool.jsx
try { (() => {
/* global React */
// EV Site Planner — faithful recreation of the real markup tool.
const DS = window.EVInfrastructureToolsDesignSystem_7296fd;
const {
  Badge,
  StatusBadge
} = DS;
const {
  useState
} = React;
const I = (n, p) => React.createElement("i", {
  "data-lucide": n,
  ...(p || {})
});

// Tool rail definition mirrors the product's groups + items
const RAIL = [{
  group: "Edit",
  tools: [{
    id: "select",
    icon: "mouse-pointer-2",
    label: "Select"
  }, {
    id: "scale",
    icon: "ruler",
    label: "Set scale"
  }]
}, {
  group: "Chargers",
  tools: [{
    id: "wall",
    icon: "plug-zap",
    label: "Wall",
    sw: "var(--accent-500)"
  }, {
    id: "pedestal",
    icon: "square",
    label: "Pedestal",
    sw: "var(--accent-500)"
  }, {
    id: "twin",
    icon: "columns-2",
    label: "Twin",
    sw: "var(--accent-500)"
  }, {
    id: "rapid",
    icon: "zap",
    label: "Rapid DC",
    sw: "var(--finish-hivis-orange)"
  }]
}, {
  group: "Power & distribution",
  tools: [{
    id: "supply",
    icon: "utility-pole",
    label: "DNO supply",
    sw: "var(--eq-supply)"
  }, {
    id: "meter",
    icon: "gauge",
    label: "Meter",
    sw: "var(--eq-fs)"
  }, {
    id: "evdb",
    icon: "square-stack",
    label: "EVDB",
    sw: "var(--eq-sub)"
  }, {
    id: "henley",
    icon: "git-merge",
    label: "Henley",
    sw: "var(--eq-cu)"
  }]
}, {
  group: "Electrical equipment",
  tools: [{
    id: "iso",
    icon: "toggle-left",
    label: "Isolator",
    sw: "var(--eq-iso)"
  }, {
    id: "earth",
    icon: "shield",
    label: "Earth rod",
    sw: "var(--eq-earth)"
  }]
}, {
  group: "Containment & cabling",
  tools: [{
    id: "swa",
    icon: "spline",
    label: "SWA cable",
    sw: "var(--eq-swa)"
  }, {
    id: "trunk",
    icon: "rectangle-horizontal",
    label: "Trunking",
    sw: "var(--eq-trunk)"
  }, {
    id: "duct",
    icon: "minus",
    label: "Buried duct",
    sw: "var(--eq-cu)"
  }, {
    id: "trench",
    icon: "construction",
    label: "Trench",
    sw: "var(--eq-swa)"
  }]
}, {
  group: "Notes",
  tools: [{
    id: "text",
    icon: "type",
    label: "Text"
  }, {
    id: "north",
    icon: "compass",
    label: "North"
  }, {
    id: "drill",
    icon: "target",
    label: "Drill"
  }]
}];
function ToolRail({
  tool,
  setTool
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ep-rail"
  }, RAIL.map(g => /*#__PURE__*/React.createElement("div", {
    className: "ep-tgroup-wrap",
    key: g.group
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-tgroup"
  }, g.group), g.tools.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    className: "ep-tool" + (tool === t.id ? " on" : ""),
    onClick: () => setTool(t.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "ep-tool__ic"
  }, I(t.icon)), /*#__PURE__*/React.createElement("span", {
    className: "ep-tool__lab"
  }, t.label), t.sw ? /*#__PURE__*/React.createElement("span", {
    className: "ep-tool__sw",
    style: {
      background: t.sw
    }
  }) : null)))));
}

// Standard domestic package reference
const STD_PACK = [{
  sw: "var(--accent-500)",
  nm: "7 kW charge point",
  note: "installed",
  qty: "1"
}, {
  sw: "var(--eq-swa)",
  nm: "Cabling",
  note: "SWA / outdoor",
  qty: "12 m"
}, {
  sw: "var(--eq-swa)",
  nm: "Trenching",
  note: "& reinstatement",
  qty: "8 m"
}, {
  sw: "var(--eq-cu)",
  nm: "Ducting",
  note: "buried",
  qty: "8 m"
}, {
  sw: "var(--eq-trunk)",
  nm: "Surface reinstatement",
  note: "tarmac",
  qty: "—"
}];
function MarkupTool() {
  const [tool, setTool] = useState("wall");
  const [mode, setMode] = useState("domestic");
  const [exporting, setExporting] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "ep"
  }, /*#__PURE__*/React.createElement("header", {
    className: "ep-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-brand"
  }, /*#__PURE__*/React.createElement("img", {
    className: "ep-logo",
    src: "../../assets/logo-mark.svg",
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-title"
  }, /*#__PURE__*/React.createElement("b", null, "EV Site Planner"), /*#__PURE__*/React.createElement("small", null, "Domestic \xB7 driveway & garage"))), /*#__PURE__*/React.createElement("div", {
    className: "ep-seg",
    role: "tablist"
  }, /*#__PURE__*/React.createElement("button", {
    className: mode === "domestic" ? "on" : "",
    onClick: () => setMode("domestic")
  }, "Domestic"), /*#__PURE__*/React.createElement("button", {
    className: mode === "commercial" ? "on" : "",
    onClick: () => setMode("commercial")
  }, "Commercial")), /*#__PURE__*/React.createElement("input", {
    className: "ep-packname",
    defaultValue: "14 Oakfield Drive \u2014 driveway",
    "aria-label": "Pack name"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-hbtns"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ep-hbtn"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "folder-open"
  }), /*#__PURE__*/React.createElement("span", null, "Projects")), /*#__PURE__*/React.createElement("button", {
    className: "ep-hbtn cust"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "palette"
  }), /*#__PURE__*/React.createElement("span", null, "Branding")), /*#__PURE__*/React.createElement("button", {
    className: "ep-hbtn primary",
    onClick: () => setExporting(true)
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "file-down"
  }), /*#__PURE__*/React.createElement("span", null, "Review & export")))), /*#__PURE__*/React.createElement("div", {
    className: "ep-main"
  }, /*#__PURE__*/React.createElement(ToolRail, {
    tool: tool,
    setTool: setTool
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-cvwrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-photo"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-house"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-garage"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ep-garage-door"
  })), /*#__PURE__*/React.createElement("div", {
    className: "ep-driveway"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-lawn"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-car"
  })), /*#__PURE__*/React.createElement("svg", {
    className: "ep-cables",
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none"
  }, /*#__PURE__*/React.createElement("polyline", {
    className: "ep-swa",
    points: "74,38 60,46 46,55 36,64"
  }), /*#__PURE__*/React.createElement("polyline", {
    className: "ep-duct",
    points: "36,64 30,72 30,82"
  })), /*#__PURE__*/React.createElement("span", {
    className: "ep-cablechip",
    style: {
      left: "52%",
      top: "49%"
    }
  }, "SWA 6mm\xB2 \xB7 12 m"), /*#__PURE__*/React.createElement("div", {
    className: "ep-scalebar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ep-scalebar__line"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ep-scalebar__val"
  }, "2.0 m")), /*#__PURE__*/React.createElement(Marker, {
    x: 74,
    y: 38,
    icon: "plug-zap",
    code: "CP-01",
    label: "7kW wall",
    tone: "var(--accent-500)",
    ink: "var(--accent-contrast)",
    selected: true
  }), /*#__PURE__*/React.createElement(Marker, {
    x: 36,
    y: 64,
    icon: "square-stack",
    code: "EVDB",
    label: "C40 RCBO",
    tone: "var(--eq-sub)",
    ink: "#fff"
  }), /*#__PURE__*/React.createElement(Marker, {
    x: 30,
    y: 82,
    icon: "toggle-left",
    code: "ISO",
    label: "Rotary isolator",
    tone: "var(--eq-iso)",
    ink: "#fff",
    small: true
  }), /*#__PURE__*/React.createElement(Marker, {
    x: 20,
    y: 88,
    icon: "utility-pole",
    code: "DNO",
    label: "Existing cut-out",
    tone: "var(--eq-supply)",
    ink: "#fff",
    small: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-north"
  }, I("navigation"), /*#__PURE__*/React.createElement("b", null, "N"))), /*#__PURE__*/React.createElement("div", {
    className: "ep-hint"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, "Wall charger"), " selected \u2014 tap the photo to place it"), /*#__PURE__*/React.createElement("button", {
    className: "ghost",
    onClick: () => setTool("select")
  }, "Done")), /*#__PURE__*/React.createElement("div", {
    className: "ep-zoom"
  }, /*#__PURE__*/React.createElement("button", {
    "aria-label": "Zoom in"
  }, I("plus")), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Zoom out"
  }, I("minus")), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Fit"
  }, I("maximize")))), /*#__PURE__*/React.createElement("aside", {
    className: "ep-side"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-scroll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-card"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), "Photos"), /*#__PURE__*/React.createElement("div", {
    className: "ep-thumbs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-thumb active"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-thumb__img"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-thumb__meta"
  }, /*#__PURE__*/React.createElement("b", null, "Driveway \u2014 front"), /*#__PURE__*/React.createElement("small", null, "Scale set \xB7 4 items"))), /*#__PURE__*/React.createElement("div", {
    className: "ep-thumb"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-thumb__img ep-thumb__img--2"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-thumb__meta"
  }, /*#__PURE__*/React.createElement("b", null, "Garage \u2014 consumer unit"), /*#__PURE__*/React.createElement("small", {
    className: "ep-noscale"
  }, "Scale not set")))), /*#__PURE__*/React.createElement("button", {
    className: "ep-addbtn"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "image-plus"
  }), "Add photos")), /*#__PURE__*/React.createElement("div", {
    className: "ep-card"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), "Against standard package"), /*#__PURE__*/React.createElement("div", {
    className: "ep-tally"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-tally__lab"
  }, /*#__PURE__*/React.createElement("span", null, "Cabling"), /*#__PURE__*/React.createElement("b", null, "12 / 15 m")), /*#__PURE__*/React.createElement("div", {
    className: "ep-tally__bar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ep-tally__fill",
    style: {
      width: "80%",
      background: "var(--eq-swa)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "ep-tally__lab"
  }, /*#__PURE__*/React.createElement("span", null, "Trenching"), /*#__PURE__*/React.createElement("b", null, "8 / 8 m")), /*#__PURE__*/React.createElement("div", {
    className: "ep-tally__bar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ep-tally__fill",
    style: {
      width: "100%",
      background: "var(--accent-500)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ep-tally__badges"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ep-badge ok"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check"
  }), "Within standard"))), /*#__PURE__*/React.createElement("div", {
    className: "ep-card"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), "Standard domestic pack"), /*#__PURE__*/React.createElement("div", {
    className: "ep-stdpack"
  }, STD_PACK.map((r, i) => /*#__PURE__*/React.createElement("div", {
    className: "ep-stdrow",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "ep-sw",
    style: {
      background: r.sw
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ep-nm"
  }, r.nm, " ", /*#__PURE__*/React.createElement("em", null, r.note)), /*#__PURE__*/React.createElement("b", null, r.qty)))), /*#__PURE__*/React.createElement("p", {
    className: "ep-stdnote"
  }, "Anything beyond the standard pack is flagged for a custom quote on export.")), /*#__PURE__*/React.createElement("div", {
    className: "ep-card"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), "CP-01 \xB7 properties"), /*#__PURE__*/React.createElement("div", {
    className: "ep-prop"
  }, /*#__PURE__*/React.createElement("label", null, "Charger"), /*#__PURE__*/React.createElement("div", {
    className: "ep-input"
  }, "7kW wall \xB7 single socket"), /*#__PURE__*/React.createElement("label", null, "Finish"), /*#__PURE__*/React.createElement("div", {
    className: "ep-finishes"
  }, ["#FFFFFF", "#1A1A1A", "#C7CDD2", "#3A3F45", "#B26A3D"].map((c, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "ep-finish" + (i === 4 ? " on" : ""),
    style: {
      background: c
    }
  }))), /*#__PURE__*/React.createElement("label", null, "Note"), /*#__PURE__*/React.createElement("div", {
    className: "ep-input ep-input--area"
  }, "Mount left of garage door, 1.2m AFFL. Customer fuse board inside garage.")))))), exporting ? /*#__PURE__*/React.createElement(ExportModal, {
    onClose: () => setExporting(false)
  }) : null);
}
function Marker({
  x,
  y,
  icon,
  code,
  label,
  tone,
  ink,
  selected,
  small
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ep-marker" + (selected ? " is-sel" : "") + (small ? " sm" : ""),
    style: {
      left: x + "%",
      top: y + "%"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ep-marker__pin",
    style: {
      background: tone,
      color: ink
    }
  }, I(icon)), /*#__PURE__*/React.createElement("span", {
    className: "ep-marker__tag"
  }, /*#__PURE__*/React.createElement("b", null, code), label));
}
function ExportModal({
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ep-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-modal__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "ep-eyebrow"
  }, "Review & export"), /*#__PURE__*/React.createElement("h3", null, "Client copy \u2014 PDF pack")), /*#__PURE__*/React.createElement("button", {
    className: "ep-modal__x",
    onClick: onClose,
    "aria-label": "Close"
  }, I("x"))), /*#__PURE__*/React.createElement("div", {
    className: "ep-modal__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-pdf"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ep-pdf__head"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "ep-pdf__co"
  }, /*#__PURE__*/React.createElement("b", null, "Your company"), /*#__PURE__*/React.createElement("small", null, "installer logo & details")), /*#__PURE__*/React.createElement("div", {
    className: "ep-pdf__ref"
  }, "Pack #EVSP-0142", /*#__PURE__*/React.createElement("br", null), "15 Jun 2026")), /*#__PURE__*/React.createElement("div", {
    className: "ep-pdf__title"
  }, "EV charger installation \u2014 14 Oakfield Drive"), /*#__PURE__*/React.createElement("div", {
    className: "ep-pdf__img"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ep-pdf__pin"
  })), /*#__PURE__*/React.createElement("div", {
    className: "ep-pdf__rows"
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null))), /*#__PURE__*/React.createElement("div", {
    className: "ep-modal__opts"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ep-eyebrow"
  }, "Include in pack"), /*#__PURE__*/React.createElement("label", {
    className: "ep-check"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    defaultChecked: true
  }), " Marked-up site photos"), /*#__PURE__*/React.createElement("label", {
    className: "ep-check"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    defaultChecked: true
  }), " Equipment schedule"), /*#__PURE__*/React.createElement("label", {
    className: "ep-check"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    defaultChecked: true
  }), " Standard-pack comparison"), /*#__PURE__*/React.createElement("label", {
    className: "ep-check"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox"
  }), " Internal notes"), /*#__PURE__*/React.createElement("div", {
    className: "ep-modal__flags"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "warning",
    appearance: "soft"
  }, "DNO application required")))), /*#__PURE__*/React.createElement("div", {
    className: "ep-modal__foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ep-hbtn",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("div", {
    className: "ep-spacer"
  }), /*#__PURE__*/React.createElement("button", {
    className: "ep-hbtn primary"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "download"
  }), /*#__PURE__*/React.createElement("span", null, "Download PDF")))));
}
window.MarkupTool = MarkupTool;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/markup-tool/MarkupTool.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/MobileApp.jsx
try { (() => {
/* global React */
// Sitemark — Mobile field app UI kit (companion to the markup tool)
const DS = window.EVInfrastructureToolsDesignSystem_7296fd;
const {
  Button,
  Badge,
  StatusBadge,
  IconButton
} = DS;
const {
  useState
} = React;
const I = (n, p) => React.createElement("i", {
  "data-lucide": n,
  ...(p || {})
});
const TABS = [{
  id: "today",
  icon: "calendar-check",
  label: "Today"
}, {
  id: "sites",
  icon: "map-pin",
  label: "Sites"
}, {
  id: "capture",
  icon: "camera",
  label: "Capture"
}, {
  id: "profile",
  icon: "user",
  label: "You"
}];
function BottomNav({
  tab,
  setTab
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-tabbar"
  }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    className: "mb-tab" + (tab === t.id ? " is-on" : ""),
    onClick: () => setTab(t.id)
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": t.icon
  }), /*#__PURE__*/React.createElement("span", null, t.label))));
}
function TodayScreen() {
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-screen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-hello"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "sm-eyebrow"
  }, "Wed 15 Jun"), /*#__PURE__*/React.createElement("h2", null, "3 jobs today")), /*#__PURE__*/React.createElement("span", {
    className: "mb-av"
  }, "RP")), /*#__PURE__*/React.createElement("div", {
    className: "mb-route"
  }, [{
    t: "08:30",
    name: "Riverside Retail Park",
    task: "DNO witness test",
    status: "idle",
    dist: "4.2 mi"
  }, {
    t: "11:00",
    name: "Tesco Express — Leyton",
    task: "Final survey",
    status: "charging",
    dist: "9.1 mi"
  }, {
    t: "14:15",
    name: "Marlow GP Surgery",
    task: "RCD re-test",
    status: "fault",
    dist: "12.6 mi"
  }].map((j, i) => /*#__PURE__*/React.createElement("div", {
    className: "mb-job",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-job__time"
  }, /*#__PURE__*/React.createElement("b", null, j.t), /*#__PURE__*/React.createElement("span", null, j.dist)), /*#__PURE__*/React.createElement("div", {
    className: "mb-job__line"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mb-job__dot"
  })), /*#__PURE__*/React.createElement("div", {
    className: "mb-job__card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-job__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mb-job__name"
  }, j.name), /*#__PURE__*/React.createElement(StatusBadge, {
    status: j.status
  })), /*#__PURE__*/React.createElement("span", {
    className: "mb-job__task"
  }, j.task), /*#__PURE__*/React.createElement("div", {
    className: "mb-job__actions"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm",
    leftIcon: I("navigation")
  }, "Navigate"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    leftIcon: I("arrow-right")
  }, "Open")))))));
}
function CaptureScreen() {
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-screen mb-capture"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-cap-photo"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-cap-scene"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mb-cap-pin"
  }, I("plug-zap"))), /*#__PURE__*/React.createElement("div", {
    className: "mb-cap-top"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: I("x"),
    label: "Close"
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    appearance: "solid"
  }, "CP-02 \xB7 22kW"), /*#__PURE__*/React.createElement(IconButton, {
    icon: I("zap"),
    label: "Flash"
  })), /*#__PURE__*/React.createElement("div", {
    className: "mb-cap-grid"
  })), /*#__PURE__*/React.createElement("div", {
    className: "mb-cap-tools"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sm-eyebrow"
  }, "Tap to drop equipment"), /*#__PURE__*/React.createElement("div", {
    className: "mb-cap-chips"
  }, /*#__PURE__*/React.createElement("button", {
    className: "mb-chip is-on"
  }, I("plug-zap"), "Charger"), /*#__PURE__*/React.createElement("button", {
    className: "mb-chip"
  }, I("box"), "Unit"), /*#__PURE__*/React.createElement("button", {
    className: "mb-chip"
  }, I("spline"), "Cable"), /*#__PURE__*/React.createElement("button", {
    className: "mb-chip"
  }, I("ruler"), "Measure"))), /*#__PURE__*/React.createElement("div", {
    className: "mb-cap-bar"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: I("images"),
    label: "Gallery",
    variant: "outline",
    size: "lg"
  }), /*#__PURE__*/React.createElement("button", {
    className: "mb-shutter",
    "aria-label": "Capture"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: I("check"),
    label: "Done",
    variant: "solid",
    size: "lg"
  })));
}
function SiteScreen() {
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-screen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-site-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-site-hero__scene"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mb-site-hero__overlay"
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    status: "charging",
    pulse: true
  }), /*#__PURE__*/React.createElement("h2", null, "Tesco Express \u2014 Leyton"), /*#__PURE__*/React.createElement("span", null, "E10 7AB \xB7 14 units \xB7 180 kW"))), /*#__PURE__*/React.createElement("div", {
    className: "mb-site-stats"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "mb-k"
  }, "Surveyed"), /*#__PURE__*/React.createElement("span", {
    className: "mb-v"
  }, "14/14")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "mb-k"
  }, "Photos"), /*#__PURE__*/React.createElement("span", {
    className: "mb-v"
  }, "28")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "mb-k"
  }, "Takeoff"), /*#__PURE__*/React.createElement("span", {
    className: "mb-v"
  }, "\xA322.1k"))), /*#__PURE__*/React.createElement("div", {
    className: "mb-list"
  }, [{
    n: "CP-01 · 22kW AC",
    s: "installed",
    ic: "plug-zap"
  }, {
    n: "CP-02 · 22kW AC",
    s: "charging",
    ic: "plug-zap"
  }, {
    n: "CP-05 · 50kW DC",
    s: "fault",
    ic: "zap"
  }, {
    n: "Distribution board",
    s: "installed",
    ic: "square-stack"
  }].map((u, i) => /*#__PURE__*/React.createElement("div", {
    className: "mb-unit",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "mb-unit__ic"
  }, I(u.ic)), /*#__PURE__*/React.createElement("span", {
    className: "mb-unit__n"
  }, u.n), /*#__PURE__*/React.createElement(StatusBadge, {
    status: u.s
  })))), /*#__PURE__*/React.createElement("div", {
    className: "mb-site-cta"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    size: "lg",
    leftIcon: I("file-down")
  }, "Generate PDF quote")));
}
function MobileApp() {
  const [tab, setTab] = useState("today");
  const Device = window.IOSDevice;
  let screen,
    dark = false;
  if (tab === "capture") {
    screen = /*#__PURE__*/React.createElement(CaptureScreen, null);
    dark = true;
  } else if (tab === "sites") screen = /*#__PURE__*/React.createElement(SiteScreen, null);else if (tab === "profile") screen = /*#__PURE__*/React.createElement(SiteScreen, null);else screen = /*#__PURE__*/React.createElement(TodayScreen, null);
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-stage"
  }, /*#__PURE__*/React.createElement(Device, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-app"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-app__body"
  }, screen), /*#__PURE__*/React.createElement(BottomNav, {
    tab: tab,
    setTab: setTab
  }))));
}
window.MobileApp = MobileApp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/MobileApp.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/ios-frame.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports (to window): IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard
//
// Usage — wrap your screen content in <IOSDevice> to get the bezel, status bar
// and home indicator (props: title, dark, keyboard):
//
//   <IOSDevice title="Settings">
//     ...your screen content...
//   </IOSDevice>
//   <IOSDevice dark title="Search" keyboard>…</IOSDevice>
/* END USAGE */

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({
  dark = false,
  time = '9:41'
}) {
  const c = dark ? '#fff' : '#000';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 154,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '21px 24px 19px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 590,
      fontSize: 17,
      lineHeight: '22px',
      color: c
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingTop: 1,
      paddingRight: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "12",
    viewBox: "0 0 19 12"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7.5",
    width: "3.2",
    height: "4.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.8",
    y: "5",
    width: "3.2",
    height: "7",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.6",
    y: "2.5",
    width: "3.2",
    height: "9.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.4",
    y: "0",
    width: "3.2",
    height: "12",
    rx: "0.7",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "12",
    viewBox: "0 0 17 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10.5",
    r: "1.5",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "27",
    height: "13",
    viewBox: "0 0 27 13"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "23",
    height: "12",
    rx: "3.5",
    stroke: c,
    strokeOpacity: "0.35",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "9",
    rx: "2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z",
    fill: c,
    fillOpacity: "0.4"
  }))));
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({
  children,
  dark = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      minWidth: 44,
      borderRadius: 9999,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({
  title = 'Title',
  dark = false,
  trailingIcon = true
}) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = content => /*#__PURE__*/React.createElement(IOSGlassPill, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingTop: 62,
      paddingBottom: 10,
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }
  }, pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "20",
    viewBox: "0 0 12 20",
    fill: "none",
    style: {
      marginLeft: -1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L2 10l8 8",
    stroke: muted,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), trailingIcon && pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    viewBox: "0 0 22 6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "3",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "3",
    r: "2.5",
    fill: muted
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      fontFamily: '-apple-system, system-ui',
      fontSize: 34,
      fontWeight: 700,
      lineHeight: '41px',
      color: text,
      letterSpacing: 0.4
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({
  title,
  detail,
  icon,
  chevron = true,
  isLast = false,
  dark = false
}) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 52,
      padding: '0 16px',
      position: 'relative',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      letterSpacing: -0.43
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: icon,
      marginRight: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: text
    }
  }, title), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sec,
      marginRight: 6
    }
  }, detail), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "14",
    viewBox: "0 0 8 14",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6 6-6 6",
    stroke: ter,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), !isLast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: icon ? 58 : 16,
      height: 0.5,
      background: sep
    }
  }));
}
function IOSList({
  header,
  children,
  dark = false
}) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return /*#__PURE__*/React.createElement("div", null, header && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '-apple-system, system-ui',
      fontSize: 13,
      color: hc,
      textTransform: 'uppercase',
      padding: '8px 36px 6px',
      letterSpacing: -0.08
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderRadius: 26,
      margin: '0 16px',
      overflow: 'hidden'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children,
  width = 402,
  height = 874,
  dark = false,
  title,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 126,
      height: 37,
      borderRadius: 24,
      background: '#000',
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(IOSStatusBar, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, title !== undefined && /*#__PURE__*/React.createElement(IOSNavBar, {
    title: title,
    dark: dark
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(IOSKeyboard, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      height: 34,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: 8,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 139,
      height: 5,
      borderRadius: 100,
      background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'
    }
  })));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({
  dark = false
}) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: /*#__PURE__*/React.createElement("svg", {
      width: "19",
      height: "17",
      viewBox: "0 0 19 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z",
      fill: glyph
    })),
    del: /*#__PURE__*/React.createElement("svg", {
      width: "23",
      height: "17",
      viewBox: "0 0 23 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z",
      fill: "none",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 5l7 7M17 5l-7 7",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinecap: "round"
    })),
    ret: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "14",
      viewBox: "0 0 20 14"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M18 1v6H4m0 0l4-4M4 7l4 4",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))
  };
  const key = (content, {
    w,
    flex,
    ret,
    fs = 25,
    k
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 42,
      borderRadius: 8.5,
      flex: flex ? 1 : undefined,
      width: w,
      minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs,
      fontWeight: 458,
      color: ret ? '#fff' : glyph
    }
  }, content);
  const row = (keys, pad = 0) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      justifyContent: 'center',
      padding: `0 ${pad}px`
    }
  }, keys.map(l => key(l, {
    flex: true,
    k: l
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 15,
      borderRadius: 27,
      overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: dark ? '0 -2px 20px rgba(0,0,0,0.09)' : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '8px 22px 13px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, ['"The"', 'the', 'to'].map((w, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 25,
      background: '#ccc',
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      color: sugg,
      letterSpacing: -0.43,
      lineHeight: '22px'
    }
  }, w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      padding: '0 6.5px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], 20), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14.25,
      alignItems: 'center'
    }
  }, key(icons.shift, {
    w: 45,
    k: 'shift'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      flex: 1
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l, {
    flex: true,
    k: l
  }))), key(icons.del, {
    w: 45,
    k: 'del'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, key('ABC', {
    w: 92.25,
    fs: 18,
    k: 'abc'
  }), key('', {
    flex: true,
    k: 'space'
  }), key(icons.ret, {
    w: 92.25,
    ret: true,
    k: 'ret'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      width: '100%',
      position: 'relative'
    }
  }));
}
Object.assign(window, {
  IOSDevice,
  IOSStatusBar,
  IOSNavBar,
  IOSGlassPill,
  IOSList,
  IOSListRow,
  IOSKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/ios-frame.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site-map/SiteMap.jsx
try { (() => {
/* global React */
// Sitemark — Site Map Planner UI kit
const DS = window.EVInfrastructureToolsDesignSystem_7296fd;
const {
  MapMarker,
  MapLegend,
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  Tabs,
  Input
} = DS;
const {
  useState
} = React;
const I = (n, p) => React.createElement("i", {
  "data-lucide": n,
  ...(p || {})
});
const SITES = [{
  id: "s1",
  x: 30,
  y: 38,
  kind: "fast",
  name: "Riverside Retail Park",
  units: 32,
  status: "idle",
  power: "350 kW",
  city: "Reading"
}, {
  id: "s2",
  x: 54,
  y: 30,
  kind: "charger",
  name: "Tesco Express — Leyton",
  units: 14,
  status: "charging",
  power: "180 kW",
  city: "London E10"
}, {
  id: "s3",
  x: 44,
  y: 62,
  kind: "fault",
  name: "Marlow GP Surgery",
  units: 6,
  status: "fault",
  power: "42 kW",
  city: "Marlow"
}, {
  id: "s4",
  x: 70,
  y: 56,
  kind: "planned",
  name: "Hillcrest Depot",
  units: 48,
  status: "planned",
  power: "1.2 MW",
  city: "Slough"
}, {
  id: "s5",
  x: 22,
  y: 70,
  kind: "unit",
  name: "Quayside Hotel",
  units: 18,
  status: "installed",
  power: "220 kW",
  city: "Bristol"
}, {
  id: "s6",
  x: 80,
  y: 28,
  kind: "charger",
  name: "Oakwood P&R",
  units: 24,
  status: "charging",
  power: "240 kW",
  city: "Oxford"
}];
function SiteMap() {
  const [sel, setSel] = useState("s2");
  const [tab, setTab] = useState("all");
  const active = SITES.find(s => s.id === sel);
  return /*#__PURE__*/React.createElement("div", {
    className: "sm-map"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "sm-map__panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sm-map__panel-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sm-map__brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    alt: ""
  }), /*#__PURE__*/React.createElement("span", null, "Site map")), /*#__PURE__*/React.createElement(IconButton, {
    icon: I("settings-2"),
    label: "Map settings",
    variant: "ghost",
    size: "sm"
  })), /*#__PURE__*/React.createElement("div", {
    className: "sm-map__search"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "search"
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search sites or postcodes\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    className: "sm-map__tabs"
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "pill",
    activeId: tab,
    onChange: setTab,
    tabs: [{
      id: "all",
      label: "All",
      count: 142
    }, {
      id: "live",
      label: "Live"
    }, {
      id: "plan",
      label: "Planned"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    className: "sm-map__list"
  }, SITES.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.id,
    className: "sm-site" + (sel === s.id ? " is-active" : ""),
    onClick: () => setSel(s.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "sm-site__dot",
    style: {
      background: dotColor(s.kind)
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "sm-site__main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sm-site__name"
  }, s.name), /*#__PURE__*/React.createElement("span", {
    className: "sm-site__meta"
  }, s.city, " \xB7 ", s.units, " units \xB7 ", s.power)), /*#__PURE__*/React.createElement(StatusBadge, {
    status: s.status
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "sm-map__canvas"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sm-map__terrain"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "sm-map__roads",
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M-2,44 C20,40 40,52 62,46 S90,30 102,36"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M30,-2 C34,30 28,55 40,78 S52,96 50,102"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M70,2 C66,28 78,50 72,80"
  }))), SITES.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    className: "sm-map__at",
    style: {
      left: s.x + "%",
      top: s.y + "%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setSel(s.id),
    style: {
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(MapMarker, {
    kind: s.kind,
    active: sel === s.id,
    label: sel === s.id ? s.name : undefined
  })))), /*#__PURE__*/React.createElement("div", {
    className: "sm-map__toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sm-map__seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: "is-on"
  }, "Map"), /*#__PURE__*/React.createElement("button", null, "Satellite")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    leftIcon: I("plus")
  }, "Add site")), /*#__PURE__*/React.createElement("div", {
    className: "sm-map__legend"
  }, /*#__PURE__*/React.createElement(MapLegend, {
    title: "Equipment",
    items: [{
      kind: "charger",
      label: "AC charger",
      count: 86
    }, {
      kind: "fast",
      label: "Rapid (50kW+)",
      count: 38
    }, {
      kind: "fault",
      label: "Faults",
      count: 4
    }, {
      kind: "planned",
      label: "Planned",
      count: 14
    }]
  })), active ? /*#__PURE__*/React.createElement("div", {
    className: "sm-map__detail"
  }, /*#__PURE__*/React.createElement(Card, {
    eyebrow: active.city,
    title: active.name,
    actions: /*#__PURE__*/React.createElement(IconButton, {
      icon: I("x"),
      label: "Close",
      size: "sm",
      onClick: () => setSel(null)
    }),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      fullWidth: true,
      leftIcon: I("crosshair")
    }, "Open survey"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "sm-detail__row"
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    status: active.status
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    appearance: "outline"
  }, active.units, " units"), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, active.power)), /*#__PURE__*/React.createElement("div", {
    className: "sm-detail__stats"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "sm-detail__k"
  }, "Surveyed"), /*#__PURE__*/React.createElement("span", {
    className: "sm-detail__v"
  }, active.units, "/", active.units)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "sm-detail__k"
  }, "Photos"), /*#__PURE__*/React.createElement("span", {
    className: "sm-detail__v"
  }, "28")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "sm-detail__k"
  }, "Takeoff"), /*#__PURE__*/React.createElement("span", {
    className: "sm-detail__v"
  }, "\xA322.1k"))))) : null));
}
function dotColor(kind) {
  return {
    charger: "var(--accent-500)",
    fast: "var(--orange-500)",
    unit: "var(--ink-900)",
    fault: "var(--red-500)",
    planned: "var(--blue-500)",
    meter: "var(--ink-700)"
  }[kind] || "var(--ink-500)";
}
window.SiteMap = SiteMap;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site-map/SiteMap.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.MapLegend = __ds_scope.MapLegend;

__ds_ns.MapMarker = __ds_scope.MapMarker;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
