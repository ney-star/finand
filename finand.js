// =========================================
// BLOQUE 1: CONFIGURACIÓN Y GRÁFICA
// =========================================

const usuarioActivo = localStorage.getItem('usuarioActivo') || 'invitado';
const STORAGE_KEY = `finanzas_${usuarioActivo}`;
const PROFILE_KEY = `perfil_${usuarioActivo}`;
const BUDGETS_KEY = `presupuestos_${usuarioActivo}`;
const GOALS_KEY = `metas_${usuarioActivo}`;
const RECURRING_KEY = `recurrentes_${usuarioActivo}`;

// Protección contra datos viejos en localStorage
let datosGuardados = null;
try {
  datosGuardados = JSON.parse(localStorage.getItem(STORAGE_KEY));
} catch (e) {
  datosGuardados = null;
}

let saldo = (datosGuardados && typeof datosGuardados.saldo === 'number') ? datosGuardados.saldo : 0;
let movimientos = (datosGuardados && Array.isArray(datosGuardados.movimientos) && datosGuardados.movimientos.length > 0)
  ? datosGuardados.movimientos
  : [{ tiempo: 'Inicio', fecha: '-', valor: 0, monto: 0, motivo: 'Inicio', categoria: 'General', tipo: 'inicio' }];
let nivelZoom = 1;

const saldoDisplay = document.getElementById('saldoDisplay');
const balanceBox = document.getElementById('balanceBox');
const motivoInput = document.getElementById('motivoInput');
const categoriaSelect = document.getElementById('categoriaSelect');
const ingresoInput = document.getElementById('ingresoInput');
const retiroInput = document.getElementById('retiroInput');
const canvas = document.getElementById('saldoChart');
const ctx = canvas ? canvas.getContext('2d') : null;
const zoomSlider = document.getElementById('zoomSlider');
const zoomLevelText = document.getElementById('zoomLevelText');
const historyList = document.getElementById('historyList');

const COLOR_VERDE = '#11cf24';
const COLOR_ROJO = '#e71212';
const COLOR_BLANCO = '#ffffff';

function guardarDatosUsuario() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    saldo: saldo,
    movimientos: movimientos
  }));
}

function obtenerDatosVisibles() {
  if (nivelZoom <= 1 || movimientos.length <= 2) {
    return movimientos;
  }
  const cantidadVisible = Math.max(2, Math.ceil(movimientos.length / nivelZoom));
  return movimientos.slice(-cantidadVisible);
}

