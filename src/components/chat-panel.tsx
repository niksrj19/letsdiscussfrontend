'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { askQuestion } from '@/services/question-service';
import type { ChatMessage, User } from '@/types/api';

export function ChatPanel({ user }: { user: User }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, isAsking]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || isAsking) return;
    const prompt = question.trim();
    setQuestion(''); setError(''); setIsAsking(true);
    try {
      const response = await askQuestion(prompt);
      setMessages((current) => [...current, {
        question: prompt,
        answer: response.answer,
        sources: response.sources || [],
        time: new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date()),
      }]);
    } catch (reason) {
      setQuestion(prompt);
      setError(reason instanceof Error ? reason.message : 'Could not get an answer.');
    } finally { setIsAsking(false); }
  }

  return <div className="content">
    <div className="welcome"><div className="eyebrow"><span className="eyebrow-line"/> YOUR MARKET RESEARCH ASSISTANT</div><h1>Make sense of the<br/><span>market noise.</span></h1><p>Ask questions across your trusted sources. Every answer is grounded in the research you add.</p></div>
    <div className="chat-area" ref={feedRef}>
      {messages.length === 0 && <Starter onSelect={setQuestion}/>}
      {messages.map((message, index) => <Conversation key={`${index}-${message.time}`} message={message} name={user.name}/>)}
      {isAsking && <Thinking />}
    </div>
    {error && <div className="error-note chat-error">{error}</div>}
    <form className="composer" onSubmit={submit}>
      <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ask a question about your market sources…" rows={2}/>
      <div className="composer-footer"><span><kbd>↵</kbd> to ask <span className="footer-separator">·</span> <kbd>⇧ ↵</kbd> for a new line</span><button className="send-button" disabled={isAsking || !question.trim()} aria-label="Send question"><Icon name="send" size={16}/></button></div>
    </form>
    <div className="disclaimer">Answers are generated from your indexed sources and may need verification.</div>
  </div>;
}

function Starter({ onSelect }: { onSelect: (question: string) => void }) {
  return <div className="starter-card"><div className="starter-icon"><Icon name="spark" size={19}/></div><div><strong>Your research, in conversation.</strong><p>Add up to four market sources, then ask about trends, companies, or the bigger picture.</p><div className="suggestions"><button onClick={() => onSelect('What are the key themes across these sources?')}>Key themes <span>↗</span></button><button onClick={() => onSelect('Summarize the most important market developments.')}>Market developments <span>↗</span></button></div></div></div>;
}

function Conversation({ message, name }: { message: ChatMessage; name: string | null }) {
  return <div className="conversation">
    <div className="user-message"><div className="user-avatar">{name?.[0] || 'M'}</div><div><div className="message-meta">YOU <span>·</span> {message.time}</div><p>{message.question}</p></div></div>
    <div className="answer-card"><div className="answer-heading"><span className="answer-icon"><Icon name="spark" size={15}/></span><strong>MARKETLENS</strong><span className="answer-tag">GROUNDED ANSWER</span></div><div className="answer-text">{message.answer}</div>
      {message.sources.length > 0 && <div className="citation-area"><div className="citation-label">SOURCES</div><div className="citation-list">{message.sources.map((source) => <a key={`${source.label}-${source.url}`} className="citation" href={source.url} target="_blank" rel="noreferrer"><span>{source.label}</span><b>{source.title}</b><small>{source.chunkIndexes.length} passages ↗</small></a>)}</div></div>}
    </div>
  </div>;
}

function Thinking() {
  return <div className="answer-card loading-answer"><div className="answer-heading"><span className="answer-icon"><Icon name="spark" size={15}/></span><strong>MARKETLENS</strong><span className="answer-tag">SEARCHING SOURCES</span></div><div className="typing"><i/><i/><i/> Finding the relevant passages…</div></div>;
}
