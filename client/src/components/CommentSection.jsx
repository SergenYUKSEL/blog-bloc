import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { User, Trash2, Edit, Check, X } from 'lucide-react';

const CommentSection = ({ articleId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newContent, setNewContent] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [error, setError] = useState('');

    const fetchComments = async () => {
        try {
            const { data } = await API.get(`/articles/${articleId}/comments`);
            setComments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [articleId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!newContent.trim()) return;
        try {
            const { data } = await API.post(`/articles/${articleId}/comments`, { content: newContent });
            setComments(prev => [...prev, data]);
            setNewContent('');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'envoi.');
        }
    };

    const handleEdit = async (id) => {
        setError('');
        if (!editContent.trim()) return;
        try {
            const { data } = await API.put(`/comments/${id}`, { content: editContent });
            setComments(prev =>
                prev.map(c => c.id === id ? { ...c, content: data.content } : c)
            );
            setEditingId(null);
            setEditContent('');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la modification.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce commentaire ?')) return;
        try {
            await API.delete(`/comments/${id}`);
            setComments(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression.');
        }
    };

    const startEdit = (comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
        setError('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
        setError('');
    };

    return (
        <section style={{ marginTop: '50px', borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '24px' }}>
                Commentaires ({comments.length})
            </h2>

            {error && (
                <p style={{ color: '#ef4444', marginBottom: '12px' }}>{error}</p>
            )}

            {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>Chargement des commentaires...</p>
            ) : comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Aucun commentaire pour l'instant.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {comments.map(comment => (
                        <li key={comment.id} className="glass" style={{ padding: '16px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                {comment.avatar ? (
                                    <img
                                        src={`http://localhost:5030${comment.avatar}`}
                                        alt={comment.username}
                                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <User size={20} />
                                )}
                                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{comment.username}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            {editingId === comment.id ? (
                                <div>
                                    <textarea
                                        value={editContent}
                                        onChange={e => setEditContent(e.target.value)}
                                        style={{ width: '100%', minHeight: '80px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box' }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                        <button
                                            onClick={() => handleEdit(comment.id)}
                                            className="btn"
                                            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                                        >
                                            <Check size={14} /> Sauvegarder
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="btn glass"
                                            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                                        >
                                            <X size={14} /> Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div
                                        style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
                                    />
                                    {user && user.id === comment.user_id && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                            <button
                                                onClick={() => startEdit(comment)}
                                                className="btn glass"
                                                style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                                            >
                                                <Edit size={12} /> Modifier
                                            </button>
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="btn"
                                                style={{ padding: '4px 10px', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                                            >
                                                <Trash2 size={12} /> Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <div style={{ marginTop: '30px' }}>
                {user ? (
                    <form onSubmit={handleSubmit}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Laisser un commentaire</h3>
                        <textarea
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder="Votre commentaire..."
                            style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box', fontSize: '1rem' }}
                        />
                        <button
                            type="submit"
                            className="btn"
                            style={{ marginTop: '10px', padding: '10px 20px' }}
                            disabled={!newContent.trim()}
                        >
                            Publier
                        </button>
                    </form>
                ) : (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Connectez-vous pour laisser un commentaire.
                    </p>
                )}
            </div>
        </section>
    );
};

export default CommentSection;
