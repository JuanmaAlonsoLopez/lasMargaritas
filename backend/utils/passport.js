const passport = require('passport');
const bcrypt = require('bcrypt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db'); // tu conexión a Postgres

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  const name  = profile.displayName;

  try {
    // 1) Busca al usuario por email
    let userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;
    if (userRes.rowCount) {
      user = userRes.rows[0];
    } else {
      // 2) Si no existe, lo creas con status=2 (activado por Google)
      const randomPass = Math.random().toString(36).slice(-8);            // e.g. 'a1b2c3d4'
      const hashed = await bcrypt.hash(randomPass, 10);

      const insertRes = await pool.query(
        `INSERT INTO users (name, email, password, role, status, is_google)
         VALUES ($1,$2,$3,$4,$5, $6) RETURNING *`,
        [name, email, hashed, 2, 2, true]
      );
      user = insertRes.rows[0];
    }
    // 3) Continúa con Passport
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

// Serialize & deserialize (para sesiones, si las usas)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  done(null, res.rows[0]);
});

module.exports = passport;
