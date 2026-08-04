import React, { useState, useEffect, useCallback } from 'react';
import API_URL from './config';
import './App.css';

const getDefaultType = () => {
  const day = new Date().getDay(); // 0=dim, 1=lun, 2=mar, 3=mer, 4=jeu, 5=ven, 6=sam
  return [4, 5].includes(day) ? 'PRES' : 'TEL';
};

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  type: getDefaultType(),
  prenom: '', nom: '', numero_adherent: '',
  id_adherent: false, id_non_adherent: false,
  id_ancien_adherent: false, id_structure: false, id_autres: false,
  motif_declaration: false, motif_adjonction: false, motif_juridique: false,
  motif_social: false, motif_comptable_fiscal: false, motif_communication: false,
  motif_adhesion: false, motif_activite_artistique: false, motif_autres: false,
  mail: '', telephone: '',
  qui_ck: false, qui_kr: false, qui_lv: false, qui_vc: false, qui_cc: false,
  remarques: '', suivi: '', newsletter: false, comment_connu: '',
  motifs_custom: [], a_rappeler: false
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

const CONSEILLERS = [
  { key: 'qui_ck', label: 'CK' }, { key: 'qui_kr', label: 'KR' },
  { key: 'qui_lv', label: 'LV' }, { key: 'qui_vc', label: 'VC' },
  { key: 'qui_cc', label: 'CC' },
];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getMotifs(row, customMotifs) {
  const fixed = MOTIF_FIELDS.filter(f => row[f.key]).map(f => f.label);
  const custom = (row.motifs_custom || []).map(id => {
    const m = (customMotifs || []).find(cm => cm.id === id);
    return m ? m.label : null;
  }).filter(Boolean);
  return [...fixed, ...custom].join(', ') || '—';
}

function getIdLabel(row) {
  return ID_FIELDS.filter(f => row[f.key]).map(f => f.label).join(', ') || '—';
}

function getQui(row) {
  return CONSEILLERS.filter(c => row[c.key]).map(c => c.label).join(', ') || '—';
}

