const CANVAS_W = 1100;
const CANVAS_H = 680;

let components = [];
let selectedId = null;
let dragType = null;
let dragOffset = { x: 0, y: 0 };
let draggingId = null;

const canvas = document.getElementById('canvas');
const panelContent = document.getElementById('panel-content');

// ── Default sizes & props ──────────────────────────────────────────────────────
const DEFAULTS = {
  navbar:  { w: 1100, h: 56,  props: { logo: 'MyApp', links: 'Home, About, Contact' } },
  heading: { w: 400,  h: 60,  props: { text: 'Hello World', fontSize: '36' } },
  button:  { w: 140,  h: 44,  props: { label: 'Click Me', bgColor: '#7c6ff7', textColor: '#ffffff' } },
  input:   { w: 260,  h: 64,  props: { label: 'Email', placeholder: 'Enter email...' } },
  card:    { w: 280,  h: 160, props: { title: 'Card Title', body: 'Some description text here.' } },
  image:   { w: 300,  h: 200, props: { src: 'https://picsum.photos/300/200', alt: 'Image' } },
};

const PROP_LABELS = {
  label: 'Button Label', bgColor: 'Background Color', textColor: 'Text Color',
  placeholder: 'Placeholder', text: 'Text', fontSize: 'Font Size (px)',
  title: 'Title', body: 'Body Text', logo: 'Logo Text',
  links: 'Nav Links (comma-sep)', src: 'Image URL', alt: 'Alt Text'
};

// ── Drag from sidebar ──────────────────────────────────────────────────────────
document.querySelectorAll('.component-item').forEach(item => {
  item.addEventListener('dragstart', e => {
    dragType = item.dataset.type;
    e.dataTransfer.effectAllowed = 'copy';
  });
});

canvas.addEventListener('dragover', e => {
  e.preventDefault();
  canvas.classList.add('drag-over');
});

canvas.addEventListener('dragleave', () => canvas.classList.remove('drag-over'));

canvas.addEventListener('drop', e => {
  e.preventDefault();
  canvas.classList.remove('drag-over');
  if (!dragType) return;

  const rect = canvas.getBoundingClientRect();
  const def = DEFAULTS[dragType];
  const x = Math.max(0, Math.min(e.clientX - rect.left - def.w / 2, CANVAS_W - def.w));
  const y = Math.max(0, Math.min(e.clientY - rect.top - def.h / 2, CANVAS_H - def.h));

  const comp = {
    id: crypto.randomUUID(),
    type: dragType,
    x, y,
    width: def.w,
    height: def.h,
    props: { ...def.props }
  };

  components.push(comp);
  dragType = null;
  renderCanvas();
  selectComponent(comp.id);
});

// ── Render canvas ──────────────────────────────────────────────────────────────
function renderCanvas() {
  document.getElementById('canvas-empty').style.display = components.length === 0 ? 'flex' : 'none';
  canvas.querySelectorAll('.canvas-el').forEach(el => el.remove());

  components.forEach(comp => {
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-el' + (comp.id === selectedId ? ' selected' : '');
    wrapper.dataset.id = comp.id;
    wrapper.style.cssText = `left:${comp.x}px;top:${comp.y}px;width:${comp.width}px;height:${comp.height}px;`;

    // Inner component HTML
    const inner = document.createElement('div');
    inner.style.cssText = 'width:100%;height:100%;pointer-events:none;';
    inner.innerHTML = renderInner(comp);
    wrapper.appendChild(inner);

    // Delete button — created as real DOM node so event listener works reliably
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '×';
    delBtn.addEventListener('mousedown', e => {
      e.stopPropagation();
      e.preventDefault();
    });
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      deleteComponent(comp.id);
    });
    wrapper.appendChild(delBtn);

    // Select + drag on mousedown
    wrapper.addEventListener('mousedown', e => {
      // Don't interfere if clicking delete btn
      if (e.target === delBtn) return;
      e.stopPropagation();
      selectComponent(comp.id);
      startDragElement(e, comp);
    });

    canvas.appendChild(wrapper);
  });
}

function renderInner(comp) {
  const p = comp.props;
  switch (comp.type) {
    case 'button':
      return `<button class="el-button" style="background:${p.bgColor};color:${p.textColor}">${p.label}</button>`;
    case 'input':
      return `<div class="el-input-wrap"><label>${p.label}</label><input type="text" placeholder="${p.placeholder}"/></div>`;
    case 'card':
      return `<div class="el-card"><h4>${p.title}</h4><p>${p.body}</p></div>`;
    case 'heading':
      return `<div class="el-heading" style="font-size:${p.fontSize}px">${p.text}</div>`;
    case 'navbar': {
      const links = p.links.split(',').map(l => `<span class="nav-link">${l.trim()}</span>`).join('');
      return `<div class="el-navbar"><span class="nav-logo">${p.logo}</span>${links}</div>`;
    }
    case 'image':
      return `<img class="el-image" src="${p.src}" alt="${p.alt}" draggable="false"/>`;
    default:
      return '';
  }
}