function dibujarGrafica() {
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const padLeft = 64;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 34;

  ctx.clearRect(0, 0, width, height);

  const datos = obtenerDatosVisibles();
  const valores = datos.map(m => Number(m.valor) || 0);
  let minVal = Math.min(0, ...valores);
  let maxVal = Math.max(100, ...valores);
  if (minVal === maxVal) maxVal += 100;

  const rangoY = maxVal - minVal;
  const areaW = width - padLeft - padRight;
  const areaH = height - padTop - padBottom;

  ctx.font = '12px Segoe UI, sans-serif';
  ctx.fillStyle = '#8b949e';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const pasos = 4;
  for (let i = 0; i <= pasos; i++) {
    const y = padTop + (areaH / pasos) * i;
    const val = maxVal - (rangoY / pasos) * i;

    ctx.strokeStyle = 'rgba(103, 103, 103, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();

    ctx.fillText(`Bs ${val.toFixed(0)}`, padLeft - 10, y);
  }

  const puntos = datos.map((m, idx) => {
    const x = datos.length === 1
      ? padLeft
      : padLeft + (areaW / (datos.length - 1)) * idx;
    const y = padTop + areaH - (((Number(m.valor) || 0) - minVal) / rangoY) * areaH;
    return { x, y, tiempo: m.tiempo || '', valor: m.valor, tipo: m.tipo };
  });

  if (puntos.length > 1) {
    for (let i = 1; i < puntos.length; i++) {
      const pAnterior = puntos.at(i - 1);
      const pActual = puntos.at(i);

      let colorTramo = COLOR_BLANCO;
      let colorSombra = 'rgba(255, 255, 255, 0.15)';

      if (pActual.tipo === 'ingreso') {
        colorTramo = COLOR_VERDE;
        colorSombra = 'rgba(22, 200, 79, 0.22)';
      } else if (pActual.tipo === 'retiro') {
        colorTramo = COLOR_ROJO;
        colorSombra = 'rgba(231, 18, 18, 0.25)';
      }

      const grad = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
      grad.addColorStop(0, colorSombra);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(pAnterior.x, height - padBottom);
      ctx.lineTo(pAnterior.x, pAnterior.y);
      ctx.lineTo(pActual.x, pActual.y);
      ctx.lineTo(pActual.x, height - padBottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pAnterior.x, pAnterior.y);
      ctx.lineTo(pActual.x, pActual.y);
      ctx.strokeStyle = colorTramo;
      ctx.lineWidth = 2.8;
      ctx.stroke();
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  puntos.forEach((p, idx) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const salto = Math.ceil(puntos.length / 6);
    if (idx % salto === 0 || idx === puntos.length - 1) {
      ctx.fillStyle = '#8b949e';
      ctx.fillText(p.tiempo, p.x, height - padBottom + 10);
    }
  });
}
// --- FIN BLOQUE 1 ---
// =========================================
// BLOQUE 2: HISTORIAL, MOVIMIENTOS Y ZOOM
// =========================================

function actualizarHistorial(nuevoRegistro) {
  if (!historyList) return;
  const vacio = historyList.querySelector('.empty-history');
  if (vacio) vacio.remove();

  const item = document.createElement('div');
  item.className = `history-item ${nuevoRegistro.tipo}`;

  const signo = nuevoRegistro.tipo === 'ingreso' ? '+' : '-';

  const leftCol = document.createElement('div');
  leftCol.className = 'item-left';

  const amountSpan = document.createElement('span');
  amountSpan.className = 'item-amount';
  amountSpan.textContent = `${signo} Bs ${(Number(nuevoRegistro.monto) || 0).toFixed(2)}`;

  const reasonSpan = document.createElement('span');
  reasonSpan.className = 'item-reason';
  const catTexto = nuevoRegistro.categoria ? ` [${nuevoRegistro.categoria}]` : '';
  reasonSpan.textContent = `${nuevoRegistro.motivo || 'Sin motivo'}${catTexto}`;

  leftCol.appendChild(amountSpan);
  leftCol.appendChild(reasonSpan);

  const rightCol = document.createElement('div');
  rightCol.className = 'item-right';

  const dateSpan = document.createElement('span');
  dateSpan.className = 'item-date';
  dateSpan.textContent = nuevoRegistro.fecha || '-';

  const timeSpan = document.createElement('span');
  timeSpan.className = 'item-time';
  timeSpan.textContent = nuevoRegistro.tiempo || '-';

  rightCol.appendChild(dateSpan);
  rightCol.appendChild(timeSpan);

  item.appendChild(leftCol);
  item.appendChild(rightCol);

  historyList.prepend(item);
}

function actualizarVistaSaldo() {
  if (!saldoDisplay) return;
  saldoDisplay.textContent = `Bs ${saldo.toFixed(2)}`;
  saldoDisplay.classList.remove('positive', 'negative');
  if (saldo > 0) saldoDisplay.classList.add('positive');
  if (saldo < 0) saldoDisplay.classList.add('negative');
}

function aplicarMovimientoInterno(monto, tipoMovimiento, motivoTexto, categoriaTexto) {
  if (tipoMovimiento === 'ingreso') saldo += monto;
  if (tipoMovimiento === 'retiro') saldo -= monto;

  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const nuevoRegistro = {
    tiempo: hora,
    fecha: fecha,
    valor: saldo,
    monto: monto,
    motivo: motivoTexto,
    categoria: categoriaTexto || 'General',
    tipo: tipoMovimiento
  };

  movimientos.push(nuevoRegistro);
  guardarDatosUsuario();
  actualizarVistaSaldo();
  actualizarHistorial(nuevoRegistro);
  dibujarGrafica();

  if (typeof renderizarPresupuestos === 'function') renderizarPresupuestos();
}

function registrarMovimiento(tipoOrigen) {
  let monto = 0;
  let tipoMovimiento = '';

  if (tipoOrigen === 'ingreso' && ingresoInput) {
    monto = parseFloat(ingresoInput.value) || 0;
    if (monto <= 0) return;
    tipoMovimiento = 'ingreso';
    ingresoInput.value = '';
  } else if (tipoOrigen === 'retiro' && retiroInput) {
    monto = parseFloat(retiroInput.value) || 0;
    if (monto <= 0) return;
    tipoMovimiento = 'retiro';
    retiroInput.value = '';
  }

  const motivoTexto = (motivoInput && motivoInput.value.trim()) ? motivoInput.value.trim() : 'Sin motivo';
  const categoriaTexto = categoriaSelect ? categoriaSelect.value : 'General';
  if (motivoInput) motivoInput.value = '';

  aplicarMovimientoInterno(monto, tipoMovimiento, motivoTexto, categoriaTexto);

  if (balanceBox) {
    balanceBox.classList.remove('pulse-green', 'pulse-red');
    void balanceBox.offsetWidth;
    if (tipoMovimiento === 'ingreso') balanceBox.classList.add('pulse-green');
    if (tipoMovimiento === 'retiro') balanceBox.classList.add('pulse-red');

    setTimeout(() => {
      balanceBox.classList.remove('pulse-green', 'pulse-red');
    }, 400);
  }
}

if (ingresoInput) {
  ingresoInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') registrarMovimiento('ingreso');
  });
}

