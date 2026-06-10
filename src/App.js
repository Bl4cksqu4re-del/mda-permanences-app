import React, { useState, useEffect, useCallback } from 'react';
import API_URL from './config';
import './App.css';

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  type: 'TEL',
  prenom: '', nom: '',
  id_adherent: false, id_non_adherent: false,
  id_ancien_adherent: false, id_structure: false, id_autres: false,
  motif_declaration: false, motif_adjonction: false, motif_juridique: false,
  motif_social: false, motif_comptable_fiscal: false, motif_communication: false,
  motif_adhesion: false, motif_activite_artistique: false, motif_autres: false,
  mail: '', telephone: '',
  qui_ck: false, qui_kr: false, qui_lv: false,
  remarques: '', suivi: '', newsletter: false, comment_connu: '',
  tags: []
};

const ID_FIELDS = [
  { key: 'id_adherent', label: 'Adhérent·e' },
  { key: 'id_non_adherent', label: 'Non-adhérent·e' },
  { key: 'id_ancien_adherent', label: 'Ancien·ne adhérent·e' },
  { key: 'id_structure', label: 'Structure' },
  { key: 'id_autres', label: 'Autres' },
];

const MOTIF_FIELDS = [
  { key: 'motif_declaration', label: 'Déclaration' },
  { key: 'motif_adjonction', label: 'Adjonction' },
  { key: 'motif_juridique', label: 'Juridique' },
  { key: 'motif_social', label: 'Social (retraite…)' },
  { key: 'motif_comptable_fiscal', label: 'Comptable / Fiscal' },
  { key: 'motif_communication', label: 'Communication' },
  { key: 'motif_adhesion', label: 'Adhésion' },
  { key: 'motif_activite_artistique', label: 'Activité artistique' },
  { key: 'motif_autres', label: 'Autres' },
];

