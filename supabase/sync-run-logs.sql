-- Tabela genérica de logs de sincronização
create schema if not exists api;

create table if not exists api.sync_runs (
  id                bigserial primary key,
  resource          text not null,                      -- oportunidades | leads | segmentos | all
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  status            text,                               -- success | error | running | skipped
  total_processed   integer default 0,
  total_inserted    integer default 0,
  total_updated     integer default 0,
  total_errors      integer default 0,
  notes             text,
  details           jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists idx_sync_runs_started_at on api.sync_runs (started_at desc);
create index if not exists idx_sync_runs_resource on api.sync_runs (resource, started_at desc);

comment on table api.sync_runs is 'Logs de execuções das sincronizações (oportunidades, leads, segmentos)';
