if (retiroInput) {
  retiroInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') registrarMovimiento('retiro');
  });
}

function actualizarBarraZoom(valor) {
  if (!zoomSlider || !zoomLevelText) return;
  nivelZoom = Math.min(Math.max(parseFloat(valor), 1), 8);
  zoomSlider.value = nivelZoom;
  zoomLevelText.textContent = `${Math.round(nivelZoom * 100)}%`;

  const porcentaje = ((nivelZoom - 1) / (8 - 1)) * 100;
  zoomSlider.style.background = `linear-gradient(90deg, #ffffff ${porcentaje}%, #3a3d42 ${porcentaje}%)`;

  dibujarGrafica();
}

if (zoomSlider) {
  zoomSlider.addEventListener('input', e => {
    actualizarBarraZoom(e.target.value);
  });
}

if (canvas) {
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const paso = e.deltaY < 0 ? 0.5 : -0.5;
    actualizarBarraZoom(nivelZoom + paso);
  }, { passive: false });
}
// --- FIN BLOQUE 2 ---
// =========================================
// BLOQUE 3: PRESUPUESTOS Y METAS DE AHORRO
// =========================================

let presupuestos = {};
try {
  presupuestos = JSON.parse(localStorage.getItem(BUDGETS_KEY)) || {};
} catch (e) {
  presupuestos = {};
}

const btnGuardarPresupuesto = document.getElementById('btnGuardarPresupuesto');
const listaPresupuestos = document.getElementById('listaPresupuestos');

function calcularGastoMensualCategoria(categoria) {
  const ahora = new Date();
  const mesActual = String(ahora.getMonth() + 1).padStart(2, '0');
  const anioActual = String(ahora.getFullYear());
  const sufijoMesAnio = `/${mesActual}/${anioActual}`;

  return movimientos
    .filter(m => m.tipo === 'retiro' && (m.categoria || 'General') === categoria && (m.fecha || '').endsWith(sufijoMesAnio))
    .reduce((total, m) => total + (Number(m.monto) || 0), 0);
}

function renderizarPresupuestos() {
  if (!listaPresupuestos) return;
  const categorias = Object.keys(presupuestos);

  if (categorias.length === 0) {
    listaPresupuestos.innerHTML = '<p class="empty-history">Aún no has definido límites mensuales por categoría.</p>';
    return;
  }

  listaPresupuestos.innerHTML = '';

  categorias.forEach(cat => {
    const limite = Number(presupuestos[cat]) || 0;
    const gastado = calcularGastoMensualCategoria(cat);
    const porcentajeReal = limite > 0 ? (gastado / limite) * 100 : 0;
    const porcentajeBarra = Math.min(100, porcentajeReal);

    let claseColor = 'fill-green';
    let estadoTexto = 'Bajo control';

    if (porcentajeReal >= 90) {
      claseColor = 'fill-red';
      estadoTexto = porcentajeReal > 100 ? 'Límite excedido' : 'Al límite';
    } else if (porcentajeReal >= 65) {
      claseColor = 'fill-yellow';
      estadoTexto = 'Precaución';
    }

    const card = document.createElement('div');
    card.className = 'module-item-card';
    card.innerHTML = `
      <div class="module-card-header">
        <span class="module-title">${cat}</span>
        <button type="button" class="btn-delete-mini" data-del-pres="${cat}">Eliminar</button>
      </div>
      <div class="module-stats">
        <span>Gastado este mes: <strong>Bs ${gastado.toFixed(2)}</strong></span>
        <span>Tope: <strong>Bs ${limite.toFixed(2)}</strong></span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${claseColor}" style="width: ${porcentajeBarra}%"></div>
      </div>
      <div class="module-stats">
        <span>${estadoTexto}</span>
        <span><strong>${porcentajeReal.toFixed(0)}%</strong> usado</span>
      </div>
    `;
    listaPresupuestos.appendChild(card);
  });

  listaPresupuestos.querySelectorAll('[data-del-pres]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-del-pres');
      delete presupuestos[cat];
      localStorage.setItem(BUDGETS_KEY, JSON.stringify(presupuestos));
      renderizarPresupuestos();
    });
  });
}

