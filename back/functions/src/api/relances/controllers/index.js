// const User = require('../../classes/user'); // Adjust path if necessary
const db = require('../../../config/firebase'); // Adjust path if necessary
const bcrypt = require('bcrypt'); // Add bcrypt import
// const sendEmail = require('../../../utils/sendmail');

class UserController {
  constructor() {
    this.collection = db.collection('relances');
  }


  async getAll(req, res) {
    try {
      const users = await this.collection.get();

      const data = users.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({
        status: true,
        data,
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: 'Error getting users',
        error: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const userDoc = await this.collection.doc(req.params.id).get();

      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found', status: false });
      }

      return res.status(200).json({
        status: true,
        data: { id: userDoc.id, ...userDoc.data() },
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Error retrieving user',
        status: false,
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const userRef = this.collection.doc(req.params.id);
      const doc = await userRef.get();

      if (!doc.exists) {
        return res.status(404).json({ message: 'User not found', status: false });
      }

      // if currentPassword exists and is not null, check if it is correct
      if (req.body.currentPassword) {
        const user = doc.data();
        if (!user.password || !(await bcrypt.compare(req.body.currentPassword, user.password))) {
          return res.status(401).json({ message: 'Mot de passe incorrect', status: false });
        }

        // If new password is provided, hash it
        if (req.body.password) {
          req.body.password = await bcrypt.hash(req.body.password, 10);
        }
      }

      const updates = { ...req.body, updatedAt: new Date() };
      await userRef.update(updates);

      const updatedUser = await userRef.get();

      return res.status(200).json({
        status: true,
        data: { id: updatedUser.id, ...updatedUser.data() },
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Error updating user',
        status: false,
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const userRef = this.collection.doc(req.params.id);
      const doc = await userRef.get();

      if (!doc.exists) {
        return res.status(404).json({ message: 'User not found', status: false });
      }

      await userRef.delete();

      return res.status(200).json({
        message: 'User deleted successfully',
        status: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Error deleting user',
        status: false,
        error: error.message,
      });
    }
  }

  // we will get the email from the body
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // check if the email is valid
      if (!email) {
        return res.status(400).json({ message: 'Email is required', status: false });
      }

      // Query users with matching email field
      const usersRef = await this.collection.where('email', '==', email).get();
      
      if (usersRef.empty) {
        return res.status(404).json({ message: 'User not found', status: false });
      }

      // Get the first matching user
      const userDoc = usersRef.docs[0];
      const userId = userDoc.id;
      
      // Generate a random 6-digit reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // Code expires in 1 hour
      
      // Store reset code and expiration in user document
      await this.collection.doc(userId).update({
        resetCode,
        resetExpires: resetExpires.toISOString()
      });

      // Send reset code to the email
      await sendEmail({
        to: email,
        subject: 'Mot de passe oublié',
        template: 'forgotPassword',
        context: { 
          code: resetCode,
          expires: resetExpires.toLocaleString()
        },
      });

      return res.status(200).json({ 
        message: 'Un code de réinitialisation a été envoyé à votre adresse e-mail',
        status: true 
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Error forgot password',
        status: false,
        error: error.message,
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, resetCode, newPassword } = req.body;

      if (!email || !resetCode || !newPassword) {
        return res.status(400).json({ 
          message: 'Email, reset code, and new password are required', 
          status: false 
        });
      }

      // Find user with matching email
      const usersRef = await this.collection.where('email', '==', email).get();
      
      if (usersRef.empty) {
        return res.status(404).json({ message: 'User not found', status: false });
      }

      // Get the user document
      const userDoc = usersRef.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Check if reset code exists and hasn't expired
      if (!userData.resetCode || userData.resetCode !== resetCode) {
        return res.status(400).json({ 
          message: 'Code de réinitialisation invalide', 
          status: false 
        });
      }

      const resetExpires = new Date(userData.resetExpires);
      if (resetExpires < new Date()) {
        return res.status(400).json({ 
          message: 'Le code de réinitialisation a expiré', 
          status: false 
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user with new password and clear reset fields
      await this.collection.doc(userId).update({
        password: hashedPassword,
        resetCode: null,
        resetExpires: null,
        updatedAt: new Date()
      });

      return res.status(200).json({
        message: 'Mot de passe réinitialisé avec succès',
        status: true
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Error resetting password',
        status: false,
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();
