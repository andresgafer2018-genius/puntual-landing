// ═══════════════════════════════════════════════════════════════════════════
//  ESCUELA DE EJEMPLO (modo demo)
//  Permite probar Puntual con una escuela ficticia ya cargada (profesores,
//  materias, cursos y disponibilidades) sin tener que cargar nada antes.
//
//  - Los datos de ejemplo NUNCA se guardan (ni en la nube ni en este equipo).
//  - Los datos reales de la escuela quedan intactos y vuelven al salir.
//  - No se mandan mails a los profesores de ejemplo.
//  - No ocupa los límites del plan de prueba.
//
//  Se carga con <script src="/demo-escuela.js"></script> al final de
//  horario-escolar-14.html, después del script principal.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  let _modoDemo = false;
  let _estadoReal = null; // copia de los datos reales mientras se ve el ejemplo

  // ─── Datos de la escuela de ejemplo ──────────────────────────────────────
  // Escuela secundaria bonaerense, turno mañana, 5 cursos, 6 módulos de 40 min.
  // Disponibilidad: matriz [módulo][día] (6 módulos × 5 días, Lunes a Viernes).
  const NM = 6, ND = 5;

  // Días disponibles completos (todos los módulos)
  function dias(...ds) {
    return Array.from({ length: NM }, () => Array.from({ length: ND }, (_, d) => ds.includes(d)));
  }
  // Disponible todos los días pero solo en ciertos módulos (0 = 1° módulo)
  function modulos(...ms) {
    return Array.from({ length: NM }, (_, m) => Array(ND).fill(ms.includes(m)));
  }
  const TODO = () => dias(0, 1, 2, 3, 4);
  const L = 0, MA = 1, MI = 2, J = 3, V = 4;

  function construirDemo() {
    const materias = [
      { id: 'dm-pdl',  nombre: 'Prácticas del Lenguaje',     color: 'color-1', tipo: 'troncal' },
      { id: 'dm-lit',  nombre: 'Literatura',                 color: 'color-1', tipo: 'troncal' },
      { id: 'dm-mat',  nombre: 'Matemática',                 color: 'color-6', tipo: 'troncal' },
      { id: 'dm-ing',  nombre: 'Inglés',                     color: 'color-7', tipo: 'troncal' },
      { id: 'dm-cs',   nombre: 'Ciencias Sociales',          color: 'color-2', tipo: 'troncal' },
      { id: 'dm-his',  nombre: 'Historia',                   color: 'color-2', tipo: 'troncal' },
      { id: 'dm-geo',  nombre: 'Geografía',                  color: 'color-5', tipo: 'troncal' },
      { id: 'dm-cn',   nombre: 'Ciencias Naturales',         color: 'color-3', tipo: 'troncal' },
      { id: 'dm-bio',  nombre: 'Biología',                   color: 'color-3', tipo: 'troncal' },
      { id: 'dm-fq',   nombre: 'Fisicoquímica',              color: 'color-4', tipo: 'troncal' },
      { id: 'dm-ef',   nombre: 'Educación Física',           color: 'color-3', tipo: 'troncal' },
      { id: 'dm-art',  nombre: 'Educación Artística',        color: 'color-4', tipo: 'complementaria' },
      { id: 'dm-cc',   nombre: 'Construcción de Ciudadanía', color: 'color-5', tipo: 'complementaria' },
      { id: 'dm-pyc',  nombre: 'Política y Ciudadanía',      color: 'color-5', tipo: 'troncal' },
      { id: 'dm-ntic', nombre: 'NTICx',                      color: 'color-7', tipo: 'complementaria' },
      { id: 'dm-soc',  nombre: 'Sociología',                 color: 'color-2', tipo: 'troncal' },
      { id: 'dm-psi',  nombre: 'Psicología',                 color: 'color-4', tipo: 'troncal' },
      { id: 'dm-sya',  nombre: 'Salud y Adolescencia',       color: 'color-6', tipo: 'complementaria' },
    ].map(m => ({ ...m, nota: '' }));

    // Profesores ficticios. Varios trabajan en otras escuelas y solo vienen
    // algunos días (como pasa en la realidad).
    const P = (id, apellido, nombre, maxHs, mats, disp) =>
      ({ id, nombre, apellido, email: '', maxHs, materias: mats, disponibilidad: disp });
    const profesores = [
      P('dp-01', 'Gómez',     'Laura',     24, ['dm-pdl', 'dm-lit'],  TODO()),
      P('dp-02', 'Fernández', 'Marcelo',   16, ['dm-lit', 'dm-pdl'],  dias(L, MA, MI)),
      P('dp-03', 'Rodríguez', 'Silvina',   24, ['dm-mat'],            TODO()),
      P('dp-04', 'Pereyra',   'Diego',     16, ['dm-mat'],            dias(MA, J, V)),
      P('dp-05', 'Sosa',      'Carolina',  16, ['dm-ing'],            dias(L, MI, J, V)),
      P('dp-06', 'Acosta',    'Julián',     8, ['dm-cs', 'dm-his'],   dias(L, MA, J)),
      P('dp-07', 'Benítez',   'Mariana',   10, ['dm-his', 'dm-geo'],  TODO()),
      P('dp-08', 'Medina',    'Pablo',     10, ['dm-geo', 'dm-cs'],   dias(MA, MI, V)),
      P('dp-09', 'Romero',    'Andrea',    14, ['dm-cn', 'dm-bio'],   TODO()),
      P('dp-10', 'Herrera',   'Gustavo',   10, ['dm-fq'],             dias(L, MI, V)),
      P('dp-11', 'Díaz',      'Natalia',   10, ['dm-ef'],             modulos(3, 4, 5)), // solo después del recreo
      P('dp-12', 'Ruiz',      'Federico',  10, ['dm-art'],            dias(MI, J, V)),
      P('dp-13', 'Torres',    'Verónica',  10, ['dm-cc', 'dm-pyc'],   dias(L, MA, MI, J)),
      P('dp-14', 'Álvarez',   'Martín',     8, ['dm-ntic'],           dias(MA, MI, J)),
      P('dp-15', 'Castro',    'Lucía',      4, ['dm-soc'],            dias(L, V)),
      P('dp-16', 'Molina',    'Ezequiel',   4, ['dm-psi'],            dias(MI, J)),
      P('dp-17', 'Suárez',    'Gabriela',   2, ['dm-sya'],            dias(MA, V)),
    ];

    // Cursos: materia → [horas semanales, profesor]
    const C = (id, anio, aula, plan) => ({
      id, anio, div: 'A', turno: 'mañana', aula,
      materias: Object.keys(plan),
      horasPorMateria: Object.fromEntries(Object.entries(plan).map(([k, v]) => [k, v[0]])),
      profesorPorMateria: Object.fromEntries(Object.entries(plan).map(([k, v]) => [k, v[1]])),
    });
    const cursos = [
      C('dc-1', '1', 'Aula 1', {
        'dm-pdl': [5, 'dp-01'], 'dm-mat': [5, 'dp-03'], 'dm-ing': [3, 'dp-05'], 'dm-cs': [4, 'dp-06'],
        'dm-cn': [4, 'dp-09'], 'dm-ef': [2, 'dp-11'], 'dm-art': [3, 'dp-12'], 'dm-cc': [2, 'dp-13'],
      }),
      C('dc-2', '2', 'Aula 2', {
        'dm-pdl': [4, 'dp-02'], 'dm-mat': [4, 'dp-04'], 'dm-ing': [3, 'dp-05'], 'dm-his': [2, 'dp-07'],
        'dm-geo': [2, 'dp-08'], 'dm-bio': [3, 'dp-09'], 'dm-fq': [3, 'dp-10'], 'dm-ef': [2, 'dp-11'],
        'dm-art': [3, 'dp-12'], 'dm-cc': [2, 'dp-13'],
      }),
      C('dc-3', '3', 'Aula 3', {
        'dm-pdl': [4, 'dp-01'], 'dm-mat': [4, 'dp-03'], 'dm-ing': [3, 'dp-05'], 'dm-his': [2, 'dp-06'],
        'dm-geo': [2, 'dp-08'], 'dm-bio': [3, 'dp-09'], 'dm-fq': [3, 'dp-10'], 'dm-ef': [2, 'dp-11'],
        'dm-art': [3, 'dp-12'], 'dm-cc': [2, 'dp-13'],
      }),
      C('dc-4', '4', 'Aula 4', {
        'dm-lit': [4, 'dp-01'], 'dm-mat': [4, 'dp-03'], 'dm-ing': [3, 'dp-05'], 'dm-his': [3, 'dp-07'],
        'dm-geo': [2, 'dp-08'], 'dm-bio': [2, 'dp-09'], 'dm-fq': [2, 'dp-10'], 'dm-ef': [2, 'dp-11'],
        'dm-ntic': [2, 'dp-14'], 'dm-sya': [2, 'dp-17'], 'dm-psi': [2, 'dp-16'],
      }),
      C('dc-5', '5', 'Aula 5', {
        'dm-lit': [4, 'dp-02'], 'dm-mat': [4, 'dp-04'], 'dm-ing': [3, 'dp-05'], 'dm-his': [3, 'dp-07'],
        'dm-geo': [2, 'dp-08'], 'dm-pyc': [2, 'dp-13'], 'dm-ef': [2, 'dp-11'], 'dm-ntic': [2, 'dp-14'],
        'dm-soc': [4, 'dp-15'], 'dm-psi': [2, 'dp-16'],
      }),
    ];

    const franjas = [
      { id: 'df-1', tipo: 'clase',  nombre: '',       inicio: '07:30', duracion: 40 },
      { id: 'df-2', tipo: 'clase',  nombre: '',       inicio: '',      duracion: 40 },
      { id: 'df-3', tipo: 'clase',  nombre: '',       inicio: '',      duracion: 40 },
      { id: 'df-r1', tipo: 'recreo', nombre: 'Recreo', inicio: '',     duracion: 20 },
      { id: 'df-4', tipo: 'clase',  nombre: '',       inicio: '',      duracion: 40 },
      { id: 'df-5', tipo: 'clase',  nombre: '',       inicio: '',      duracion: 40 },
      { id: 'df-6', tipo: 'clase',  nombre: '',       inicio: '',      duracion: 40 },
    ];

    return {
      profesores, materias, cursos,
      horario: [], _ultimosPendientes: [], _forzados: [], _mejorSolucion: null, _historialHorarios: [],
      editingProf: null, editingMat: null, editingCur: null, selectedCurso: null,
      config: {
        nombreEscuela: 'Escuela de Ejemplo N°1 (datos ficticios)',
        modalidad: 'simple_manana', durModulo: 40, diasActivos: [0, 1, 2, 3, 4], franjas,
      },
    };
  }

  // ─── Entrar / salir del ejemplo ──────────────────────────────────────────
  function _copia(o) { return JSON.parse(JSON.stringify(o)); }

  function _refrescar() {
    showPanel('dashboard', null, null);
    updateBadges();
  }

  async function entrarDemo() {
    if (_modoDemo) return;
    // Antes de cambiar, guardar lo que la escuela tenga pendiente
    clearTimeout(_autoSaveTimer);
    clearTimeout(_nubeTimer);
    _guardarLocalOriginal();
    try { await _guardarNubeAhora(); } catch (e) {}

    const { user, ...real } = state;
    _estadoReal = _copia(real);
    _modoDemo = true;
    Object.assign(state, construirDemo());
    _pintarBannerDemo();
    _refrescar();
  }

  function salirDemo() {
    if (!_modoDemo) return;
    const user = state.user;
    state = _copia(_estadoReal);
    state.user = user;
    _estadoReal = null;
    _modoDemo = false;
    const b = document.getElementById('demoBanner');
    if (b) b.remove();
    _refrescar();
  }

  window.entrarDemo = entrarDemo;
  window.salirDemo = salirDemo;
  window.puntualModoDemo = () => _modoDemo;

  // ─── Banner del modo ejemplo ─────────────────────────────────────────────
  function _pintarBannerDemo() {
    let el = document.getElementById('demoBanner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demoBanner';
      el.style.cssText = 'position:sticky;top:0;z-index:201;padding:10px 18px;background:#EDE9FE;color:#4C1D95;' +
        'font-family:DM Sans,sans-serif;font-size:13px;font-weight:500;display:flex;align-items:center;' +
        'justify-content:center;gap:12px;flex-wrap:wrap;text-align:center;';
      document.body.insertBefore(el, document.body.firstChild);
    }
    el.innerHTML =
      '<span>🧪 Estás viendo una <strong>escuela de ejemplo</strong> con datos ficticios. Podés tocar todo: no se guarda nada.</span>' +
      '<button onclick="autoGenerar()" style="background:#7C3AED;color:#fff;border:0;padding:6px 14px;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;">⚡ Generar horario</button>' +
      '<button onclick="salirDemo()" style="background:transparent;color:#4C1D95;border:1px solid #4C1D95;padding:5px 12px;border-radius:7px;font-size:13px;cursor:pointer;">Salir y cargar mi escuela</button>';
  }

  // ─── Invitación en el panel de inicio ────────────────────────────────────
  // Se muestra mientras la escuela todavía no armó su horario.
  function _cajaInvitacion() {
    return '<div id="demoInvite" style="background:linear-gradient(135deg,#EDE9FE,#DBEAFE);border:1px solid #C4B5FD;' +
      'border-radius:12px;padding:18px 20px;margin-bottom:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;' +
      'font-family:DM Sans,sans-serif;color:#1E1B4B;">' +
      '<div style="font-size:34px;line-height:1;">🧪</div>' +
      '<div style="flex:1;min-width:220px;">' +
      '<div style="font-size:16px;font-weight:700;margin-bottom:4px;">¿Querés ver cómo funciona antes de cargar tus datos?</div>' +
      '<div style="font-size:13px;color:#3730A3;">Probá con una escuela de ejemplo que ya tiene 17 profesores, 5 cursos y sus disponibilidades cargadas. ' +
      'Generá el horario con un clic. Tus datos no se tocan.</div>' +
      '</div>' +
      '<button onclick="entrarDemo()" style="background:#7C3AED;color:#fff;border:0;padding:10px 18px;border-radius:8px;' +
      'font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;">Probar con escuela de ejemplo</button>' +
      '</div>';
  }

  const _renderDashboardOriginal = renderDashboard;
  renderDashboard = function () {
    _renderDashboardOriginal.apply(this, arguments);
    const alerts = document.getElementById('dashAlerts');
    if (!alerts) return;
    if (_modoDemo) {
      if (!state.horario.length) {
        alerts.innerHTML = '<div class="alert alert-warn">🟡 Esta escuela de ejemplo ya tiene todo cargado. ' +
          'Tocá <strong>⚡ Generar horario</strong> (arriba) o <strong>⚡ Auto-Generar</strong> en el menú.</div>';
      } else {
        alerts.innerHTML = '<div class="alert alert-info">🔵 ¡Listo! Mirá el resultado en <strong>📅 Horario</strong>: ' +
          'podés verlo por curso y por profesor, moverlo a mano y exportarlo a PDF o Excel. ' +
          'Cuando quieras, tocá <strong>Salir y cargar mi escuela</strong>.</div>' + alerts.innerHTML;
      }
      return;
    }
    if (!state.horario.length) alerts.insertAdjacentHTML('afterbegin', _cajaInvitacion());
  };

  // ─── Protecciones mientras se ve el ejemplo ──────────────────────────────
  // 1) No guardar nada (ni local ni en la nube)
  const _guardarLocalOriginal = _guardarLocalAhora;
  _guardarLocalAhora = function () {
    if (_modoDemo) return true;
    return _guardarLocalOriginal.apply(this, arguments);
  };
  const _subirANubeOriginal = _subirANube;
  _subirANube = async function () {
    if (_modoDemo) return true;
    return _subirANubeOriginal.apply(this, arguments);
  };
  const _saveLocalOriginal = saveLocal;
  saveLocal = function () {
    if (_modoDemo) return;
    return _saveLocalOriginal.apply(this, arguments);
  };

  // 2) Al cerrar sesión, volver primero a los datos reales
  const _cerrarSesionOriginal = cerrarSesion;
  cerrarSesion = function () {
    if (_modoDemo) salirDemo();
    return _cerrarSesionOriginal.apply(this, arguments);
  };

  // 3) Acciones que no tienen sentido con datos ficticios
  function _bloquear(nombreFn, mensaje) {
    if (typeof window[nombreFn] !== 'function') return;
    const original = window[nombreFn];
    window[nombreFn] = function () {
      if (_modoDemo) { alert(mensaje); return; }
      return original.apply(this, arguments);
    };
  }
  const MSG_MAIL = '📧 En la escuela de ejemplo no se mandan mails (los profesores son ficticios).\n\n' +
    'Cuando cargues tu escuela, cada profesor puede recibir su horario por mail con un clic.';
  _bloquear('enviarEmailsSeleccionados', MSG_MAIL);
  _bloquear('_enviarFormDisponibilidadSeleccionados', MSG_MAIL);
  _bloquear('resetApp', 'Estás en la escuela de ejemplo. Para volver a tus datos tocá "Salir y cargar mi escuela".');

  const _handleImportOriginal = handleImport;
  handleImport = function (e) {
    if (_modoDemo) {
      alert('Para importar tus datos, primero tocá "Salir y cargar mi escuela".');
      if (e && e.target) e.target.value = '';
      return;
    }
    return _handleImportOriginal.apply(this, arguments);
  };
  const _importarDispOriginal = typeof importarDisponibilidadHTMLs === 'function' ? importarDisponibilidadHTMLs : null;
  if (_importarDispOriginal) {
    importarDisponibilidadHTMLs = function (input) {
      if (_modoDemo) {
        alert('Para importar disponibilidades, primero tocá "Salir y cargar mi escuela".');
        if (input) input.value = '';
        return;
      }
      return _importarDispOriginal.apply(this, arguments);
    };
  }

  // Si el panel de inicio ya se dibujó antes de cargar este archivo, redibujarlo
  try { if (state.user) renderDashboard(); } catch (e) {}
})();