if (btnGuardarPresupuesto) {
  btnGuardarPresupuesto.addEventListener('click', () => {
    const cat = document.getElementById('presupuestoCategoria').value;
    const limite = parseFloat(document.getElementById('presupuestoLimite').value);

    if (!limite || limite <= 0) return;

    presupuestos[cat] = limite;
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(presupuestos));
    document.getElementById('presupuestoLimite').value = '';
    renderizarPresupuestos();
  });
}

// METAS DE AHORRO (ALCANCÍAS)
let metasAhorro = [];
try {
  metasAhorro = JSON.parse(localStorage.getItem(GOALS_KEY)) || [];
} catch (e) {
  metasAhorro = [];
}

const btnCrearMeta = document.getElementById('btnCrearMeta');
const listaMetas = document.getElementById('listaMetas');

function guardarMetas() {
  localStorage.setItem(GOALS_KEY, JSON.stringify(metasAhorro));
}

function renderizarMetas() {
  if (!listaMetas) return;

  if (metasAhorro.length === 0) {
    listaMetas.innerHTML = '<p class="empty-history">Crea tu primera alcancía para empezar a ahorrar.</p>';
    return;
  }

  listaMetas.innerHTML = '';

  metasAhorro.forEach((meta, index) => {
    const objetivo = Number(meta.objetivo) || 0;
    const ahorrado = Number(meta.ahorrado) || 0;
    const porcentaje = objetivo > 0 ? Math.min(100, (ahorrado / objetivo) * 100) : 0;
    const falta = Math.max(0, objetivo - ahorrado);
    const faltaPct = Math.max(0, 100 - porcentaje);

    const card = document.createElement('div');
    card.className = 'module-item-card';
    card.innerHTML = `
      <div class="module-card-header">
        <span class="module-title">${meta.nombre}</span>
        <button type="button" class="btn-delete-mini" data-del-meta="${index}">Eliminar</button>
      </div>
      <div class="module-stats">
        <span>Ahorrado: <strong>Bs ${ahorrado.toFixed(2)}</strong></span>
        <span>Meta: <strong>Bs ${objetivo.toFixed(2)}</strong></span>
      </div>
      <div class="progress-track">
        <div class="progress-fill fill-green" style="width: ${porcentaje}%"></div>
      </div>
      <div class="module-stats">
        <span>Falta: <strong>Bs ${falta.toFixed(2)}</strong> (${faltaPct.toFixed(0)}%)</span>
        <span>Completado: <strong>${porcentaje.toFixed(0)}%</strong></span>
      </div>
      <div class="meta-deposit-row">
        <input type="number" step="0.01" placeholder="Monto en Bs" id="inputAbono_${index}" />
        <button type="button" class="btn-deposit" data-abonar-meta="${index}">Abonar</button>
      </div>
    `;
    listaMetas.appendChild(card);
  });

  listaMetas.querySelectorAll('[data-abonar-meta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-abonar-meta'), 10);
      const input = document.getElementById(`inputAbono_${idx}`);
      const monto = parseFloat(input.value);

      if (!monto || monto <= 0) return;

      metasAhorro[idx].ahorrado = (Number(metasAhorro[idx].ahorrado) || 0) + monto;
      guardarMetas();

      aplicarMovimientoInterno(monto, 'retiro', `Ahorro: ${metasAhorro[idx].nombre}`, 'Ahorro');
      renderizarMetas();
    });
  });

  listaMetas.querySelectorAll('[data-del-meta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-del-meta'), 10);
      metasAhorro.splice(idx, 1);
      guardarMetas();
      renderizarMetas();
    });
  });
}

if (btnCrearMeta) {
  btnCrearMeta.addEventListener('click', () => {
    const nombre = document.getElementById('metaNombre').value.trim();
    const objetivo = parseFloat(document.getElementById('metaObjetivo').value);

    if (!nombre || !objetivo || objetivo <= 0) return;

    metasAhorro.push({
      nombre: nombre,
      objetivo: objetivo,
      ahorrado: 0
    });

    guardarMetas();
    document.getElementById('metaNombre').value = '';
    document.getElementById('metaObjetivo').value = '';
    renderizarMetas();
  });
}
// --- FIN BLOQUE 3 ---
// =========================================
// BLOQUE 4A: PAGOS FIJOS Y SUSCRIPCIONES
// =========================================

let pagosRecurrentes = [];
try {
  pagosRecurrentes = JSON.parse(localStorage.getItem(RECURRING_KEY)) || [];
} catch (e) {
  pagosRecurrentes = [];
}

const btnAgregarRecurrente = document.getElementById('btnAgregarRecurrente');
const listaRecurrentes = document.getElementById('listaRecurrentes');
const alertasRecurrentes = document.getElementById('alertasRecurrentes');

