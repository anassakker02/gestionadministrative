const User = require('../../../classes/user'); 
const db = require('../../../config/firebase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sendEmail = require('../../../utils/sendmail');
const crypto = require('crypto'); 
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

      // Generate a verification code
      const verificationCode = crypto.randomInt(1000, 9999);  // Generate a 4-digit code

      // Create the new user object
      const newUser = {
        email,
        password: hashedPassword,
        nom,
        prenom,
        createdAt: new Date(),
      };

      // Add user to Firestore
      const userDoc = await db.collection('users').add(newUser);

      // Send the verification code email
      // await sendEmail({
      //   to: email,
      //   subject: 'Vérification de votre Email',
      //   template: 'verificationForEmail',
      //   context: { code: verificationCode },  // Send the code to the template
      // });

      return res.status(200).json({ message: 'Inscription réussie. Un email de vérification a été envoyé.', status: true, id: userDoc.id });
    } catch (error) {
      console.error('Error in register method:', error);
      return res.status(500).json({
        message: 'Erreur lors de l\'inscription',
        status: false,
        error: error.message,
      });
    }
  }

  // Verify email with the code
  // async verifyEmail(req, res) {
  //   try {
  //     const { email, code } = req.body;

  //     if (!code) return res.status(400).json({ message: 'Code de vérification requis' });

  //     const users = await db.collection('users').where('email', '==', email).get();
  //     if (users.empty) return res.status(404).json({ message: 'Utilisateur non trouvé' });

  //     const userDoc = users.docs[0];
  //     const user = userDoc.data();

  //     if (user.verificationCode !== parseInt(code)) {
  //       return res.status(400).json({ message: 'Code de vérification incorrect' });
  //     }

  //     await userDoc.ref.update({ isVerified: true, verificationCode: null });

  //     return res.status(200).json({ status: true, message: 'Email vérifié avec succès', id: userDoc.id });
  //   } catch (error) {
  //     return res.status(500).json({ message: 'Erreur lors de la vérification de l\'email', status: false, error: error.message });
  //   }
  // }

  // Login a user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const users = await db.collection('users').where('email', '==', email).get();

      if (users.empty) return res.status(404).json({ message: 'Utilisateur non trouvé', status: false });

      const userData = users.docs[0].data();
      const user = new User(userData);
      user.id = users.docs[0].id;

      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) return res.status(401).json({ message: 'Mot de passe incorrect', status: false });

      // if (!user.isVerified) return res.status(403).json({ message: 'Compte non vérifié, veuillez contacter l\'administrateur', status: false });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_KEY_SECRET, { expiresIn: '1h' });

      return res.status(200).json({
        status: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            role: user.role,
          },
        },
      });
    } catch (error) {
      return res.status(500).json({ message: 'Erreur lors de la connexion', status: false, error: error.message });
    }
  }

  // Send Password Reset Email
  async sendPasswordReset(req, res) {
    try {
      const { email } = req.body;

      // Vérifier si l'email est fourni
      if (!email) {
        return res.status(400).json({ 
          message: 'Adresse email requise', 
          status: false 
        });
      }

      // Vérifier que la clé JWT est configurée
      if (!process.env.JWT_KEY_SECRET) {
        console.error('JWT_KEY_SECRET is not configured');
        return res.status(500).json({ 
          message: 'Erreur de configuration du serveur', 
          status: false 
        });
      }

      // Vérifier si l'utilisateur existe
      const users = await db.collection('users').where('email', '==', email).get();
      if (users.empty) {
        return res.status(404).json({ 
          message: 'Aucun utilisateur trouvé avec cette adresse email', 
          status: false 
        });
      }

      // Générer un token de réinitialisation (15 minutes)
      const resetToken = jwt.sign({ email }, process.env.JWT_KEY_SECRET, { expiresIn: '15m' });
      
      // Créer le lien de réinitialisation
      const resetLink = `http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1/auth/password_reset?token=${resetToken}`;

      // Envoyer l'email de réinitialisation
      await sendEmail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        template: 'verificationForPassword',
        context: { 
          resetLink,
          email: email,
          expiresIn: '15 minutes'
        },
      });

      return res.status(200).json({ 
        status: true, 
        message: 'Email de réinitialisation envoyé avec succès. Vérifiez votre boîte de réception.' 
      });
    } catch (error) {
      console.error('Error in sendPasswordReset:', error);
      return res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de l\'email de réinitialisation', 
        status: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new UserController();
