export function getAuthErrorMessage(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos. Verifica tus datos.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/operation-not-allowed':
      return 'El registro con correo y contraseña no está habilitado en Firebase. Activa este proveedor en Authentication → Sign-in method.';
    case 'auth/email-not-verified':
      return 'Confirma tu dirección desde el enlace que enviamos a tu correo y luego inicia sesión.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Firebase. Revisa tu conexión e inténtalo nuevamente.';
    case 'auth/too-many-requests':
      return 'Hubo demasiados intentos. Espera unos minutos antes de volver a intentarlo.';
    case 'auth/unauthorized-domain':
      return 'Este dominio todavía no está autorizado en Firebase Authentication.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'La configuración de Firebase en Vercel no es válida. Revisa las variables VITE_FIREBASE_*.';
    case 'auth/app-not-authorized':
    case 'auth/configuration-not-found':
      return 'Firebase rechazó la configuración de esta aplicación. Revisa el proyecto y el proveedor de autenticación.';
    default:
      return import.meta.env.DEV && error?.code
        ? `Ocurrió un error de autenticación (${error.code}).`
        : 'Ocurrió un error al procesar tu solicitud. Inténtalo nuevamente.';
  }
}
