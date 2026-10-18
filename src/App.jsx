import { useState } from 'react';
import { useStore } from './store.js';
import Program from './Program.jsx';
import Progress from './Progress.jsx';
import Settings from './Settings.jsx';
import { Icon } from './ui.jsx';

const TABS = [
  { id: 'program', label: 'Program' },
  { id: 'progress', label: 'İlerleme' },
  { id: 'settings', label: 'Ayarlar' },
];

export default function App() {
  const store = useStore();
  const [tab, setTab] = useState('program');
  const go = (t) => {
    setTab(t);
    window.scrollTo(0, 0);
  };
  return (
    <div className="app">
      <main>
        {tab === 'program' && <Program {...store} />}
        {tab === 'progress' && <Progress {...store} />}
        {tab === 'settings' && <Settings {...store} />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => go(t.id)}>
            <Icon name={t.id} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