function guardarRecurrentes() {
  localStorage.setItem(RECURRING_KEY, JSON.stringify(pagosRecurrentes));
}

function procesarPagosRecurrentes() {
  const hoy = new Date();
  const diaHoy = hoy.getDate();
  const claveMesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  let huboCobroAutomatico = false;
  const recordatorios = [];

  pagosRecurrentes.forEach(pago => {
    const yaCobradoEsteMes = pago.ultimoMesCobrado === claveMesActual;

    if (!yaCobradoEsteMes) {
      if (pago.automatico && diaHoy >= pago.diaCobro) {
        aplicarMovimientoInterno(Number(pago.monto) || 0, 'retiro', `Pago automático: ${pago.nombre}`, 'Servicios');
        pago.ultimoMesCobrado = claveMesActual;
        huboCobroAutomatico = true;
      } else {
        const diasFaltantes = pago.diaCobro - diaHoy;
        if (diasFaltantes >= 0 && diasFaltantes <= 3) {
          const cuando = diasFaltantes === 0 ? 'vence hoy' : `vence en ${diasFaltantes} día(s)`;
          recordatorios.push(`Recordatorio: ${pago.nombre} (Bs ${(Number(pago.monto) || 0).toFixed(2)}) ${cuando}.`);
        } else if (diasFaltantes < 0 && !pago.automatico) {
          recordatorios.push(`Pago pendiente del mes: ${pago.nombre} (Bs ${(Number(pago.monto) || 0).toFixed(2)}).`);
        }
      }
    }
  });

  if (huboCobroAutomatico) {
    guardarRecurrentes();
  }

  if (alertasRecurrentes) {
    if (recordatorios.length > 0) {
      alertasRecurrentes.innerHTML = recordatorios.join('<br>');
      alertasRecurrentes.classList.remove('oculto');
    } else {
      alertasRecurrentes.classList.add('oculto');
    }
  }
}

function renderizarRecurrentes() {
  if (!listaRecurrentes) return;

  if (pagosRecurrentes.length === 0) {
    listaRecurrentes.innerHTML = '<p class="empty-history">No tienes pagos fijos o suscripciones programadas.</p>';
    return;
  }

  const hoy = new Date();
  const claveMesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  listaRecurrentes.innerHTML = '';

  pagosRecurrentes.forEach((pago, index) => {
    const pagadoEsteMes = pago.ultimoMesCobrado === claveMesActual;
    const estadoBadge = pagadoEsteMes
      ? '<span class="badge-tag auto">Pagado este mes</span>'
      : `<span class="badge-tag">${pago.automatico ? 'Cobro automático' : 'Recordatorio manual'}</span>`;

    const card = document.createElement('div');
    card.className = 'module-item-card';
    card.innerHTML = `
      <div class="module-card-header">
        <span class="module-title">${pago.nombre}</span>
        <button type="button" class="btn-delete-mini" data-del-rec="${index}">Eliminar</button>
      </div>
      <div class="module-stats">
        <span>Monto: <strong>Bs ${(Number(pago.monto) || 0).toFixed(2)}</strong></span>
        <span>Día de cobro: <strong>${pago.diaCobro} de cada mes</strong></span>
      </div>
      <div class="module-card-header">
        ${estadoBadge}
        ${!pagadoEsteMes ? `<button type="button" class="btn-deposit" data-pagar-rec="${index}">Pagar ahora</button>` : ''}
      </div>
    `;
    listaRecurrentes.appendChild(card);
  });

  listaRecurrentes.querySelectorAll('[data-pagar-rec]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-pagar-rec'), 10);
      const pago = pagosRecurrentes[idx];
      const hoyRef = new Date();
      const mesRef = `${hoyRef.getFullYear()}-${String(hoyRef.getMonth() + 1).padStart(2, '0')}`;

      aplicarMovimientoInterno(Number(pago.monto) || 0, 'retiro', `Pago fijo: ${pago.nombre}`, 'Servicios');
      pago.ultimoMesCobrado = mesRef;
      guardarRecurrentes();
      procesarPagosRecurrentes();
      renderizarRecurrentes();
    });
  });

  listaRecurrentes.querySelectorAll('[data-del-rec]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-del-rec'), 10);
      pagosRecurrentes.splice(idx, 1);
      guardarRecurrentes();
      procesarPagosRecurrentes();
      renderizarRecurrentes();
    });
  });
}

