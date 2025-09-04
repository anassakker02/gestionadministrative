const db = require('../../../config/firebase');
const sendEmail = require('../../../utils/sendmail'); // import corrigé

class UsersController {
  constructor() {
    this.collection = db.collection('users');
  }

  async sendPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Adresse email requise', status: false });
      }

      const users = await db.collection('users').where('email', '==', email).get();
      if (users.empty) {
        return res.status(404).json({ message: 'Aucun utilisateur trouvé', status: false });
      }

      const resetToken = 'dummy-token'; // placeholder si JWT non utilisé pour l'instant

      const resetLink = `http://127.0.0.1:5001/reset-password?token=${resetToken}`;

      await sendEmail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        template: 'verificationForPassword',
        context: { resetLink, email, expiresIn: '15 minutes' },
      });

      return res.status(200).json({ status: true, message: 'Email de réinitialisation envoyé' });
    } catch (error) {
      console.error('Error in sendPasswordReset:', error);
      return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email', status: false });
    }
  }
}

module.exports = new UsersController();

