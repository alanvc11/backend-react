const express = require('express');
const router = express.Router();

const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.get('/me', (req, res) => {
    if(req.session.user && req.session.token) {
        res.json({
            user: req.session.user,
            token: req.session.token
        });
    } else {
        res.status(401).json({ error: 'Usuário não autenticado.' });
    }
});


router.post('/', async (req, res) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !password) {
        errors.push('Todos os campos são obrigatórios.');
        return res.status(400).json({ errors });
    }

    if (password.length < 8) {
        errors.push('A senha deve conter pelo menos 8 caracteres.');
        return res.status(400).json({ errors });
    }

    try {
        const user = await User.findOne({ where: { email: email } });

        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.senha);

            if (isPasswordValid) {
                const token = jwt.sign({ email: user.email, userId: user.id }, process.env.secret, { expiresIn: '1h' });
                req.session.token = token;
                req.session.user = {id: user.id, name: user.nome, email: user.email};
                res.status(200).json({ user: req.session.user, token: token, msg: 'Usuário logado.' });
            } else {
                res.status(401).json({ errors: ['Senha incorreta.'] });
            }
        } else {
            res.status(401).json({ errors: ['Usuário não encontrado.'] });
        }
    } catch (error) {
        res.status(500).json(err);
    }

});

module.exports = router;