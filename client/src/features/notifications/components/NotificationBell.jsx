
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationApi from '../notificationApi.js';
import { fmtDateTime } from '../../../shared/utils/format.js';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationApi.listNotifications({ pageSize: 8 }), refetchOnWindowFocus: true });
  const done = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  const readOne = useMutation({ mutationFn: (id) => notificationApi.markRead(id), onSuccess: done });
  const readAll = useMutation({ mutationFn: () => notificationApi.markAllRead(), onSuccess: done });
  const unread = data?.unread || 0;
  return (
    <div className="bell-wrap">
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label={`Notifications, ${unread} unread`} aria-expanded={open}>🔔{unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}</button>
      {open && (
        <div className="bell-panel" role="menu">
          <div className="bell-head"><b>Notifications</b><button className="link" onClick={() => readAll.mutate()}>Mark all read</button></div>
          {!data?.items?.length && <p className="muted center pad">You're all caught up 🎉</p>}
          {data?.items?.map((n) => (
            <button key={n.id} className={`bell-item ${n.isRead ? '' : 'unread'}`} onClick={() => { readOne.mutate(n.id); setOpen(false); if (n.link) nav(n.link); }}>
              <b>{n.title}</b><span className="muted small">{n.body}</span><span className="muted tiny">{fmtDateTime(n.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
