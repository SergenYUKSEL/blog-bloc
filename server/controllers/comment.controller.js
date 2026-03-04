const { pool } = require('../config/db');
const sanitizeHtml = require('sanitize-html');

const sanitizeOptions = {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'blockquote'],
    allowedAttributes: { a: ['href'] },
};

exports.getCommentsByArticle = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT comments.*, users.username, users.avatar
             FROM comments
             JOIN users ON comments.user_id = users.id
             WHERE comments.article_id = ?
             ORDER BY comments.created_at ASC`,
            [req.params.articleId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createComment = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Le contenu du commentaire ne peut pas être vide.' });
        }

        const sanitized = sanitizeHtml(content.trim(), sanitizeOptions);

        const [result] = await pool.query(
            'INSERT INTO comments (content, article_id, user_id) VALUES (?, ?, ?)',
            [sanitized, req.params.articleId, req.userId]
        );

        const [rows] = await pool.query(
            `SELECT comments.*, users.username, users.avatar
             FROM comments
             JOIN users ON comments.user_id = users.id
             WHERE comments.id = ?`,
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Le contenu du commentaire ne peut pas être vide.' });
        }

        const [comments] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
        if (comments.length === 0) return res.status(404).json({ message: 'Commentaire introuvable.' });
        if (comments[0].user_id !== req.userId) return res.status(403).json({ message: 'Non autorisé.' });

        const sanitized = sanitizeHtml(content.trim(), sanitizeOptions);

        await pool.query('UPDATE comments SET content = ? WHERE id = ?', [sanitized, req.params.id]);

        res.json({ message: 'Commentaire modifié.', content: sanitized });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const [comments] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
        if (comments.length === 0) return res.status(404).json({ message: 'Commentaire introuvable.' });
        if (comments[0].user_id !== req.userId) return res.status(403).json({ message: 'Non autorisé.' });

        await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Commentaire supprimé.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