function Footer() {
  return (
    <footer className="app-footer">
      <p>Tous droits réservés © Bl4cksquare art. L111-1 du CPI</p>
    </footer>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
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
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Erreur de connexion'); return; }
      const { token, user } = await res.json();
      onLogin(token, user);
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
            <label>Identifiant</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="prenom.nom" autoFocus required />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function ChangePasswordModal({ token, onClose, showToast }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.next !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    if (form.next.length < 6) { setError('Minimum 6 caractères'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API_URL}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ current_password: form.current, new_password: form.next })
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); return; }
      showToast('Mot de passe modifié');
      onClose();
    } catch { setError('Erreur serveur'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Changer mon mot de passe</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="field"><label>Mot de passe actuel</label><input type="password" value={form.current} onChange={e => setForm(f => ({...f, current: e.target.value}))} required /></div>
          <div className="field"><label>Nouveau mot de passe</label><input type="password" value={form.next} onChange={e => setForm(f => ({...f, next: e.target.value}))} required /></div>
          <div className="field"><label>Confirmer</label><input type="password" value={form.confirm} onChange={e => setForm(f => ({...f, confirm: e.target.value}))} required /></div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Modifier'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ token, showToast }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', display_name: '', initiales: '', is_admin: false });
  const [resetId, setResetId] = useState(null);
  const [resetPwd, setResetPwd] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/users`, { headers: { 'Authorization': token } })
      .then(r => r.json()).then(setUsers).catch(console.error);
  }, [token]);

  async function handleAdd(e) {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(form)
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); return; }
      setUsers(us => [...us, d]);
      setForm({ username: '', password: '', display_name: '', initiales: '', is_admin: false });
      showToast('Compte créé');
    } catch { setError('Erreur serveur'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce compte ?')) return;
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': token } });
    setUsers(us => us.filter(u => u.id !== id));
    showToast('Compte supprimé', 'error');
  }

  async function handleReset(e) {
    e.preventDefault();
    if (!resetPwd || resetPwd.length < 6) { setError('Minimum 6 caractères'); return; }
    const res = await fetch(`${API_URL}/users/${resetId}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ new_password: resetPwd })
    });
    if (res.ok) { showToast('Mot de passe réinitialisé'); setResetId(null); setResetPwd(''); }
  }

  return (
    <div className="admin-panel">
      <h2>Gestion des comptes</h2>

      <div className="admin-users">
        <table className="contacts-table">
          <thead><tr><th>Identifiant</th><th>Nom</th><th>Initiales</th><th>Admin</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.display_name}</td>
                <td><span className="badge badge--tel">{u.initiales}</span></td>
                <td>{u.is_admin ? '✓' : ''}</td>
                <td className="td-actions">
                  <button className="btn-icon" onClick={() => { setResetId(u.id); setResetPwd(''); }} title="Réinitialiser le mot de passe">🔑</button>
                  <button className="btn-icon btn-icon--del" onClick={() => handleDelete(u.id)} title="Supprimer">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetId && (
        <div className="admin-section">
          <h3>Réinitialiser le mot de passe</h3>
          <form onSubmit={handleReset} className="motif-add">
            <input type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)} placeholder="Nouveau mot de passe" minLength={6} required />
            <button type="submit" className="btn btn--sm btn--primary">Enregistrer</button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => setResetId(null)}>Annuler</button>
          </form>
        </div>
      )}

      <div className="admin-section">
        <h3>Ajouter un compte</h3>
        <form onSubmit={handleAdd} className="admin-form">
          <div className="form-row">
            <div className="field"><label>Identifiant</label><input type="text" value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} placeholder="prenom.nom" required /></div>
            <div className="field"><label>Mot de passe</label><input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Min. 6 caractères" required /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Nom complet</label><input type="text" value={form.display_name} onChange={e => setForm(f => ({...f, display_name: e.target.value}))} placeholder="Prénom Nom" required /></div>
            <div className="field"><label>Initiales</label><input type="text" value={form.initiales} onChange={e => setForm(f => ({...f, initiales: e.target.value.toUpperCase()}))} placeholder="XX" maxLength={5} required /></div>
          </div>
          <label className="pill" style={{width:'fit-content'}}>
            <input type="checkbox" checked={form.is_admin} onChange={e => setForm(f => ({...f, is_admin: e.target.checked}))} />
            Administrateur
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">Créer le compte</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckPill({ checked, onChange, label, accent }) {
  return (
    <label className={`pill ${checked ? 'pill--on' : ''} ${accent ? 'pill--accent' : ''}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function ContactForm({ initial, onSaved, onCancel, token, customMotifs, onMotifAdded, onMotifDeleted, currentUser }) {
  const initForm = () => {
    const base = initial ? { ...initial, motifs_custom: initial.motifs_custom || [] } : { ...EMPTY_FORM };
    if (base.date) base.date = base.date.slice(0, 10);
    if (!initial && currentUser?.initiales) {
      const key = `qui_${currentUser.initiales.toLowerCase()}`;
      if (key in base) base[key] = true;
    }
    return base;
  };
  const [form, setForm] = useState(initForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newMotif, setNewMotif] = useState('');
  const [addingMotif, setAddingMotif] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function handleAddMotif(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!newMotif.trim()) return;
    setAddingMotif(true);
    try {
      const res = await fetch(`${API_URL}/motifs-custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ label: newMotif })
      });
      if (res.status === 401) throw new Error('Authentification échouée. Veuillez vous reconnecter.');
      if (!res.ok) throw new Error(await res.text());
      const m = await res.json();
      onMotifAdded(m);
      setNewMotif('');
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setAddingMotif(false);
    }
  }

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
      <div className="form-row">
        <div className="field"><label>Prénom</label><input type="text" value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Prénom de l'artiste" /></div>
        <div className="field"><label>Nom</label><input type="text" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom de l'artiste" /></div>
      </div>
      <div className="form-row form-row--top">
        <div className="field"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} required /></div>
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
        <div className="pills-row">{ID_FIELDS.map(f => <CheckPill key={f.key} label={f.label} checked={!!form[f.key]} onChange={v => set(f.key, v)} />)}</div>
        <div className="field" style={{marginTop: '10px', maxWidth: '220px'}}>
          <label>N° adhérent</label>
          <input type="text" value={form.numero_adherent} onChange={e => set('numero_adherent', e.target.value)} placeholder="ex: 12345" />
        </div>
      </fieldset>
      <fieldset>
        <legend>Motifs standards</legend>
        <div className="pills-row">{MOTIF_FIELDS.map(f => <CheckPill key={f.key} label={f.label} accent checked={!!form[f.key]} onChange={v => set(f.key, v)} />)}</div>
      </fieldset>
      {customMotifs.length > 0 && (
        <fieldset>
          <legend>Motifs personnalisés</legend>
          <div className="pills-row">
            {customMotifs.map(m => (
              <div key={m.id} className="pill-with-delete">
                <label className={`pill ${(form.motifs_custom || []).includes(m.id) ? 'pill--on' : ''}`}>
                  <input type="checkbox" checked={(form.motifs_custom || []).includes(m.id)}
                    onChange={e => { const ids = form.motifs_custom || []; set('motifs_custom', e.target.checked ? [...ids, m.id] : ids.filter(id => id !== m.id)); }} />
                  {m.label}
                </label>
                <button type="button" className="pill-delete" title="Supprimer ce motif" onClick={() => onMotifDeleted(m.id)}>×</button>
              </div>
            ))}
          </div>
        </fieldset>
      )}
      <div className="field">
        <label>Ajouter un motif personnalisé</label>
        <div className="motif-add">
          <input type="text" value={newMotif} onChange={e => setNewMotif(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddMotif(e); } }}
            placeholder="Ex: Formation, Suivi pro…" disabled={addingMotif} />
          <button type="button" className="btn btn--sm btn--secondary" onClick={handleAddMotif} disabled={addingMotif || !newMotif.trim()}>
            {addingMotif ? '...' : '+ Ajouter'}
          </button>
        </div>
      </div>
      <div className="form-row">
        <div className="field"><label>E-mail</label><input type="email" value={form.mail} onChange={e => set('mail', e.target.value)} placeholder="artiste@example.com" /></div>
        <div className="field"><label>Téléphone</label><input type="text" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 XX XX XX XX" /></div>
      </div>
      <fieldset>
        <legend>Conseiller·ère</legend>
        <div className="pills-row">
          {CONSEILLERS.map(({ key, label }) => <CheckPill key={key} label={label} checked={!!form[key]} onChange={v => set(key, v)} />)}
        </div>
      </fieldset>
      <div className="field"><label>Remarques / Thèmes</label><textarea rows={3} value={form.remarques} onChange={e => set('remarques', e.target.value)} placeholder="Résumé de l'échange…" /></div>
      <div className="field"><label>Suivi</label><textarea rows={2} value={form.suivi} onChange={e => set('suivi', e.target.value)} placeholder="À rappeler, transmis à…" /></div>
      <div className="form-row">
        <div className="field"><label>Comment nous ont-ils connu ?</label><input type="text" value={form.comment_connu} onChange={e => set('comment_connu', e.target.value)} placeholder="Cercle Pro, Internet…" /></div>
        <div className="field field--center">
          <label>Options</label>
          <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
            <CheckPill label="Inscription NL" checked={!!form.newsletter} onChange={v => set('newsletter', v)} />
            <CheckPill label="🔔 À rappeler" checked={!!form.a_rappeler} onChange={v => set('a_rappeler', v)} accent />
          </div>
        </div>
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

