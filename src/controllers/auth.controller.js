const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const supabase = require('../services/supabase');

const authController = {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName } = req.body;

      // Create user in Supabase Auth with auto-confirm
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirmer l'email
        user_metadata: { full_name: fullName }
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          full_name: fullName,
          username: email.split('@')[0]
        }]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: data.user.id, email: data.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName
        },
        token
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Generate JWT token
      const token = jwt.sign(
        { userId: data.user.id, email: data.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          ...profile
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async logout(req, res) {
    try {
      await supabase.auth.signOut();
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getProfile(req, res) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.userId)
        .single();

      if (error) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { fullName, username, avatarUrl, currentLevel } = req.body;
      
      const updates = {};
      if (fullName) updates.full_name = fullName;
      if (username) updates.username = username;
      if (avatarUrl) updates.avatar_url = avatarUrl;
      if (currentLevel) updates.current_level = currentLevel;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', req.userId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({
        message: 'Profile updated successfully',
        profile: data
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async resetPasswordRequest(req, res) {
    try {
      const { email } = req.body;
      
      // Vérifier si l'utilisateur existe
      const { data: users, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('username', email.split('@')[0])
        .single();
      
      if (fetchError || !users) {
        // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
        return res.json({ 
          message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' 
        });
      }
      
      // Générer un token de réinitialisation
      const resetToken = jwt.sign(
        { userId: users.id, email, type: 'password-reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // En production, vous devriez envoyer un email avec le lien
      // Pour l'instant, on retourne le token pour les tests
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      console.log('Reset link:', resetLink);
      
      res.json({ 
        message: 'Un email de réinitialisation a été envoyé.',
        // En dev seulement - à retirer en production
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
    }
  },

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== 'password-reset') {
        return res.status(400).json({ error: 'Token invalide' });
      }
      
      // Mettre à jour le mot de passe dans Supabase Auth
      const { data, error } = await supabase.auth.admin.updateUserById(
        decoded.userId,
        { password: newPassword }
      );
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      res.json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({ error: 'Le lien de réinitialisation a expiré' });
      }
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
    }
  }
};

module.exports = authController;