if (btnAgregarRecurrente) {
  btnAgregarRecurrente.addEventListener('click', () => {
    const nombre = document.getElementById('recNombre').value.trim();
    const monto = parseFloat(document.getElementById('recMonto').value);
    const dia = parseInt(document.getElementById('recDia').value, 10);
    const automatico = document.getElementById('recAuto').checked;

    if (!nombre || !monto || monto <= 0 || !dia || dia < 1 || dia > 31) return;

    pagosRecurrentes.push({
      nombre: nombre,
      monto: monto,
      diaCobro: dia,
      automatico: automatico,
      ultimoMesCobrado: ''
    });

    guardarRecurrentes();
    document.getElementById('recNombre').value = '';
    document.getElementById('recMonto').value = '';
    document.getElementById('recDia').value = '';

    procesarPagosRecurrentes();
    renderizarRecurrentes();
  });
}
// --- FIN BLOQUE 4A ---
// =========================================
// BLOQUE 4B: BARRA LATERAL, PERFIL Y ARRANQUE
// =========================================

const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggleSidebar');
const btnLogout = document.getElementById('btnLogout');
const navItems = document.querySelectorAll('.nav-item');
const appViews = document.querySelectorAll('.app-view');

const sidebarUserName = document.getElementById('sidebarUserName');
const avatarInitial = document.getElementById('avatarInitial');
const avatarImg = document.getElementById('avatarImg');
const profileModal = document.getElementById('profileModal');
const btnAbrirPerfil = document.getElementById('btnAbrirPerfil');
const footerProfileTrigger = document.getElementById('footerProfileTrigger');
const closeProfileModal = document.getElementById('closeProfileModal');
const inputNombrePerfil = document.getElementById('inputNombrePerfil');
const inputFotoPerfil = document.getElementById('inputFotoPerfil');
const btnQuitarFoto = document.getElementById('btnQuitarFoto');
const btnGuardarPerfil = document.getElementById('btnGuardarPerfil');
const modalAvatarInitial = document.getElementById('modalAvatarInitial');
const modalAvatarImg = document.getElementById('modalAvatarImg');

let perfilUsuario = { nombre: usuarioActivo, foto: '' };
try {
  const guardadoPerfil = JSON.parse(localStorage.getItem(PROFILE_KEY));
  if (guardadoPerfil) perfilUsuario = guardadoPerfil;
} catch (e) {}
let fotoTemporal = perfilUsuario.foto || '';

function actualizarVistaPerfil() {
  const nombreMostrado = perfilUsuario.nombre || usuarioActivo;
  const inicial = nombreMostrado.charAt(0).toUpperCase();

  if (sidebarUserName) sidebarUserName.textContent = nombreMostrado;
  if (avatarInitial) avatarInitial.textContent = inicial;
  if (modalAvatarInitial) modalAvatarInitial.textContent = inicial;

  if (avatarImg && avatarInitial) {
    if (perfilUsuario.foto) {
      avatarImg.src = perfilUsuario.foto;
      avatarImg.classList.remove('oculto');
      avatarInitial.classList.add('oculto');
    } else {
      avatarImg.src = '';
      avatarImg.classList.add('oculto');
      avatarInitial.classList.remove('oculto');
    }
  }
}

function actualizarVistaPreviaModal() {
  const nombreTemp = (inputNombrePerfil && inputNombrePerfil.value.trim()) ? inputNombrePerfil.value.trim() : usuarioActivo;
  if (modalAvatarInitial) modalAvatarInitial.textContent = nombreTemp.charAt(0).toUpperCase();

  if (modalAvatarImg && modalAvatarInitial) {
    if (fotoTemporal) {
      modalAvatarImg.src = fotoTemporal;
      modalAvatarImg.classList.remove('oculto');
      modalAvatarInitial.classList.add('oculto');
    } else {
      modalAvatarImg.src = '';
      modalAvatarImg.classList.add('oculto');
      modalAvatarInitial.classList.remove('oculto');
    }
  }
}

function abrirModalPerfil(e) {
  if (e) e.preventDefault();
  if (inputNombrePerfil) inputNombrePerfil.value = perfilUsuario.nombre || usuarioActivo;
  fotoTemporal = perfilUsuario.foto || '';
  actualizarVistaPreviaModal();
  if (profileModal) profileModal.classList.remove('oculto');
}

function cerrarModalPerfil() {
  if (profileModal) profileModal.classList.add('oculto');
}

if (btnAbrirPerfil) btnAbrirPerfil.addEventListener('click', abrirModalPerfil);
if (footerProfileTrigger) footerProfileTrigger.addEventListener('click', abrirModalPerfil);
if (closeProfileModal) closeProfileModal.addEventListener('click', cerrarModalPerfil);

if (profileModal) {
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) cerrarModalPerfil();
  });
}

if (inputNombrePerfil) {
  inputNombrePerfil.addEventListener('input', actualizarVistaPreviaModal);
}

if (inputFotoPerfil) {
  inputFotoPerfil.addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (evento) => {
      fotoTemporal = evento.target.result;
      actualizarVistaPreviaModal();
    };
    lector.readAsDataURL(archivo);
  });
}

