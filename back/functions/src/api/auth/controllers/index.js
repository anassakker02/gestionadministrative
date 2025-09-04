// const User = require('../../../classes/user'); // eslint-disable-line no-unused-vars
const db = require('../../../config/firebase');
// const jwt = require('jsonwebtoken'); // eslint-disable-line no-unused-vars
const bcrypt = require('bcrypt');
// const sendEmail = require('../../../utils/sendmail'); // eslint-disable-line no-unused-vars
require('dotenv').config();

class UserController {
  constructor() {
    this.collection = db.collection('users');
  }

  // Register a new user
  async register(req, res) {
    try {
      const { email, password, nom, prenom } = req.body;

      if (!email || !password || !nom || !prenom) {
        return res.status(400).json({ message: 'Missing required fields', status: false });
      }

      // Check if email already exists
      const existingUser = await db.collection('users').where('email', '==', email).get();
      if (!existingUser.empty) {
        return res.status(400).json({ message: 'L\'email existe déjà', status: false });
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate a verification code (pour futur usage)
      // const verificationCode = crypto.randomInt(1000, 9999); // eslint-disable-line no-unused-vars

      // Create the new user object
      const newUser = {
        email,
        password: hashedPassword,
        nom,
        prenom,
        createdAt: new Date(),
      };

      // Add user to Firestore
      await db.collection('users').add(newUser);

      return res.status(200).json({ message: 'Inscription réussie', status: true });
    } catch (error) {
      console.error('Error in register method:', error);
      return res.status(500).json({ message: 'Erreur lors de l\'inscription', status: false });
    }
  }
}

module.exports = new UserController();

