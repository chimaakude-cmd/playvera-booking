-- Extend support thread status for open/closed lifecycle

alter type public.thread_status add value if not exists 'open' before 'waiting';
alter type public.thread_status add value if not exists 'closed' after 'resolved';