const MOTIF_LABELS = {
  declaration: 'Déclaration', adjonction: 'Adjonction', juridique: 'Juridique',
  social: 'Social', comptable_fiscal: 'Compta/Fiscal', communication: 'Communication',
  adhesion: 'Adhésion', activite_artistique: 'Activité artist.', autres: 'Autres'
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getMotifs(row) {
  return MOTIF_FIELDS.filter(f => row[f.key]).map(f => f.label).join(', ') || '—';
}

function getIdLabel(row) {
  return ID_FIELDS.filter(f => row[f.key]).map(f => f.label).join(', ') || '—';
}

function getQui(row) {
  return [row.qui_ck && 'CK', row.qui_kr && 'KR', row.qui_lv && 'LV'].filter(Boolean).join(', ') || '—';
}

// ── Login ──────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) { setError('Mot de passe incorrect.'); return; }
      const { token } = await res.json();
      onLogin(token);
    } catch { setError('Impossible de contacter le serveur.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">MDA</div>
        <h1 className="login-title">Suivi des permanences</h1>
        <p className="login-sub">La Maison des Artistes · 2026</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoFocus required />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── CheckPill ──────────────────────────────────────────────────────────────────
function CheckPill({ checked, onChange, label, accent }) {
  return (
    <label className={`pill ${checked ? 'pill--on' : ''} ${accent ? 'pill--accent' : ''}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

// ── Saisie de tags ─────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, allTags }) {
  const [input, setInput] = useState('');
  const suggestions = allTags.filter(t => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t));

  function addTag(tag) {
    const clean = tag.trim();
    if (clean && !tags.includes(clean)) onChange([...tags, clean]);
    setInput('');
  }

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag));
  }

  function handleKey(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="tag-input">
      <div className="tag-input__tags">
        {tags.map(t => (
          <span key={t} className="tag">
            {t}
            <button type="button" onClick={() => removeTag(t)} className="tag__remove">×</button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={tags.length === 0 ? 'Ajouter un tag…' : ''}
          className="tag-input__field"
        />
      </div>
      {input && suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.slice(0, 6).map(s => (
            <button key={s} type="button" className="tag-suggestion" onClick={() => addTag(s)}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Formulaire ─────────────────────────────────────────────────────────────────
function ContactForm({ initial, onSaved, onCancel, token, allTags }) {
  const [form, setForm] = useState(initial ? { ...initial, tags: initial.tags || [] } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.date) { setError('La date est obligatoire.'); return; }
    setSaving(true); setError('');
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `${API_URL}/contacts/${form.id}` : `${API_URL}/contacts`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved(await res.json(), !!form.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>

      {/* Nom / Prénom */}
      <div className="form-row">
        <div className="field">
          <label>Prénom</label>
          <input type="text" value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Prénom de l'artiste" />
        </div>
        <div className="field">
          <label>Nom</label>
          <input type="text" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom de l'artiste" />
        </div>
      </div>

      {/* Date / Type */}
      <div className="form-row form-row--top">
        <div className="field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>
        <div className="field">
          <label>Type</label>
          <div className="toggle-group">
            {['TEL', 'PRES'].map(t => (
              <button key={t} type="button" className={`toggle ${form.type === t ? 'toggle--on' : ''}`} onClick={() => set('type', t)}>
                {t === 'TEL' ? '📞 Téléphone' : '🤝 Présentiel'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <fieldset>
        <legend>Identification</legend>
        <div className="pills-row">
          {ID_FIELDS.map(f => <CheckPill key={f.key} label={f.label} checked={!!form[f.key]} onChange={v => set(f.key, v)} />)}
        </div>
      </fieldset>

      <fieldset>
        <legend>Motif(s)</legend>
        <div className="pills-row">
          {MOTIF_FIELDS.map(f => <CheckPill key={f.key} label={f.label} accent checked={!!form[f.key]} onChange={v => set(f.key, v)} />)}
        </div>
      </fieldset>

      <div className="form-row">
        <div className="field">
          <label>E-mail</label>
          <input type="email" value={form.mail} onChange={e => set('mail', e.target.value)} placeholder="artiste@example.com" />
        </div>
        <div className="field">
          <label>Téléphone</label>
          <input type="text" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 XX XX XX XX" />
        </div>
      </div>

      <fieldset>
        <legend>Conseiller·ère</legend>
        <div className="pills-row">
          {[['qui_ck','CK'],['qui_kr','KR'],['qui_lv','LV']].map(([k,l]) => (
            <CheckPill key={k} label={l} checked={!!form[k]} onChange={v => set(k, v)} />
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label>Remarques / Thèmes</label>
        <textarea rows={3} value={form.remarques} onChange={e => set('remarques', e.target.value)} placeholder="Résumé de l'échange…" />
      </div>

      <div className="field">
        <label>Suivi</label>
        <textarea rows={2} value={form.suivi} onChange={e => set('suivi', e.target.value)} placeholder="À rappeler, transmis à…" />
      </div>

      <div className="form-row">
        <div className="field">
          <label>Comment nous ont-ils connu ?</label>
          <input type="text" value={form.comment_connu} onChange={e => set('comment_connu', e.target.value)} placeholder="Cercle Pro, Internet…" />
        </div>
        <div className="field field--center">
          <label>Newsletter</label>
          <CheckPill label="Inscription NL" checked={!!form.newsletter} onChange={v => set('newsletter', v)} />
        </div>
      </div>

      {/* Tags */}
      <div className="field">
        <label>Tags <span className="field-hint">Entrée ou virgule pour valider</span></label>
        <TagInput tags={form.tags || []} onChange={tags => set('tags', tags)} allTags={allTags} />
      </div>

      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>}
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Enregistrement…' : (form.id ? 'Mettre à jour' : 'Enregistrer le contact')}
        </button>
      </div>
    </form>
  );
}

// ── Tableau ────────────────────────────────────────────────────────────────────
function ContactTable({ contacts, onEdit, onDelete }) {
  if (!contacts.length) return <div className="empty-state">Aucun contact enregistré pour cette période.</div>;
  return (
    <div className="table-wrapper">
      <table className="contacts-table">
        <thead>
          <tr>
            <th>Date</th><th>Type</th><th>Artiste</th><th>Profil</th><th>Motif(s)</th>
            <th>Mail</th><th>Qui</th><th>Remarques</th><th>Tags</th><th></th>
          </tr>
        </thead>
        <tbody>
          {contacts.map(row => (
            <tr key={row.id}>
              <td className="td-date">{formatDate(row.date)}</td>
              <td><span className={`badge badge--${row.type.toLowerCase()}`}>{row.type}</span></td>
              <td className="td-artiste">{[row.prenom, row.nom].filter(Boolean).join(' ') || '—'}</td>
              <td className="td-profil">{getIdLabel(row)}</td>
              <td className="td-motif">{getMotifs(row)}</td>
              <td className="td-mail">{row.mail ? <a href={`mailto:${row.mail}`}>{row.mail}</a> : '—'}</td>
              <td>{getQui(row)}</td>
              <td className="td-remarques" title={row.remarques}>{row.remarques || '—'}</td>
              <td className="td-tags">
                {(row.tags || []).map(t => <span key={t} className="tag tag--sm">{t}</span>)}
              </td>
              <td className="td-actions">
                <button className="btn-icon" onClick={() => onEdit(row)} title="Modifier">✏️</button>
                <button className="btn-icon btn-icon--del" onClick={() => onDelete(row.id)} title="Supprimer">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function StatBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="stat-bar">
      <div className="stat-bar__label">{label}</div>
      <div className="stat-bar__track"><div className="stat-bar__fill" style={{ width: `${pct}%`, background: color || 'var(--blue)' }} /></div>
      <div className="stat-bar__val">{value}</div>
    </div>
  );
}

function Dashboard({ stats }) {
  if (!stats) return <div className="loading">Chargement…</div>;
  const total = (stats.byType || []).reduce((s, r) => s + parseInt(r.n), 0);
  const tel = stats.byType?.find(r => r.type === 'TEL')?.n || 0;
  const pres = stats.byType?.find(r => r.type === 'PRES')?.n || 0;
  const motifs = stats.byMotif || {};
  const maxMotif = Math.max(...Object.values(motifs).map(Number), 1);
  const qui = stats.byQui || {};
  return (
    <div className="dashboard">
      <div className="stats-cards">
        <div className="stat-card"><span className="stat-card__val">{total}</span><span className="stat-card__label">Contacts total</span></div>
        <div className="stat-card stat-card--tel"><span className="stat-card__val">{tel}</span><span className="stat-card__label">📞 Téléphone</span></div>
        <div className="stat-card stat-card--pres"><span className="stat-card__val">{pres}</span><span className="stat-card__label">🤝 Présentiel</span></div>
      </div>
      <div className="stats-section">
        <h3>Motifs</h3>
        {Object.entries(MOTIF_LABELS).map(([k, l]) => (
          <StatBar key={k} label={l} value={Number(motifs[k]) || 0} max={maxMotif} color="var(--blue)" />
        ))}
      </div>
      <div className="stats-section">
        <h3>Par conseiller·ère</h3>
        {[['ck','CK'],['kr','KR'],['lv','LV']].map(([k,l]) => (
          <StatBar key={k} label={l} value={Number(qui[k])||0} max={Math.max(Number(qui.ck)||0, Number(qui.kr)||0, Number(qui.lv)||0, 1)} color="var(--yellow)" />
        ))}
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('mda_token') || '');
  const [view, setView] = useState('list');
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [filters, setFilters] = useState({ type: '', from: '', to: '', tag: '' });
  const [loading, setLoading] = useState(false);

  function handleLogin(t) { sessionStorage.setItem('mda_token', t); setToken(t); }
  function handleLogout() { sessionStorage.removeItem('mda_token'); setToken(''); }

  const apiFetch = useCallback((url, options = {}) =>
    fetch(url, { ...options, headers: { ...(options.headers || {}), 'Authorization': token } }),
    [token]
  );

  const loadContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.from) params.set('from', filters.from);
    if (filters.to)   params.set('to', filters.to);
    if (filters.tag)  params.set('tag', filters.tag);
    try {
      const res = await apiFetch(`${API_URL}/contacts?${params}`);
      if (res.status === 401) { handleLogout(); return; }
      setContacts(await res.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters, apiFetch]);

  const loadTags = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tags`);
      setAllTags(await res.json());
    } catch(e) { console.error(e); }
  }, []);

  const loadStats = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to)   params.set('to', filters.to);
    try {
      const res = await apiFetch(`${API_URL}/stats?${params}`);
      setStats(await res.json());
    } catch(e) { console.error(e); }
  }, [filters, apiFetch]);

  useEffect(() => { if (token) { loadContacts(); loadTags(); } }, [token, loadContacts, loadTags]);
  useEffect(() => { if (token && view === 'stats') loadStats(); }, [token, view, loadStats]);

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  function handleSaved(contact, isUpdate) {
    if (isUpdate) setContacts(cs => cs.map(c => c.id === contact.id ? contact : c));
    else setContacts(cs => [contact, ...cs]);
    loadTags();
    setEditing(null);
    setView('list');
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce contact ?')) return;
    await apiFetch(`${API_URL}/contacts/${id}`, { method: 'DELETE' });
    setContacts(cs => cs.filter(c => c.id !== id));
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.from) params.set('from', filters.from);
    if (filters.to)   params.set('to', filters.to);
    params.set('auth', token);
    window.open(`${API_URL}/export/csv?${params}`, '_blank');
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo" onClick={() => { setEditing(null); setView('list'); }} style={{cursor:'pointer'}}>MDA</span>
          <div>
            <div className="app-header__title">Suivi des permanences</div>
            <div className="app-header__sub">La Maison des Artistes · 2026</div>
          </div>
        </div>
        <nav className="app-nav">
          <button className={`nav-btn ${view === 'list' ? 'nav-btn--on' : ''}`} onClick={() => { setEditing(null); setView('list'); }}>Liste</button>
          <button className={`nav-btn ${view === 'new' ? 'nav-btn--on' : ''}`} onClick={() => { setEditing(null); setView('new'); }}>+ Nouveau</button>
          <button className={`nav-btn ${view === 'stats' ? 'nav-btn--on' : ''}`} onClick={() => setView('stats')}>Statistiques</button>
          <button className="nav-btn nav-btn--logout" onClick={handleLogout}>⎋ Déconnexion</button>
        </nav>
      </header>

      <div className="app-filters">
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          <option value="">Tous types</option>
          <option value="TEL">Téléphone</option>
          <option value="PRES">Présentiel</option>
        </select>
        <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
        <input type="date" value={filters.to}   onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
        <select value={filters.tag} onChange={e => setFilters(f => ({ ...f, tag: e.target.value }))}>
          <option value="">Tous tags</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn btn--ghost btn--sm" onClick={() => setFilters({ type: '', from: '', to: '', tag: '' })}>Réinitialiser</button>
        <button className="btn btn--export btn--sm" onClick={handleExport}>⬇ Export CSV</button>
        <span className="filter-count">{contacts.length} contact{contacts.length > 1 ? 's' : ''}</span>
      </div>

      <main className="app-main">
        {view === 'new' && !editing && (
          <section className="section-form">
            <h2>Nouveau contact</h2>
            <ContactForm token={token} allTags={allTags} onSaved={handleSaved} onCancel={() => setView('list')} />
          </section>
        )}
        {editing && (
          <section className="section-form">
            <h2>Modifier le contact</h2>
            <ContactForm token={token} allTags={allTags} initial={editing} onSaved={handleSaved} onCancel={() => { setEditing(null); setView('list'); }} />
          </section>
        )}
        {view === 'list' && !editing && (
          <section>
            {loading ? <div className="loading">Chargement…</div> : <ContactTable contacts={contacts} onEdit={row => setEditing(row)} onDelete={handleDelete} />}
          </section>
        )}
        {view === 'stats' && !editing && <section><Dashboard stats={stats} /></section>}
      </main>
    </div>
  );
}