function ContactTable({ contacts, onEdit, onDelete, customMotifs, onFiche, toggleSort, sort, checkinIds, onPrisEnCharge }) {
  function SortTh({ col, children }) {
    const active = sort.col === col;
    return (
      <th onClick={() => toggleSort(col)} style={{cursor:'pointer', userSelect:'none'}}>
        {children} {active ? (sort.dir === 'asc' ? '↑' : '↓') : <span style={{opacity:.3}}>↕</span>}
      </th>
    );
  }
  if (!contacts.length) return <div className="empty-state">Aucun contact enregistré pour cette période.</div>;
  return (
    <div className="table-wrapper">
      <table className="contacts-table">
        <thead><tr>
          <SortTh col="date">Date</SortTh>
          <th>Type</th>
          <SortTh col="artiste">Artiste</SortTh>
          <th>Profil</th>
          <th>Motif(s)</th>
          <th>Mail</th>
          <SortTh col="qui">Qui</SortTh>
          <th>Remarques</th>
          <th>Suivi</th>
          <th>Statut</th>
          <th></th>
        </tr></thead>
        <tbody>
          {contacts.map(row => {
            const enAttente = checkinIds && checkinIds.has(row.id);
            return (
            <tr key={row.id} className={`${row.a_rappeler ? 'tr--rappel' : ''} ${enAttente ? 'tr--checkin' : ''}`}>
              <td className="td-date">{formatDate(row.date)}</td>
              <td><span className={`badge badge--${row.type.toLowerCase()}`}>{row.type}</span></td>
              <td className="td-artiste">
                {[row.prenom, row.nom].filter(Boolean).join(' ')
                  ? <button className="artiste-link" onClick={() => onFiche(`${row.prenom||''} ${row.nom||''}`.trim())}>{[row.prenom, row.nom].filter(Boolean).join(' ')}</button>
                  : '—'}
                {row.a_rappeler && <span className="rappel-dot" title="À rappeler">🔔</span>}
                {row.numero_adherent && <div className="td-artiste__num" style={{fontSize:'.78em', color:'var(--muted)'}}>N° {row.numero_adherent}</div>}
              </td>
              <td className="td-profil">{getIdLabel(row)}</td>
              <td className="td-motif">{getMotifs(row, customMotifs)}</td>
              <td className="td-mail">{row.mail ? <a href={`mailto:${row.mail}`}>{row.mail}</a> : '—'}</td>
              <td>{getQui(row)}</td>
              <td className="td-remarques" title={row.remarques}>{row.remarques || '—'}</td>
              <td className="td-suivi" title={row.suivi}>{row.suivi ? <span className="suivi-badge">🔔 {row.suivi}</span> : '—'}</td>
              <td className="td-statut">
                {enAttente
                  ? <button className="checkin-badge" onClick={() => onPrisEnCharge(row.id)} title="Marquer comme pris en charge">⏳ En attente — Pris en charge ✓</button>
                  : '—'}
              </td>
              <td className="td-actions">
                <button className="btn-icon" onClick={() => onEdit(row)} title="Modifier">✏️</button>
                <button className="btn-icon btn-icon--del" onClick={() => onDelete(row.id)} title="Supprimer">🗑️</button>
              </td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
}

function FicheArtiste({ nom, contacts, customMotifs, onClose, onEdit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Historique — {nom}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <p className="modal-sub">
          {contacts.length} passage{contacts.length > 1 ? 's' : ''} en permanence
          {(() => { const withNum = contacts.find(c => c.numero_adherent); return withNum ? ` — N° adhérent ${withNum.numero_adherent}` : ''; })()}
        </p>
        {contacts.length === 0
          ? <p className="empty-state">Aucun passage trouvé.</p>
          : <div className="fiche-list">
              {contacts.map(row => (
                <div key={row.id} className={`fiche-item ${row.a_rappeler ? 'fiche-item--rappel' : ''}`}>
                  <div className="fiche-item__header">
                    <span className="td-date">{formatDate(row.date)}</span>
                    <span className={`badge badge--${row.type.toLowerCase()}`}>{row.type}</span>
                    <span className="fiche-qui">{getQui(row)}</span>
                    {row.a_rappeler && <span className="rappel-dot">🔔 À rappeler</span>}
                    <button className="btn-icon" onClick={() => { onEdit(row); onClose(); }} title="Modifier">✏️</button>
                  </div>
                  {row.remarques && <p className="fiche-item__text"><strong>Remarques :</strong> {row.remarques}</p>}
                  {row.suivi && <p className="fiche-item__text fiche-item__suivi"><strong>Suivi :</strong> {row.suivi}</p>}
                  {getMotifs(row, customMotifs) !== '—' && <p className="fiche-item__text"><strong>Motifs :</strong> {getMotifs(row, customMotifs)}</p>}
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}


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
  const maxQui = Math.max(Number(qui.ck)||0, Number(qui.kr)||0, Number(qui.lv)||0, Number(qui.vc)||0, Number(qui.cc)||0, 1);
  return (
    <div className="dashboard">
      <div className="stats-cards">
        <div className="stat-card"><span className="stat-card__val">{total}</span><span className="stat-card__label">Contacts total</span></div>
        <div className="stat-card stat-card--tel"><span className="stat-card__val">{tel}</span><span className="stat-card__label">📞 Téléphone</span></div>
        <div className="stat-card stat-card--pres"><span className="stat-card__val">{pres}</span><span className="stat-card__label">🤝 Présentiel</span></div>
      </div>
      <div className="stats-section">
        <h3>Motifs</h3>
        {Object.entries(MOTIF_LABELS).map(([k, l]) => <StatBar key={k} label={l} value={Number(motifs[k]) || 0} max={maxMotif} color="var(--blue)" />)}
      </div>
      <div className="stats-section">
        <h3>Par conseiller·ère</h3>
        {[['ck','CK'],['kr','KR'],['lv','LV'],['vc','VC'],['cc','CC']].map(([k,l]) => (
          <StatBar key={k} label={l} value={Number(qui[k])||0} max={maxQui} color="var(--yellow)" />
        ))}
      </div>
    </div>
  );
}

const MOTIFS_TEMPS = [
  { value: 'CP', label: 'Congé payé' },
  { value: 'RTT', label: 'RTT / Récupération' },
  { value: 'MALADIE', label: 'Maladie' },
  { value: 'FERIE', label: 'Jour férié' },
  { value: 'MEDICAL', label: 'Médical' },
  { value: 'AUTRE', label: 'Autre' },
];

function getMoisActuel() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function getDaysInMonth(mois) {
  const [y, m] = mois.split('-').map(Number);
  const days = [];
  const last = new Date(y, m, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const date = new Date(y, m-1, d);
    days.push({
      date: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNum: d,
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    });
  }
  return days;
}

function BaseHoraireEditor({ user, onSave, onCancel }) {
  const [heuresSemaine, setHeuresSemaine] = useState(user.heures_semaine_base);
  const [joursSemaine, setJoursSemaine] = useState(user.jours_semaine_base);
  const [contratMois, setContratMois] = useState(user.heures_contrat_mois);

  function suggererContrat() {
    // Mensualisation classique : heures/semaine × 52 / 12
    const val = Math.round((parseFloat(heuresSemaine) || 0) * 52 / 12 * 100) / 100;
    setContratMois(val);
  }

  return (
    <div style={{display:'flex', flexWrap:'wrap', alignItems:'center', gap:'6px'}}>
      <input type="number" step="0.5" min="0" value={heuresSemaine} autoFocus
        onChange={e => setHeuresSemaine(e.target.value)} style={{width:'56px'}} title="Heures / semaine" />
      <span style={{fontSize:'.85em', color:'var(--muted)'}}>h/sem sur</span>
      <input type="number" step="0.5" min="0" max="7" value={joursSemaine}
        onChange={e => setJoursSemaine(e.target.value)} style={{width:'44px'}} title="Jours / semaine" />
      <span style={{fontSize:'.85em', color:'var(--muted)'}}>j</span>
      <button type="button" className="btn-icon" title="Suggérer le contrat mensuel (mensualisation)" onClick={suggererContrat}>≈</button>
      <input type="number" step="0.01" min="0" value={contratMois}
        onChange={e => setContratMois(e.target.value)} style={{width:'70px'}} title="Contrat mensuel (h)" />
      <span style={{fontSize:'.85em', color:'var(--muted)'}}>h/mois</span>
      <button type="button" className="btn btn--sm btn--primary"
        onClick={() => onSave({ heures_semaine_base: heuresSemaine, jours_semaine_base: joursSemaine, heures_contrat_mois: contratMois })}>
        ✓
      </button>
      <button type="button" className="btn btn--sm btn--ghost" onClick={onCancel}>✕</button>
    </div>
  );
}

function TimesheetView({ token, currentUser, showToast }) {
  const [mois, setMois] = useState(getMoisActuel());
  const [entries, setEntries] = useState({});
  const [locked, setLocked] = useState(false);
  const [holidays, setHolidays] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [adminSummary, setAdminSummary] = useState(null);
  const [adminMois, setAdminMois] = useState(getMoisActuel());
  const [viewMode, setViewMode] = useState('mine'); // 'mine' | 'admin'
  const [adminTargetUser, setAdminTargetUser] = useState(null);
  const [editingContrat, setEditingContrat] = useState(null);
  const [clipboard, setClipboard] = useState(null);

  const apiFetch = useCallback((url, options = {}) =>
    fetch(url, { ...options, headers: { 'Content-Type': 'application/json', 'Authorization': token, ...(options.headers||{}) } }),
    [token]
  );

  const loadEntries = useCallback(async (targetUserId = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ mois });
      if (targetUserId) params.set('user_id', targetUserId);
      const res = await apiFetch(`${API_URL}/timesheet/entries?${params}`);
      const data = await res.json();
      const map = {};
      (data.entries || []).forEach(e => { map[e.date.slice(0,10)] = e; });
      setEntries(map);
      setLocked(data.locked);
      setUserInfo(data.user);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [mois, apiFetch]);

  const loadHolidays = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/timesheet/holidays?year=${mois.slice(0,4)}`);
      const data = await res.json();
      setHolidays(new Set(data));
    } catch(e) { console.error(e); }
  }, [mois, apiFetch]);

  const loadAdminSummary = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/timesheet/admin/summary?mois=${adminMois}`);
      const data = await res.json();
      setAdminSummary(data);
    } catch(e) { console.error(e); }
  }, [adminMois, apiFetch]);

  useEffect(() => { loadHolidays(); }, [loadHolidays]);
  useEffect(() => {
    if (viewMode === 'mine') loadEntries(adminTargetUser);
  }, [mois, viewMode, adminTargetUser, loadEntries]);
  useEffect(() => {
    if (viewMode === 'admin' && currentUser?.is_admin) loadAdminSummary();
  }, [adminMois, viewMode, currentUser, loadAdminSummary]);

  async function saveEntry(date, field, value, bulkFields = null) {
    const current = entries[date] || {};
    const updated = field === '_bulk' ? { ...current, ...bulkFields } : { ...current, [field]: value };
    setEntries(e => ({ ...e, [date]: updated }));

    const payload = {
      date,
      heure_debut: updated.heure_debut || null,
      heure_fin: updated.heure_fin || null,
      pause_minutes: updated.pause_minutes || 0,
      motif: updated.motif || null,
      precision: updated.precision || null,
    };
    if (adminTargetUser) payload.user_id = adminTargetUser;

    try {
      const res = await apiFetch(`${API_URL}/timesheet/entries`, { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur', 'error');
        loadEntries(adminTargetUser);
        return;
      }
      setEntries(e => ({ ...e, [date]: data }));
    } catch(e) {
      showToast('Erreur réseau', 'error');
    }
  }

  async function toggleLock() {
    try {
      const res = await apiFetch(`${API_URL}/timesheet/lock`, {
        method: 'POST',
        body: JSON.stringify({ mois, locked: !locked, user_id: adminTargetUser })
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); return; }
      setLocked(data.locked);
      showToast(data.locked ? 'Mois verrouillé' : 'Mois déverrouillé');
    } catch(e) { showToast('Erreur', 'error'); }
  }

  async function saveContrat(userId, fields) {
    try {
      const res = await apiFetch(`${API_URL}/timesheet/users/${userId}/contrat`, {
        method: 'PUT', body: JSON.stringify(fields)
      });
      if (!res.ok) { const d = await res.json(); showToast(d.error || 'Erreur', 'error'); return; }
      showToast('Horaire de base mis à jour');
      setEditingContrat(null);
      loadAdminSummary();
    } catch(e) { showToast('Erreur', 'error'); }
  }

  function changeMois(delta) {
    const [y, m] = mois.split('-').map(Number);
    const d = new Date(y, m-1+delta, 1);
    setMois(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }

  function exportExcel() {
    const params = new URLSearchParams({ mois });
    if (adminTargetUser) params.set('user_id', adminTargetUser);
    window.open(`${API_URL}/timesheet/export?${params}&token=${token}`, '_blank');
  }

  const HORAIRE_DEFAUT = { heure_debut: '09:30', heure_fin: '17:30', pause_minutes: 60 };

  async function prefillMonth() {
    const days = getDaysInMonth(mois);
    const toFill = days.filter(d => !d.isWeekend && !holidays.has(d.date) && !entries[d.date]?.heure_debut);
    if (toFill.length === 0) { showToast('Aucun jour vide à préremplir', 'error'); return; }
    if (!window.confirm(`Préremplir ${toFill.length} jour(s) avec l'horaire 9h30-17h30 (pause 1h) ?`)) return;
    for (const d of toFill) {
      await saveEntry(d.date, '_bulk', null, HORAIRE_DEFAUT);
    }
    showToast(`${toFill.length} jour(s) préremplis`);
  }

  function copyDay(date) {
    const e = entries[date];
    if (!e || !e.heure_debut) { showToast('Aucun horaire à copier ce jour-là', 'error'); return; }
    setClipboard({
      heure_debut: e.heure_debut?.slice(0,5),
      heure_fin: e.heure_fin?.slice(0,5),
      pause_minutes: e.pause_minutes || 0
    });
    showToast('Horaire copié — collez-le sur d\'autres jours');
  }

  async function pasteDay(date) {
    if (!clipboard) return;
    await saveEntry(date, '_bulk', null, clipboard);
  }

  async function pasteRestOfMonth(fromDate) {
    if (!clipboard) return;
    const days = getDaysInMonth(mois);
    const target = days.filter(d => d.date > fromDate && !d.isWeekend && !holidays.has(d.date));
    if (target.length === 0) return;
    if (!window.confirm(`Coller cet horaire sur les ${target.length} jours ouvrés restants du mois ?`)) return;
    for (const d of target) {
      await saveEntry(d.date, '_bulk', null, clipboard);
    }
    showToast(`Horaire collé sur ${target.length} jour(s)`);
  }

  const days = getDaysInMonth(mois);
  const totals = Object.values(entries).reduce((acc, e) => ({
    reg: acc.reg + parseFloat(e.heures_reg||0),
    sup: acc.sup + parseFloat(e.heures_sup||0),
  }), { reg: 0, sup: 0 });

  const moisLabel = new Date(mois+'-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  if (currentUser?.is_admin && viewMode === 'admin') {
    return (
      <div className="timesheet">
        <div className="timesheet__header">
          <h2>Feuille de temps — Vue admin</h2>
          <div className="timesheet__nav">
            <button className="btn btn--ghost btn--sm" onClick={() => setViewMode('mine')}>← Ma feuille de temps</button>
          </div>
        </div>
        <div className="timesheet__toolbar">
          <input type="month" value={adminMois} onChange={e => setAdminMois(e.target.value)} />
        </div>
        {!adminSummary ? <div className="loading">Chargement…</div> : (
          <div className="table-wrapper">
            <table className="contacts-table">
              <thead><tr><th>Salarié·e</th><th>Horaire de base</th><th>Contrat (h/mois)</th><th>Jours saisis</th><th>H. régulières</th><th>H. sup</th><th>Statut</th><th>Motifs</th><th></th></tr></thead>
              <tbody>
                {adminSummary.map(u => (
                  <tr key={u.user_id}>
                    <td><strong>{u.display_name}</strong> <span className="badge badge--tel">{u.initiales}</span></td>
                    <td colSpan={editingContrat === u.user_id ? 2 : 1}>
                      {editingContrat === u.user_id ? (
                        <BaseHoraireEditor user={u} onSave={fields => saveContrat(u.user_id, fields)} onCancel={() => setEditingContrat(null)} />
                      ) : (
                        <span onClick={() => setEditingContrat(u.user_id)} style={{cursor:'pointer', borderBottom:'1px dashed var(--muted)'}}
                          title="Cliquer pour modifier l'horaire de base et le contrat mensuel">
                          {u.heures_semaine_base}h/sem · {u.jours_semaine_base}j
                        </span>
                      )}
                    </td>
                    {editingContrat !== u.user_id && <td>{u.heures_contrat_mois}h</td>}
                    <td>{u.jours_saisis}</td>
                    <td>{u.total_reg}h</td>
                    <td>{u.total_sup > 0 ? <strong style={{color:'var(--blue)'}}>{u.total_sup}h</strong> : '—'}</td>
                    <td>{u.locked ? <span className="badge badge--manq">🔒 Verrouillé</span> : <span className="badge badge--dec">Ouvert</span>}</td>
                    <td className="td-motif">
                      {Object.entries(u.motifs).map(([m,c]) => `${MOTIFS_TEMPS.find(x=>x.value===m)?.label||m}: ${c}`).join(', ') || '—'}
                    </td>
                    <td>
                      <button className="btn-icon" title="Voir/modifier" onClick={() => { setAdminTargetUser(u.user_id); setMois(adminMois); setViewMode('mine'); }}>✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="timesheet">
      <div className="timesheet__header">
        <h2>🕐 Feuille de temps {adminTargetUser && userInfo ? `— ${userInfo.display_name}` : ''}</h2>
        <div className="timesheet__nav">
          {currentUser?.is_admin && (
            adminTargetUser
              ? <button className="btn btn--ghost btn--sm" onClick={() => { setAdminTargetUser(null); loadEntries(null); }}>← Ma feuille</button>
              : <button className="btn btn--ghost btn--sm" onClick={() => setViewMode('admin')}>👥 Vue équipe</button>
          )}
        </div>
      </div>

      <div className="timesheet__toolbar">
        <button className="btn btn--ghost btn--sm" onClick={() => changeMois(-1)}>← Mois préc.</button>
        <span className="timesheet__mois">{moisLabel}</span>
        <button className="btn btn--ghost btn--sm" onClick={() => changeMois(1)}>Mois suiv. →</button>
        <div style={{flex:1}}></div>
        {(!locked || currentUser?.is_admin) && (
          <button className="btn btn--ghost btn--sm" onClick={prefillMonth}>📋 Préremplir 9h30-17h30</button>
        )}
        {locked && <span className="badge badge--manq" style={{marginRight:8}}>🔒 Mois verrouillé</span>}
        {(!locked || currentUser?.is_admin) && (
          <button className={`btn btn--sm ${locked ? 'btn--primary' : 'btn--export'}`} onClick={toggleLock}>
            {locked ? 'Déverrouiller' : 'Verrouiller le mois'}
          </button>
        )}
        <button className="btn btn--ghost btn--sm" onClick={exportExcel}>⬇ Export Excel</button>
      </div>

      {userInfo && (
        <div className="timesheet__summary">
          <div className="timesheet__stat"><span className="timesheet__stat-val">{Math.round(totals.reg*100)/100}h</span><span className="timesheet__stat-label">Heures régulières</span></div>
          <div className="timesheet__stat"><span className="timesheet__stat-val">{Math.round(totals.sup*100)/100}h</span><span className="timesheet__stat-label">Heures sup</span></div>
          <div className="timesheet__stat"><span className="timesheet__stat-val">{userInfo.heures_contrat_mois}h</span><span className="timesheet__stat-label">Contrat mensuel</span></div>
          <div className="timesheet__stat"><span className="timesheet__stat-val">{Math.round(((userInfo.heures_semaine_base||35)/(userInfo.jours_semaine_base||5))*100)/100}h/j</span><span className="timesheet__stat-label">Seuil journalier ({userInfo.heures_semaine_base||35}h/sem)</span></div>
    <span
  className="timesheet__stat-val"
  style={{
    color:
      (totals.reg + totals.sup) - userInfo.heures_contrat_mois >= 0
        ? 'var(--mint)'
        : '#e53e3e'
  }}
>
  {(totals.reg + totals.sup) - userInfo.heures_contrat_mois >= 0 ? '+' : ''}
  {Math.round(
    (
      (totals.reg + totals.sup) -
      userInfo.heures_contrat_mois
    ) * 100
  ) / 100}h
</span></div>
        </div>
      )}

      {loading ? <div className="loading">Chargement…</div> : (
        <div className="table-wrapper">
          <table className="contacts-table timesheet-table">
            <thead><tr><th>Jour</th><th>Date</th><th>Début</th><th>Fin</th><th>Pause (min)</th><th>Motif</th><th>Précision</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {days.map(day => {
                const e = entries[day.date] || {};
                const isHoliday = holidays.has(day.date);
                const disabled = locked && !currentUser?.is_admin;
                return (
                  <tr key={day.date} className={day.isWeekend ? 'tr--weekend' : isHoliday ? 'tr--holiday' : ''}>
                    <td style={{textTransform:'capitalize'}}>{day.dayName}</td>
                    <td>{day.dayNum}</td>
                    <td><input type="time" value={e.heure_debut?.slice(0,5) || ''} disabled={disabled}
                      onChange={ev => saveEntry(day.date, 'heure_debut', ev.target.value)} /></td>
                    <td><input type="time" value={e.heure_fin?.slice(0,5) || ''} disabled={disabled}
                      onChange={ev => saveEntry(day.date, 'heure_fin', ev.target.value)} /></td>
                    <td><input type="number" min="0" step="5" value={e.pause_minutes || ''} disabled={disabled} style={{width:'60px'}}
                      onChange={ev => saveEntry(day.date, 'pause_minutes', parseInt(ev.target.value)||0)} /></td>
                    <td>
                      <select value={e.motif || ''} disabled={disabled} onChange={ev => saveEntry(day.date, 'motif', ev.target.value)}>
                        <option value="">—</option>
                        {MOTIFS_TEMPS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </td>
                    <td><input type="text" value={e.precision || ''} disabled={disabled} placeholder="ex: Caen, Live Pro…"
                      onChange={ev => saveEntry(day.date, 'precision', ev.target.value)} /></td>
                    <td><strong>{e.heures_total ? `${e.heures_total}h` : isHoliday ? 'Férié' : day.isWeekend ? '' : '—'}</strong></td>
                    <td className="td-actions">
                      {!disabled && !day.isWeekend && !isHoliday && (
                        <>
                          <button className="btn-icon" title="Copier cet horaire" onClick={() => copyDay(day.date)}>📋</button>
                          {clipboard && (
                            <>
                              <button className="btn-icon" title="Coller ici" onClick={() => pasteDay(day.date)}>📥</button>
                              <button className="btn-icon" title="Coller sur le reste du mois" onClick={() => pasteRestOfMonth(day.date)}>📥➡</button>
                            </>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('mda_token') || '');
  const [currentUser, setCurrentUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem('mda_user') || 'null'); } catch { return null; } });
  const [view, setView] = useState('list');
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(null);
  const [customMotifs, setCustomMotifs] = useState([]);
  const [filters, setFilters] = useState({ type: '', from: '', to: '', conseiller: '', a_rappeler: false });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ col: 'date', dir: 'desc' });
  const [ficheArtiste, setFicheArtiste] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('mda_dark') === '1');
  const [lastRefresh, setLastRefresh] = useState(null);
  const PAGE_SIZE = 50;

  // Rappel CSV Orange Business
  const getRappelCSV = () => {
    const now = new Date();
    const moisCourant = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fait = localStorage.getItem(`csv_fait_${moisCourant}`);
    if (fait) return null;
    // Rappel du 1er au 15 du mois suivant (1 mois = données disponibles 1 mois et demi)
    const moisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nomMois = moisPrecedent.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const dateLimite = new Date(now.getFullYear(), now.getMonth(), 15);
    const joursRestants = Math.ceil((dateLimite - now) / (1000 * 60 * 60 * 24));
    const urgent = joursRestants <= 5;
    // N'afficher qu'à partir du 1er du mois
    if (now.getDate() < 1) return null;
    return { nomMois, dateLimite, joursRestants, urgent, moisCourant };
  };
  const [rappelCSV, setRappelCSV] = useState(getRappelCSV);
  const [toast, setToast] = useState(null);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === 'checkin' ? 6000 : 3000);
  }

  function handleLogin(t, user) {
    sessionStorage.setItem('mda_token', t);
    sessionStorage.setItem('mda_user', JSON.stringify(user));
    setToken(t); setCurrentUser(user);
  }

  function handleLogout() {
    sessionStorage.removeItem('mda_token');
    sessionStorage.removeItem('mda_user');
    setToken(''); setCurrentUser(null);
  }

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
    try {
      const res = await apiFetch(`${API_URL}/contacts?${params}`);
      if (res.status === 401) { handleLogout(); return; }
      const newContacts = await res.json();
      setContacts(newContacts);
      setLastRefresh(new Date());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters, apiFetch]);

  const loadCustomMotifs = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/motifs-custom`);
      if (res.status === 401) { handleLogout(); return; }
      setCustomMotifs(await res.json());
    } catch(e) { console.error(e); }
  }, [apiFetch]);

  const loadStats = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to)   params.set('to', filters.to);
    try {
      const res = await apiFetch(`${API_URL}/stats?${params}`);
      setStats(await res.json());
    } catch(e) { console.error(e); }
  }, [filters, apiFetch]);

  useEffect(() => { if (token) { loadContacts(); loadCustomMotifs(); } }, [token, loadContacts, loadCustomMotifs]);
  useEffect(() => { if (token && view === 'stats') loadStats(); }, [token, view, loadStats]);
  useEffect(() => { if (token) loadContacts(); }, [filters]);
  useEffect(() => { setPage(1); }, [search, filters]);

  // Rafraîchit la liste des contacts périodiquement, mais uniquement quand
  // l'onglet est visible et actif. Ancien comportement : refetch complet
  // toutes les 20s en permanence, même onglet en arrière-plan -> gros excès
  // de transfert de données (5+ Go/mois pour une base de 30 Mo). Nouveau
  // comportement : intervalle allongé à 90s, suspendu quand l'onglet n'est
  // pas visible, et refresh immédiat au retour sur l'onglet.
  useEffect(() => {
    if (!token || view !== 'list') return;

    let interval = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => loadContacts(), 90000);
    };
    const stopPolling = () => {
      if (interval) { clearInterval(interval); interval = null; }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadContacts(); // rattrape ce qui a pu changer pendant l'absence
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === 'visible') startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, view, loadContacts]);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('mda_dark', darkMode ? '1' : '0');
  }, [darkMode]);

  const filteredContacts = contacts.filter(c => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(c.prenom || '').toLowerCase().includes(q) &&
          !(c.nom || '').toLowerCase().includes(q) &&
          !(c.mail || '').toLowerCase().includes(q)) return false;
    }
    if (filters.conseiller) {
      const key = `qui_${filters.conseiller.toLowerCase()}`;
      if (!c[key]) return false;
    }
    if (filters.a_rappeler && !c.a_rappeler) return false;
    return true;
  }).sort((a, b) => {
    let va = a[sort.col] || ''; let vb = b[sort.col] || '';
    if (sort.col === 'date') { va = a.date || ''; vb = b.date || ''; }
    if (sort.col === 'artiste') { va = `${a.prenom||''} ${a.nom||''}`.trim(); vb = `${b.prenom||''} ${b.nom||''}`.trim(); }
    if (sort.col === 'qui') { va = getQui(a); vb = getQui(b); }
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  function toggleSort(col) {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const pagedContacts = filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const ficheContacts = ficheArtiste
    ? contacts.filter(c => {
        const nom = `${c.prenom||''} ${c.nom||''}`.trim().toLowerCase();
        return nom && nom === ficheArtiste.toLowerCase();
      }).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  function handleSaved(contact, isUpdate) {
    if (isUpdate) setContacts(cs => cs.map(c => c.id === contact.id ? contact : c));
    else setContacts(cs => [contact, ...cs]);
    setEditing(null); setView('list');
    showToast(isUpdate ? 'Contact mis à jour' : 'Contact enregistré');
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce contact ?')) return;
    await apiFetch(`${API_URL}/contacts/${id}`, { method: 'DELETE' });
    setContacts(cs => cs.filter(c => c.id !== id));
    showToast('Contact supprimé', 'error');
  }

  async function handlePrisEnCharge(id) {
    try {
      const res = await apiFetch(`${API_URL}/contacts/${id}/pris-en-charge`, { method: 'PUT' });
      if (!res.ok) { showToast('Erreur', 'error'); return; }
      const updated = await res.json();
      setContacts(cs => cs.map(c => c.id === id ? updated : c));
      showToast('Marqué comme pris en charge');
    } catch(e) { showToast('Erreur réseau', 'error'); }
  }

  function handleMotifAdded(m) { setCustomMotifs(ms => [...ms, m]); }
  async function handleMotifDeleted(id) {
    if (!window.confirm('Supprimer ce motif personnalisé ?')) return;
    await apiFetch(`${API_URL}/motifs-custom/${id}`, { method: 'DELETE' });
    setCustomMotifs(ms => ms.filter(m => m.id !== id));
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.from) params.set('from', filters.from);
    if (filters.to)   params.set('to', filters.to);
    if (filters.conseiller) params.set('conseiller', filters.conseiller);
    if (filters.a_rappeler) params.set('a_rappeler', '1');
    window.open(`${API_URL}/export/csv?${params}`, '_blank');
  }

  return (
    <div className="app" onClick={() => setShowUserMenu(false)}>
      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
      {ficheArtiste && <FicheArtiste nom={ficheArtiste} contacts={ficheContacts} customMotifs={customMotifs} onClose={() => setFicheArtiste(null)} onEdit={row => { setEditing(row); setFicheArtiste(null); setView('list'); }} />}
      {showChangePwd && <ChangePasswordModal token={token} onClose={() => setShowChangePwd(false)} showToast={showToast} />}

      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo" onClick={() => { setEditing(null); setView('list'); }}>MDA</span>
          <div>
            <div className="app-header__title">Suivi des permanences</div>
            <div className="app-header__sub">La Maison des Artistes · 2026</div>
          </div>
        </div>
        <nav className="app-nav">
          <button className={`nav-btn ${view === 'list' ? 'nav-btn--on' : ''}`} onClick={() => { setEditing(null); setView('list'); }}>Liste</button>
          <button className={`nav-btn ${view === 'new' ? 'nav-btn--on' : ''}`} onClick={() => { setEditing(null); setView('new'); }}>+ Nouveau</button>
          <button className={`nav-btn ${view === 'stats' ? 'nav-btn--on' : ''}`} onClick={() => setView('stats')}>Statistiques</button>
          <button className={`nav-btn ${view === 'timesheet' ? 'nav-btn--on' : ''}`} onClick={() => setView('timesheet')}>🕐 Temps</button>
          {currentUser?.is_admin && (
            <button className={`nav-btn ${view === 'admin' ? 'nav-btn--on' : ''}`} onClick={() => setView('admin')}>⚙ Comptes</button>
          )}
          <div className="user-menu-wrap" onClick={e => e.stopPropagation()}>
            <button className="user-avatar" onClick={() => setShowUserMenu(v => !v)}>
              {currentUser?.initiales || '?'}
            </button>
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu__name">{currentUser?.display_name}</div>
                <button className="user-menu__item" onClick={() => { setShowChangePwd(true); setShowUserMenu(false); }}>🔑 Changer mon mot de passe</button>
                <button className="user-menu__item user-menu__item--logout" onClick={handleLogout}>⎋ Déconnexion</button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <div className="app-filters">
        <input type="text" className="filter-search" placeholder="🔍 Rechercher par nom, prénom, e-mail…" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          <option value="">Tous types</option>
          <option value="TEL">Téléphone</option>
          <option value="PRES">Présentiel</option>
        </select>
        <select value={filters.conseiller} onChange={e => setFilters(f => ({ ...f, conseiller: e.target.value }))}>
          <option value="">Tous conseillers</option>
          {CONSEILLERS.map(c => <option key={c.key} value={c.label}>{c.label}</option>)}
        </select>
        <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
        <input type="date" value={filters.to}   onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
        <label className={`filter-toggle ${filters.a_rappeler ? 'filter-toggle--on' : ''}`}>
          <input type="checkbox" checked={filters.a_rappeler} onChange={e => setFilters(f => ({ ...f, a_rappeler: e.target.checked }))} />
          🔔 À rappeler
        </label>
        <button className="btn btn--ghost btn--sm" onClick={() => { setFilters({ type: '', from: '', to: '', conseiller: '', a_rappeler: false }); setSearch(''); }}>Réinitialiser</button>
        <button className="btn btn--export btn--sm" onClick={handleExport}>⬇ Export CSV</button>
        <button className="btn btn--ghost btn--sm" onClick={() => setDarkMode(d => !d)} title="Mode sombre">{darkMode ? '☀️' : '🌙'}</button>
        <span className="filter-count">{filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''}</span>
        {lastRefresh && <span className="refresh-indicator" title="Mis à jour automatiquement toutes les 20s">🔄 {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
      </div>

      <main className="app-main">
        {view === 'new' && !editing && (
          <section className="section-form">
            <h2>Nouveau contact</h2>
            <ContactForm token={token} customMotifs={customMotifs} onSaved={handleSaved} onCancel={() => setView('list')} onMotifAdded={handleMotifAdded} onMotifDeleted={handleMotifDeleted} currentUser={currentUser} />
          </section>
        )}
        {editing && (
          <section className="section-form">
            <h2>Modifier le contact</h2>
            <ContactForm token={token} customMotifs={customMotifs} initial={editing} onSaved={handleSaved} onCancel={() => { setEditing(null); setView('list'); }} onMotifAdded={handleMotifAdded} onMotifDeleted={handleMotifDeleted} currentUser={currentUser} />
          </section>
        )}
        {view === 'list' && !editing && (
          <section>
            <div className="day-counters">
              <div className="day-counter day-counter--total">
                <div className="day-counter__val">
                  {contacts.filter(c => c.date && c.date.slice(0,10) === new Date().toISOString().slice(0,10)).length}
                </div>
                <div className="day-counter__label">Rendez-vous aujourd'hui</div>
              </div>
              <div className="day-counter day-counter--attente">
                <div className="day-counter__val">{contacts.filter(c => !c.pris_en_charge && (c.remarques || '').includes('[Enregistrement tablette accueil]')).length}</div>
                <div className="day-counter__label">En attente</div>
              </div>
            </div>
            {rappelCSV && (
              <div className={`rappel-csv-banner ${rappelCSV.urgent ? 'rappel-csv-banner--urgent' : ''}`}>
                <span className="rappel-csv-banner__icon">{rappelCSV.urgent ? '⚠️' : '📥'}</span>
                <div className="rappel-csv-banner__body">
                  <div className="rappel-csv-banner__title">
                    {rappelCSV.urgent
                      ? `Urgent — Plus que ${rappelCSV.joursRestants} jour${rappelCSV.joursRestants > 1 ? 's' : ''} !`
                      : 'Rappel mensuel — Export Orange Business'}
                  </div>
                  <div className="rappel-csv-banner__detail">
                    Téléchargez le CSV des appels de <strong>{rappelCSV.nomMois}</strong> avant le{' '}
                    <strong>{rappelCSV.dateLimite.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</strong>
                    {' '}— les données ne sont conservées que 6 semaines sur le serveur Orange.
                  </div>
                </div>
                <div style={{display:'flex', gap:'8px', flexShrink:0}}>
                  <a href="https://telephony.teaming.orange-business.com/index/user_call_details/" target="_blank" className="rappel-csv-banner__btn rappel-csv-banner__btn--link">⬇ Télécharger CSV</a>
                  <a href="/webex/" target="_blank" className="rappel-csv-banner__btn rappel-csv-banner__btn--link">Importer →</a>
                  <button className="rappel-csv-banner__btn" onClick={() => {
                    localStorage.setItem(`csv_fait_${rappelCSV.moisCourant}`, '1');
                    setRappelCSV(null);
                  }}>C'est fait ✓</button>
                </div>
              </div>
            )}
            {loading ? <div className="loading">Chargement…</div> : <>
              <ContactTable contacts={pagedContacts} customMotifs={customMotifs} onEdit={row => setEditing(row)} onDelete={handleDelete} onFiche={setFicheArtiste} toggleSort={toggleSort} sort={sort}
                checkinIds={new Set(contacts.filter(c => !c.pris_en_charge && (c.remarques || '').includes('[Enregistrement tablette accueil]')).map(c => c.id))}
                onPrisEnCharge={handlePrisEnCharge} />
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="btn btn--ghost btn--sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Précédent</button>
                  <span className="pagination__info">Page {page} / {totalPages} <span className="pagination__sub">({filteredContacts.length} contacts)</span></span>
                  <button className="btn btn--ghost btn--sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant →</button>
                </div>
              )}
            </>}
          </section>
        )}
        {view === 'stats' && !editing && <section><Dashboard stats={stats} /></section>}
        {view === 'timesheet' && !editing && <section><TimesheetView token={token} currentUser={currentUser} showToast={showToast} /></section>}
        {view === 'admin' && currentUser?.is_admin && <section><AdminPanel token={token} showToast={showToast} /></section>}
      </main>
      <Footer />
    </div>
  );
}
