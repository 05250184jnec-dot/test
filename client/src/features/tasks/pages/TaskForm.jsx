/**
 * TaskForm - post a new task or edit an existing one (/employer/tasks/new or /employer/tasks/:id/edit).
 * FRONTEND: page of the "tasks" feature. Edit mode loads the task with taskApi.getTask, then saves with createTask / updateTask.
 * TALKS TO (backend): GET /api/tasks/:id -> controllers/taskController.js;
 *   POST /api/employer/tasks and PUT /api/employer/tasks/:id -> routes/employerRoutes.js -> controllers/employerTaskController.js -> models/taskModel.js
 * HOW IT WORKS: one form for both modes (edit = true when the URL has an :id). The browser checks the basics;
 * the server re-validates everything and returns per-field errors that we show under the inputs. Ownership is enforced in SQL.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as taskApi from '../taskApi.js';
import { CATEGORIES } from '../../../shared/constants.js';
import { Field } from '../../../shared/components/Field.jsx';
import { DataState } from '../../../shared/components/Loading.jsx';
import { useToast } from '../../../shared/components/Toast.jsx';

const blank = { title: '', category: 'Development', description: '', durationDays: 7, pay: 0, positions: 1, deadline: '', status: 'active' };

export default function TaskForm() {
  const { id } = useParams(); const edit = Boolean(id);
  const nav = useNavigate(); const qc = useQueryClient(); const toast = useToast();
  const [f, setF] = useState(blank); const [err, setErr] = useState({});
  const q = useQuery({ queryKey: ['tasks', 'detail', id], queryFn: () => taskApi.getTask(id), enabled: edit });
  useEffect(() => { if (q.data) setF({ title: q.data.title, category: q.data.category, description: q.data.description, durationDays: q.data.durationDays, pay: q.data.pay, positions: q.data.positions, deadline: String(q.data.deadline).slice(0, 10), status: q.data.status }); }, [q.data]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const m = useMutation({
    mutationFn: () => {
      const body = { ...f, durationDays: Number(f.durationDays), pay: Number(f.pay), positions: Number(f.positions) };
      return edit ? taskApi.updateTask(id, body) : taskApi.createTask(body);
    },
    onSuccess: () => { toast(edit ? 'Task updated' : 'Task posted'); qc.invalidateQueries({ queryKey: ['employer'] }); qc.invalidateQueries({ queryKey: ['tasks'] }); nav('/employer/tasks'); },
    onError: (e) => setErr(e.errors || { title: e.message }),
  });
  const submit = (e) => {
    e.preventDefault();
    const v = { title: f.title.trim().length < 3 ? 'At least 3 characters' : null, description: f.description.trim().length < 20 ? 'At least 20 characters' : null, deadline: f.deadline ? null : 'Pick a deadline',
      durationDays: Number(f.durationDays) < 1 ? 'At least 1 day' : null, pay: Number(f.pay) < 0 ? 'Cannot be negative' : null };
    setErr(v); if (!Object.values(v).some(Boolean)) m.mutate();
  };
  const form = (
    <form className="card stack narrow-form" onSubmit={submit} noValidate>
      <Field id="t" label="Title" error={err.title}><input id="t" className="input" maxLength={150} value={f.title} onChange={set('title')} /></Field>
      <div className="grid-2">
        <Field id="c" label="Category" error={err.category}><select id="c" className="input" value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field id="s" label="Status" error={err.status}><select id="s" className="input" value={f.status} onChange={set('status')}><option value="draft">Draft</option><option value="active">Active</option><option value="pending_review">Pending review</option><option value="completed">Completed</option></select></Field>
      </div>
      <Field id="d" label="Description" error={err.description}><textarea id="d" className="input" rows={7} maxLength={5000} value={f.description} onChange={set('description')} /></Field>
      <div className="grid-4">
        <Field id="du" label="Duration (days)" error={err.durationDays}><input id="du" className="input" type="number" min="1" max="365" value={f.durationDays} onChange={set('durationDays')} /></Field>
        <Field id="p" label="Pay (Nu)" error={err.pay}><input id="p" className="input" type="number" min="0" value={f.pay} onChange={set('pay')} /></Field>
        <Field id="po" label="Positions" error={err.positions}><input id="po" className="input" type="number" min="1" max="100" value={f.positions} onChange={set('positions')} /></Field>
        <Field id="dl" label="Deadline" error={err.deadline}><input id="dl" className="input" type="date" value={f.deadline} onChange={set('deadline')} /></Field>
      </div>
      <div className="actions"><button className="btn btn-primary" disabled={m.isPending}>{m.isPending ? 'Saving…' : edit ? 'Save changes' : 'Post task'}</button><button type="button" className="btn" onClick={() => nav('/employer/tasks')}>Cancel</button></div>
    </form>
  );
  return (<div className="stack"><div className="page-head"><h1>{edit ? 'Edit task' : 'Post a task'}</h1></div>{edit ? <DataState q={q} rows={2}>{() => form}</DataState> : form}</div>);
}
