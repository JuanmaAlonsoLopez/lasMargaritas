const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db'); 

/**
 * =================================================================
 * Configuración de la Estrategia de Google (GoogleStrategy)
 * =================================================================
 * Passport utiliza "estrategias" para diferentes métodos de autenticación.
 * Aquí, configuramos la estrategia para "Iniciar Sesión con Google".
 */
passport.use(new GoogleStrategy({
    // Estas son las credenciales de tu aplicación en Google Cloud Console.
    // Se cargan de forma segura desde las variables de entorno.
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL, // La URL a la que Google redirige tras el login.
    scope: ['profile', 'email'] // Solicitamos el perfil y el email del usuario.
  }, 
  /**
   * Esta función es el "verify callback". Se ejecuta DESPUÉS de que el usuario
   * se autentica en Google y autoriza a tu aplicación.
   * Recibe el perfil del usuario desde Google.
   */
  async (accessToken, refreshToken, profile, done) => {
    // Extraemos la información que nos interesa del perfil de Google.
    const email = profile.emails && profile.emails[0].value;
    const name  = profile.displayName;

    // Verificamos si tenemos un email para continuar.
    if (!email) {
      return done(new Error('No se pudo obtener el email de Google.'), null);
    }

    try {
      // 1. Buscamos si el usuario ya existe en nuestra base de datos.
      const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      let user = userResult.rows[0];

      // 2. Si el usuario NO existe, lo creamos.
      if (!user) {
        console.log(`Creando nuevo usuario de Google: ${name} (${email})`);
        // NOTA: No se genera una contraseña aleatoria porque no es necesaria para el login de Google.
        // El campo 'password' puede ser NULL o un valor placeholder.
        const newUserResult = await pool.query(
          `INSERT INTO users (name, email, role, status, is_google)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [name, email, 'user', 'active', true] // 'role' y 'status' pueden variar según tu lógica
        );
        user = newUserResult.rows[0];
      }
      
      // 3. Si todo fue bien (usuario encontrado o creado), pasamos el objeto 'user' a Passport.
      return done(null, user);

    } catch (err) {
      console.error("Error en la estrategia de Google:", err);
      return done(err, null);
    }
  }
));


/**
 * =================================================================
 * Serialización y Deserialización de Usuario
 * =================================================================
 * Estas funciones son cruciales para que las sesiones de login persistan.
 */

// `serializeUser` determina qué datos del usuario se deben almacenar en la sesión.
// Generalmente, solo se guarda el ID del usuario para mantener la sesión ligera.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// `deserializeUser` se llama en cada petición para obtener los datos completos
// del usuario a partir del ID que se guardó en la sesión.
passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query('SELECT id, name, email, role, status FROM users WHERE id = $1', [id]);
    if (res.rows.length > 0) {
      done(null, res.rows[0]);
    } else {
      done(new Error('Usuario no encontrado en la sesión.'), null);
    }
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;