if (btnQuitarFoto) {
  btnQuitarFoto.addEventListener('click', () => {
    fotoTemporal = '';
    if (inputFotoPerfil) inputFotoPerfil.value = '';
    actualizarVistaPreviaModal();
  });
}

if (btnGuardarPerfil) {
  btnGuardarPerfil.addEventListener('click', () => {
    const nuevoNombre = (inputNombrePerfil && inputNombrePerfil.value.trim()) ? inputNombrePerfil.value.trim() : usuarioActivo;
    perfilUsuario = {
      nombre: nuevoNombre,
      foto: fotoTemporal
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(perfilUsuario));
    actualizarVistaPerfil();
    cerrarModalPerfil();
  });
}

if (toggleSidebar && sidebar) {
  toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    setTimeout(dibujarGrafica, 360);
  });
}

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    if (item.id === 'btnAbrirPerfil') return;
    e.preventDefault();

    const vistaDestino = item.getAttribute('data-view');
    if (!vistaDestino) return;

    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');

    appViews.forEach(view => view.classList.add('oculto'));
    const vistaActiva = document.getElementById(vistaDestino);
    if (vistaActiva) vistaActiva.classList.remove('oculto');

    if (vistaDestino === 'vista-grafica') setTimeout(dibujarGrafica, 50);
    if (vistaDestino === 'vista-presupuestos') renderizarPresupuestos();
    if (vistaDestino === 'vista-metas') renderizarMetas();
    if (vistaDestino === 'vista-recurrentes') renderizarRecurrentes();
  });
});

if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('usuarioActivo');
    window.location.href = 'acceso.html';
  });
}

function inicializarPantalla() {
  actualizarVistaSaldo();
  movimientos.forEach(mov => {
    if (mov.tipo !== 'inicio') {
      actualizarHistorial(mov);
    }
  });
  dibujarGrafica();
  actualizarVistaPerfil();
  procesarPagosRecurrentes();
  renderizarPresupuestos();
  renderizarMetas();
  renderizarRecurrentes();
}

window.addEventListener('resize', dibujarGrafica);
inicializarPantalla();
// --- FIN BLOQUE 4B ---
// =========================================
// VISTA COMPLETA DE HISTORIAL CON FILTROS
// =========================================

const fullHistoryList = document.getElementById('fullHistoryList');
const filtroBuscarHistorial = document.getElementById('filtroBuscarHistorial');
const filtroTipoHistorial = document.getElementById('filtroTipoHistorial');
const filtroCategoriaHistorial = document.getElementById('filtroCategoriaHistorial');
const resumenHistorialFull = document.getElementById('resumenHistorialFull');

function renderizarHistorialCompleto() {
  if (!fullHistoryList) return;

  const texto = (filtroBuscarHistorial ? filtroBuscarHistorial.value.trim().toLowerCase() : '');
  const tipo = (filtroTipoHistorial ? filtroTipoHistorial.value : 'todos');
  const categoria = (filtroCategoriaHistorial ? filtroCategoriaHistorial.value : 'todas');

  const filtrados = movimientos
    .filter(m => m.tipo !== 'inicio')
    .filter(m => tipo === 'todos' || m.tipo === tipo)
    .filter(m => categoria === 'todas' || (m.categoria || 'General') === categoria)
    .filter(m => (m.motivo || '').toLowerCase().includes(texto))
    .slice()
    .reverse();

  // Calcular totales filtrados
  const totalIng = filtrados.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
  const totalRet = filtrados.filter(m => m.tipo === 'retiro').reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

  if (resumenHistorialFull) {
    resumenHistorialFull.innerHTML = `
      <span class="summary-pill" style="color: #26e030;">Ingresos: +Bs ${totalIng.toFixed(2)}</span>
      <span class="summary-pill" style="color: #f03232;">Retiros: -Bs ${totalRet.toFixed(2)}</span>
    `;
  }

  if (filtrados.length === 0) {
    fullHistoryList.innerHTML = '<p class="empty-history">No hay movimientos que coincidan con el filtro.</p>';
    return;
  }

  fullHistoryList.innerHTML = '';
  filtrados.forEach(reg => {
    const item = document.createElement('div');
    item.className = `history-item ${reg.tipo}`;
    const signo = reg.tipo === 'ingreso' ? '+' : '-';
    const catTexto = reg.categoria ? ` [${reg.categoria}]` : '';

    item.innerHTML = `
      <div class="item-left">
        <span class="item-amount">${signo} Bs ${(Number(reg.monto) || 0).toFixed(2)}</span>
        <span class="item-reason">${reg.motivo || 'Sin motivo'}${catTexto}</span>
      </div>
      <div class="item-right">
        <span class="item-date">${reg.fecha || '-'}</span>
        <span class="item-time">${reg.tiempo || '-'}</span>
      </div>
    `;
    fullHistoryList.appendChild(item);
  });
}

