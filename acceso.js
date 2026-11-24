const PAGINA_DESTINO = 'finand.html';

function togglePass(idInput, boton) {
  const input = document.getElementById(idInput);
  if (input.type === 'password') {
    input.type = 'text';
    boton.textContent = 'Ocultar';
  } else {
    input.type = 'password';
    boton.textContent = 'Ver';
  }
}

function cambiarVista(vista) {
  document.getElementById('error-login').style.display = 'none';
  document.getElementById('error-registro').style.display = 'none';

  if (vista === 'registro') {
    document.getElementById('form-login').classList.add('oculto');
    document.getElementById('form-registro').classList.remove('oculto');
  } else {
    document.getElementById('form-registro').classList.add('oculto');
    document.getElementById('form-login').classList.remove('oculto');
  }
}

function recuperarClave(e) {
  e.preventDefault();
  alert('Se enviará un enlace de recuperación a tu correo electrónico.');
}

// REGISTRO: Guarda correo y contraseña y redirige directo a finand.html
document.getElementById('form-registro').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass = document.getElementById('reg-pass').value;
  const errorReg = document.getElementById('error-registro');
  const estado = document.getElementById('creando-cuenta');
  const btn = document.getElementById('btn-registrar');

  errorReg.style.display = 'none';

  if (localStorage.getItem(`usuario_${email}`)) {
    errorReg.textContent = 'Este correo ya está registrado. Inicia sesión.';
    errorReg.style.display = 'block';
    return;
  }

  localStorage.setItem(`usuario_${email}`, JSON.stringify({ email, pass }));
  localStorage.setItem('usuarioActivo', email);

  estado.style.display = 'block';
  btn.disabled = true;

  setTimeout(() => {
    window.location.href = PAGINA_DESTINO;
  }, 900);
});

// INICIO DE SESIÓN: Verifica credenciales y entra a finand.html
document.getElementById('form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-pass').value;
  const errorLogin = document.getElementById('error-login');
  const verificando = document.getElementById('verificando');
  const btn = document.getElementById('btn-ingresar');

  errorLogin.style.display = 'none';
  verificando.style.display = 'block';
  btn.disabled = true;

  setTimeout(() => {
    const datosGuardados = JSON.parse(localStorage.getItem(`usuario_${email}`));

    if (datosGuardados && datosGuardados.pass === pass) {
      localStorage.setItem('usuarioActivo', email);
      window.location.href = PAGINA_DESTINO;
    } else {
      verificando.style.display = 'none';
      btn.disabled = false;
      errorLogin.textContent = 'Correo electrónico o contraseña incorrectos.';
      errorLogin.style.display = 'block';
    }
  }, 850);
});
