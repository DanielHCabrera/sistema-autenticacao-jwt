const jwt = require('jsonwebtoken')

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ mensagem: 'Token não foi reconhecido'})
    }

    const token = authHeader.split(' ')[1]; // Formato: "Berarer token"

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // disponivel nas próximas rotas/handlers
        return next();
    } catch (erro) {
        return res.status(401).json({ mensagem: 'Token inválido ou expirado' });
    }
 }

 module.exports = verificarToken;