if (filtroBuscarHistorial) filtroBuscarHistorial.addEventListener('input', renderizarHistorialCompleto);
if (filtroTipoHistorial) filtroTipoHistorial.addEventListener('change', renderizarHistorialCompleto);
if (filtroCategoriaHistorial) filtroCategoriaHistorial.addEventListener('change', renderizarHistorialCompleto);


// =========================================
// MENÚ DESPLEGABLE PARA PANTALLAS ANGOSTAS
// =========================================

const mobileMenuTrigger = document.getElementById('mobileMenuTrigger');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

function abrirMenuMovil() {
  if (!sidebar) return;
  sidebar.classList.remove('collapsed');
  sidebar.classList.add('mobile-open');
  if (sidebarBackdrop) sidebarBackdrop.classList.remove('oculto');
}

function cerrarMenuMovil() {
  if (!sidebar) return;
  sidebar.classList.remove('mobile-open');
  if (sidebarBackdrop) sidebarBackdrop.classList.add('oculto');
}

if (mobileMenuTrigger) {
  mobileMenuTrigger.addEventListener('click', abrirMenuMovil);
}

if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener('click', cerrarMenuMovil);
}

// Hacer que el botón de hamburguesa interno también cierre el menú en móvil
if (toggleSidebar) {
  toggleSidebar.addEventListener('click', () => {
    if (window.innerWidth <= 820 || window.innerHeight > window.innerWidth) {
      cerrarMenuMovil();
    }
  });
}

// Cerrar el menú automáticamente al seleccionar una opción en móvil
navItems.forEach(item => {
  item.addEventListener('click', () => {
    cerrarMenuMovil();
  });
});
// Referencias de la barra móvil
const mobileProfileTrigger = document.getElementById('mobileProfileTrigger');
const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
const mobileUserName = document.getElementById('mobileUserName');
const mobileAvatarInitial = document.getElementById('mobileAvatarInitial');
const mobileAvatarImg = document.getElementById('mobileAvatarImg');

// Sincronizar foto y nombre en la barra móvil (agrega esto dentro de actualizarVistaPerfil)
function sincronizarPerfilMovil() {
  const nombreMostrado = perfilUsuario.nombre || usuarioActivo;
  const inicial = nombreMostrado.charAt(0).toUpperCase();

  if (mobileUserName) mobileUserName.textContent = nombreMostrado;
  if (mobileAvatarInitial) mobileAvatarInitial.textContent = inicial;

  if (mobileAvatarImg && mobileAvatarInitial) {
    if (perfilUsuario.foto) {
      mobileAvatarImg.src = perfilUsuario.foto;
      mobileAvatarImg.classList.remove('oculto');
      mobileAvatarInitial.classList.add('oculto');
    } else {
      mobileAvatarImg.src = '';
      mobileAvatarImg.classList.add('oculto');
      mobileAvatarInitial.classList.remove('oculto');
    }
  }
}

// Eventos para abrir perfil y cerrar sesión desde móvil
if (mobileProfileTrigger) {
  mobileProfileTrigger.addEventListener('click', abrirModalPerfil);
}

if (mobileLogoutBtn) {
  mobileLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('usuarioActivo');
    window.location.href = 'acceso.html';
  });
}

// Llama a sincronizarPerfilMovil() al iniciar y al guardar cambios en el perfil
sincronizarPerfilMovil();
if (btnGuardarPerfil) {
  btnGuardarPerfil.addEventListener('click', sincronizarPerfilMovil);
}
// =========================================
// OCULTAR BARRA MÓVIL AL BAJAR / MOSTRAR AL SUBIR
// =========================================

const mobileTopbar = document.querySelector('.mobile-topbar');
let ultimoScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  if (!mobileTopbar) return;

  const scrollActual = window.scrollY;

  // Si estamos muy arriba (menos de 60px), siempre mostrar la barra
  if (scrollActual <= 60) {
    mobileTopbar.classList.remove('hide-on-scroll');
    ultimoScrollY = scrollActual;
    return;
  }

  // Si bajamos, ocultar; si subimos, mostrar
  if (scrollActual > ultimoScrollY) {
    mobileTopbar.classList.add('hide-on-scroll');
  } else if (scrollActual < ultimoScrollY) {
    mobileTopbar.classList.remove('hide-on-scroll');
  }

  ultimoScrollY = scrollActual;
}, { passive: true });
