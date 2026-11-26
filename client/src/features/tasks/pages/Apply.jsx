/**
 * Apply - task details + the application form (cover letter, available-from date) (/student/tasks/:id).
 * FRONTEND: page of the "tasks" feature. Loads the task with taskApi.getTask and sends the form with applicationApi.applyToTask.
 * TALKS TO (backend): GET /api/tasks/:id -> controllers/taskController.js (detail);
 *   POST /api/student/tasks/:id/apply -> routes/studentRoutes.js -> controllers/studentApplicationController.js (apply) -> models/applicationModel.js
 * HOW IT WORKS: if the student already applied, the form is replaced by a status message. Applying twice is also
 * blocked in the database by a UNIQUE key. On success we refresh the cached lists and go to My Applications.
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as taskApi from '../taskApi.js';
import * as applicationApi from '../../applications/applicationApi.js';
import { DataState } from '../../../shared/components/Loading.jsx';
import { Field } from '../../../shared/components/Field.jsx';
import { StatusPill } from '../../../shared/components/Badges.jsx';
import { Countdown } from '../../../shared/components/Countdown.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';
import { nu, fmtDate } from '../../../shared/utils/format.js';

export default function Apply() {
  const { id } = useParams(); const nav = useNavigate(); const qc = useQueryClient(); const toast = useToast();
  const q = useQuery({ queryKey: ['tasks', 'detail', id], queryFn: () => taskApi.getTask(id) });
  const [f, setF] = useState({ coverLetter: '', availableFrom: new Date().toISOString().slice(0, 10) });
  const [err, setErr] = useState({});
  const m = useMutation({
    mutationFn: () => applicationApi.applyToTask(id, f),
    onSuccess: () => { toast('Application sent! 🎉'); qc.invalidateQueries({ queryKey: ['student'] }); qc.invalidateQueries({ queryKey: ['tasks'] }); nav('/student/applications'); },
    onError: (e) => setErr(e.errors || { coverLetter: e.message }),
  });
  const submit = (e) => {
    e.preventDefault();
    const v = { coverLetter: f.coverLetter.trim().length < 20 ? 'Write at least 20 characters' : null, availableFrom: f.availableFrom ? null : 'Pick a date' };
    setErr(v); if (!v.coverLetter && !v.availableFrom) m.mutate();
  };
  return (
    <div className="stack">
      <Link to="/student/browse" className="small">← Back to tasks</Link>
      <DataState q={q} rows={2}>{(t) => (<div className="grid-2 wide-left">
        <section className="card stack">
          <div className="card-head"><span className="pill pill-primary">{t.category}</span><StatusPill status={t.status} /></div>
          <h1>{t.title}</h1><p className="muted">{t.organization}</p>
          <p className="pre">{t.description}</p>
          <div className="meta"><b>{nu(t.pay)}</b><span>{t.durationDays} days</span><span>{t.positions} position{t.positions > 1 ? 's' : ''}</span><span>Deadline {fmtDate(t.deadline)}</span><Countdown date={t.deadline} /></div>
        </section>
        <section className="card stack">
          <h3>Apply for this task</h3>
          {t.myApplication ? <div className="alert alert-info">You already applied · status <StatusPill status={t.myApplication.status} /> <Link to="/student/applications">View</Link></div> : (
            <form className="stack" onSubmit={submit} noValidate>
              <Field id="cl" label="Cover letter" error={err.coverLetter} hint="Why are you a good fit?"><textarea id="cl" className="input" rows={7} maxLength={3000} value={f.coverLetter} onChange={(e) => setF({ ...f, coverLetter: e.target.value })} /></Field>
              <Field id="af" label="Available from" error={err.availableFrom}><input id="af" className="input" type="date" value={f.availableFrom} onChange={(e) => setF({ ...f, availableFrom: e.target.value })} /></Field>
              <button className="btn btn-primary" disabled={m.isPending}>{m.isPending ? 'Sending…' : 'Send application'}</button>
            </form>)}
        </section>
      </div>)}</DataState>
    </div>
  );
}