// ── Drag elements on canvas ────────────────────────────────────────────────────
function startDragElement(e, comp) {
  draggingId = comp.id;
  const rect = canvas.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left - comp.x;
  dragOffset.y = e.clientY - rect.top - comp.y;

  const onMove = ev => {
    const r = canvas.getBoundingClientRect();
    const c = components.find(c => c.id === draggingId);
    if (!c) return;
    c.x = Math.max(0, Math.min(ev.clientX - r.left - dragOffset.x, CANVAS_W - c.width));
    c.y = Math.max(0, Math.min(ev.clientY - r.top - dragOffset.y, CANVAS_H - c.height));
    const el = canvas.querySelector(`[data-id="${draggingId}"]`);
    if (el) { el.style.left = c.x + 'px'; el.style.top = c.y + 'px'; }
  };

  const onUp = () => {
    draggingId = null;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// Deselect on canvas background click
canvas.addEventListener('mousedown', e => {
  if (e.target === canvas || e.target.id === 'canvas-empty') {
    selectedId = null;
    renderCanvas();
    renderPanel();
  }
});

// ── Select / Delete ────────────────────────────────────────────────────────────
function selectComponent(id) {
  selectedId = id;
  renderCanvas();
  renderPanel();
}

function deleteComponent(id) {
  components = components.filter(c => c.id !== id);
  if (selectedId === id) selectedId = null;
  renderCanvas();
  renderPanel();
}

// ── Properties panel ──────────────────────────────────────────────────────────
function renderPanel() {
  const comp = components.find(c => c.id === selectedId);
  if (!comp) {
    panelContent.innerHTML = '<div id="panel-empty">Select an element to edit its properties.</div>';
    return;
  }

  let html = `<div style="font-size:11px;color:#64748b;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">${comp.type}</div>`;

  html += `
  <div class="prop-group">
    <label>Position</label>
    <div class="row">
      <div class="prop-group"><label>X</label><input type="number" data-key="x" data-meta="pos" value="${Math.round(comp.x)}"/></div>
      <div class="prop-group"><label>Y</label><input type="number" data-key="y" data-meta="pos" value="${Math.round(comp.y)}"/></div>
    </div>
  </div>
  <div class="prop-group">
    <label>Size</label>
    <div class="row">
      <div class="prop-group"><label>W</label><input type="number" data-key="width" data-meta="pos" value="${Math.round(comp.width)}"/></div>
      <div class="prop-group"><label>H</label><input type="number" data-key="height" data-meta="pos" value="${Math.round(comp.height)}"/></div>
    </div>
  </div>
  <hr class="prop-divider"/>`;

  Object.entries(comp.props).forEach(([key, val]) => {
    const label = PROP_LABELS[key] || key;
    const isColor = key.toLowerCase().includes('color');
    html += `<div class="prop-group"><label>${label}</label>
      <input type="${isColor ? 'color' : 'text'}" data-key="${key}" data-meta="prop" value="${val}"/>
    </div>`;
  });

  panelContent.innerHTML = html;

  panelContent.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      const c = components.find(c => c.id === selectedId);
      if (!c) return;
      if (input.dataset.meta === 'pos') {
        c[input.dataset.key] = parseFloat(input.value) || 0;
      } else {
        c.props[input.dataset.key] = input.value;
      }
      renderCanvas();
    });
  });
}

// ── Clear canvas ───────────────────────────────────────────────────────────────
document.getElementById('clearBtn').addEventListener('click', () => {
  components = [];
  selectedId = null;
  renderCanvas();
  renderPanel();
});

// ── Generate code ──────────────────────────────────────────────────────────────
document.getElementById('generateBtn').addEventListener('click', async () => {
  if (components.length === 0) {
    alert('Add some components to the canvas first!');
    return;
  }

  const btn = document.getElementById('generateBtn');
  const spinner = document.getElementById('spinner');
  const label = document.getElementById('generateLabel');

  btn.disabled = true;
  spinner.style.display = 'block';
  label.textContent = 'Generating...';

  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canvas_width: CANVAS_W,
        canvas_height: CANVAS_H,
        components: components.map(c => ({
          id: c.id, type: c.type,
          x: Math.round(c.x), y: Math.round(c.y),
          width: Math.round(c.width), height: Math.round(c.height),
          props: c.props
        }))
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert('Error: ' + (data.detail || 'Something went wrong'));
      return;
    }

    document.getElementById('code-pre').textContent = data.code;
    document.getElementById('modal-overlay').classList.add('open');
  } catch (err) {
    alert('Network error: ' + err.message);
  } finally {
    btn.disabled = false;
    spinner.style.display = 'none';
    label.textContent = '⚡ Generate Code';
  }
});

// ── Modal ──────────────────────────────────────────────────────────────────────
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.remove('open');
});

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.remove('open');
  }
});

document.getElementById('copyBtn').addEventListener('click', () => {
  const code = document.getElementById('code-pre').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  });
});

// ── Init ───────────────────────────────────────────────────────────────────────
renderCanvas();
renderPanel();
