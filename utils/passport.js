const passport = require('passport');
const bcrypt = require('bcrypt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db'); 

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  const name  = profile.displayName;

  try {
    
    let userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;
    if (userRes.rowCount) {
      user = userRes.rows[0];
    } else {
      const randomPass = Math.random().toString(36).slice(-8);          
      const hashed = await bcrypt.hash(randomPass, 10);

      const insertRes = await pool.query(
        `INSERT INTO users (name, email, password, role, status, is_google)
         VALUES ($1,$2,$3,$4,$5, $6) RETURNING *`,
        [name, email, hashed, 2, 2, true]
      );
      user = insertRes.rows[0];
    }
    
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));


passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (res.rows.length > 0) {
      // User found, pass the user object
      done(null, res.rows[0]);
    } else {
      // User not found with the given ID in the database
      // This means the user ID in the session is no longer valid.
      console.warn(`[Deserialize Error]: User with ID ${id} not found in DB.`);
      done(new Error('User not found or session invalid.'), null);
    }
  } catch (err) {
    // Handle any database query errors
    console.error("[Deserialize Error]: Database query failed:", err);
    done(err, null);
  }
});

module.exports = passport;
